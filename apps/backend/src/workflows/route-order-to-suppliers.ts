import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

type Input = { orderId: string };

const routeStep = createStep(
  "route-order-to-suppliers-step",
  async (
    { orderId }: Input,
    { container }
  ): Promise<StepResponse<Record<string, unknown>>> => {
    const query = container.resolve("query");
    const logger = container.resolve("logger");
    const supplierService = container.resolve("supplier") as {
      resolveSupplierForVariant: (variantId: string) => Promise<{
        supplier: { id: string };
        supplierVariant: {
          supplier_sku?: string | null;
          cost_amount: number;
          cost_currency: string;
        };
      } | null>;
    };
    const supplierOrderService = container.resolve("supplierOrder") as {
      createFromOrder: (orderId: string, groups: unknown[]) => Promise<unknown[]>;
    };
    const eventBus = container.resolve(Modules.EVENT_BUS) as {
      emit: (e: { name: string; data: unknown }) => Promise<void>;
    };

    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "display_id",
        "currency_code",
        "status",
        "payment_collections.status",
        "items.id",
        "items.variant_id",
        "items.quantity",
        "items.detail.quantity",
        "items.raw_quantity",
      ],
    });
    const order = orders[0] as Record<string, any> | undefined;
    if (!order) {
      return new StepResponse({ skipped: "order_not_found" });
    }

    // payment-safety invariant — routing is fine once payment is authorised
    const PAID = [
      "authorized",
      "partially_authorized",
      "captured",
      "partially_captured",
    ];
    const paid = (order.payment_collections ?? []).some((pc: { status?: string }) =>
      PAID.includes(pc.status ?? "")
    );
    const cancelled = ["canceled", "cancelled"].includes(order.status ?? "");
    if (!paid || cancelled) {
      logger.info(
        `[route] order ${orderId} not eligible (paid=${paid}, status=${order.status}) — skipping`
      );
      return new StepResponse({ skipped: "not_paid_or_cancelled" });
    }

    const groupMap = new Map<
      string,
      {
        supplierId: string;
        currency: string;
        items: {
          order_line_item_id: string;
          variant_id: string;
          supplier_sku?: string | null;
          quantity: number;
          unit_cost: number;
        }[];
      }
    >();
    const unmapped: { variant_id: string; line_item_id: string }[] = [];

    for (const li of (order.items ?? []) as Array<Record<string, any>>) {
      if (!li?.variant_id) continue;
      const quantity = Number(
        li.quantity ?? li.detail?.quantity ?? li.raw_quantity?.value ?? 1
      );
      const resolved = await supplierService.resolveSupplierForVariant(
        li.variant_id
      );
      if (!resolved) {
        unmapped.push({ variant_id: li.variant_id, line_item_id: li.id });
        continue;
      }
      const key = resolved.supplier.id;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          supplierId: key,
          currency: resolved.supplierVariant.cost_currency ?? order.currency_code,
          items: [],
        });
      }
      groupMap.get(key)!.items.push({
        order_line_item_id: li.id,
        variant_id: li.variant_id,
        supplier_sku: resolved.supplierVariant.supplier_sku,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit_cost: Number(resolved.supplierVariant.cost_amount ?? 0) || 0,
      });
    }

    const groups = [...groupMap.values()];
    const created = groups.length
      ? await supplierOrderService.createFromOrder(orderId, groups)
      : [];

    // link supplier orders to the core order
    if (created.length) {
      const link = container.resolve("link") as {
        create: (data: unknown) => Promise<unknown>;
      };
      await link.create(
        (created as { id: string }[]).map((so) => ({
          order: { order_id: orderId },
          supplierOrder: { supplier_order_id: so.id },
        }))
      );
    }

    for (const so of created as { id: string; status: string }[]) {
      if (so.status === "ready") {
        await eventBus.emit({
          name: "supplier_order.ready",
          data: { id: so.id },
        });
      }
    }
    if (unmapped.length) {
      await eventBus.emit({
        name: "supplier_order.needs_mapping",
        data: { order_id: orderId, display_id: order.display_id, unmapped },
      });
    }

    logger.info(
      `[route] order #${order.display_id}: ${created.length} supplier order(s), ${unmapped.length} unmapped`
    );
    return new StepResponse({
      created: (created as { id: string }[]).map((c) => c.id),
      unmapped: unmapped.length,
    });
  }
);

export const routeOrderToSuppliersWorkflow = createWorkflow(
  "route-order-to-suppliers",
  (input: Input) => {
    return new WorkflowResponse(routeStep(input));
  }
);
