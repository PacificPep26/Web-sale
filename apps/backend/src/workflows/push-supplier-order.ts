import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import {
  getSupplierClient,
  SupplierApiError,
  ManualFulfilmentRequired,
  type CreateOrderInput,
} from "../lib/suppliers";

type Input = { supplierOrderId: string };

const MAX_ATTEMPTS = 4;

const pushStep = createStep(
  "push-supplier-order-step",
  async (
    { supplierOrderId }: Input,
    { container }
  ): Promise<StepResponse<Record<string, unknown>>> => {
    const query = container.resolve("query");
    const logger = container.resolve("logger");
    const eventBus = container.resolve(Modules.EVENT_BUS) as {
      emit: (e: { name: string; data: unknown }) => Promise<void>;
    };
    const soService = container.resolve("supplierOrder") as any;
    const supplierService = container.resolve("supplier") as any;

    const so = await soService.retrieveSupplierOrder(supplierOrderId, {
      relations: ["items"],
    });
    if (!["ready", "failed"].includes(so.status)) {
      return new StepResponse({ skipped: `status=${so.status}` });
    }
    if ((so.attempt_count ?? 0) >= MAX_ATTEMPTS) {
      return new StepResponse({ skipped: "max_attempts" });
    }

    const supplier = await supplierService.retrieveSupplier(so.supplier_id);

    // ── resolve address from the core order ─────────────────────────────
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: so.order_id },
      fields: [
        "id",
        "display_id",
        "email",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        "shipping_address.phone",
      ],
    });
    const order = orders[0];
    const addr = order?.shipping_address;
    if (!addr) {
      await soService.markFailed(supplierOrderId, "missing_shipping_address");
      await eventBus.emit({ name: "supplier_order.failed", data: { id: supplierOrderId } });
      return new StepResponse({ failed: "missing_shipping_address" });
    }

    // supplier variant identifiers for each item
    const itemIds = so.items.map((i: any) => i.variant_id);
    const svRows = await supplierService.listSupplierVariants({
      variant_id: itemIds,
      supplier_id: so.supplier_id,
    });
    const svByVariant = new Map(svRows.map((r: any) => [r.variant_id, r]));

    const clientItems = so.items.map((i: any) => {
      const sv: any = svByVariant.get(i.variant_id);
      return {
        supplier_sku: sv?.supplier_sku ?? i.supplier_sku,
        supplier_variant_id: sv?.supplier_variant_id,
        supplier_product_id: sv?.supplier_product_id,
        quantity: i.quantity,
      };
    });

    const onLog = (e: any) =>
      soService.logApiCall({
        supplier_id: so.supplier_id,
        supplier_order_id: supplierOrderId,
        ...e,
      });
    const client = await getSupplierClient(container, supplier, { onLog });

    // ── stock guard ────────────────────────────────────────────────────
    const stock = await client.checkStock(clientItems);
    if (!stock.ok) {
      await soService.markFailed(
        supplierOrderId,
        `out_of_stock:${stock.unavailable.join(",")}`
      );
      await eventBus.emit({ name: "supplier_order.failed", data: { id: supplierOrderId, reason: "out_of_stock" } });
      logger.warn(`[push] ${supplierOrderId} out of stock: ${stock.unavailable.join(",")}`);
      return new StepResponse({ failed: "out_of_stock" });
    }

    // ── placing ───────────────────────────────────────────────────────
    await soService.updateSupplierOrders({
      id: supplierOrderId,
      status: "placing",
      attempt_count: (so.attempt_count ?? 0) + 1,
    });

    const createInput: CreateOrderInput = {
      idempotencyKey: so.idempotency_key,
      displayId: String(order.display_id ?? ""),
      items: clientItems,
      address: {
        first_name: addr.first_name ?? "",
        last_name: addr.last_name ?? "",
        address_1: addr.address_1 ?? "",
        address_2: addr.address_2,
        city: addr.city ?? "",
        province: addr.province,
        postal_code: addr.postal_code ?? "",
        country_code: addr.country_code ?? "us",
        phone: addr.phone,
        email: order.email,
      },
    };

    try {
      const result = await client.createOrder(createInput);
      await soService.markPlaced(supplierOrderId, result.supplierRef, {
        shipping: result.shippingCost,
        total: result.totalCost,
      });
      await eventBus.emit({ name: "supplier_order.placed", data: { id: supplierOrderId } });
      logger.info(`[push] ${supplierOrderId} placed → ${result.supplierRef}`);
      return new StepResponse({ placed: result.supplierRef });
    } catch (e) {
      if (e instanceof ManualFulfilmentRequired) {
        await soService.updateSupplierOrders({ id: supplierOrderId, status: "ready" });
        return new StepResponse({ manual: true });
      }

      // reconcile-maybe-created: the call may have timed out AFTER the supplier
      // created the order — check before declaring failure to avoid a dup.
      try {
        const existing = await client.getOrder(so.idempotency_key).catch(() => null);
        if (existing && existing.status !== "unknown") {
          await soService.markPlaced(supplierOrderId, so.idempotency_key);
          await eventBus.emit({ name: "supplier_order.placed", data: { id: supplierOrderId } });
          logger.info(`[push] ${supplierOrderId} reconciled after error`);
          return new StepResponse({ placed: so.idempotency_key, reconciled: true });
        }
      } catch {
        /* fall through to failure */
      }

      const err = e as SupplierApiError;
      const attempts = (so.attempt_count ?? 0) + 1;
      if (err.retryable && attempts < MAX_ATTEMPTS) {
        await soService.updateSupplierOrders({
          id: supplierOrderId,
          status: "ready",
          last_error: err.message,
        });
        // re-enqueue with backoff
        await eventBus.emit({ name: "supplier_order.ready", data: { id: supplierOrderId } });
        logger.warn(`[push] ${supplierOrderId} retryable error, re-queued: ${err.message}`);
        return new StepResponse({ retry: err.message });
      }

      await soService.markFailed(supplierOrderId, err.message);
      await eventBus.emit({ name: "supplier_order.failed", data: { id: supplierOrderId } });
      logger.error(`[push] ${supplierOrderId} failed: ${err.message}`);
      return new StepResponse({ failed: err.message });
    }
  }
);

export const pushSupplierOrderWorkflow = createWorkflow(
  "push-supplier-order",
  (input: Input) => new WorkflowResponse(pushStep(input))
);
