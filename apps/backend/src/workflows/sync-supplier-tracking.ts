import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import {
  createOrderFulfillmentWorkflow,
  createOrderShipmentWorkflow,
} from "@medusajs/medusa/core-flows";
import { getSupplierClient } from "../lib/suppliers";

const syncStep = createStep(
  "sync-supplier-tracking-step",
  async (
    _: Record<string, never>,
    { container }
  ): Promise<StepResponse<Record<string, unknown>>> => {
    const query = container.resolve("query");
    const logger = container.resolve("logger");
    const notification = container.resolve(Modules.NOTIFICATION) as any;
    const soService = container.resolve("supplierOrder") as any;
    const supplierService = container.resolve("supplier") as any;

    const active = await soService.listSupplierOrders({
      status: ["placed", "shipped"],
    });
    let updated = 0;

    for (const so of active) {
      if (!so.supplier_ref) continue;
      const supplier = await supplierService.retrieveSupplier(so.supplier_id);
      const client = await getSupplierClient(container, supplier, {
        onLog: (e: any) =>
          soService.logApiCall({
            supplier_id: so.supplier_id,
            supplier_order_id: so.id,
            ...e,
          }),
      });

      let info;
      try {
        info = await client.getOrder(so.supplier_ref);
      } catch (e) {
        logger.warn(`[sync] ${so.id}: ${(e as Error).message}`);
        continue;
      }

      const existingShipments = await soService.listSupplierShipments({
        supplier_order_id: so.id,
      });
      const known = new Set(
        existingShipments.map((s: any) => s.tracking_number).filter(Boolean)
      );

      for (const sh of info.shipments) {
        if (!sh.tracking_number || known.has(sh.tracking_number)) continue;
        await soService.createSupplierShipments([
          {
            supplier_order_id: so.id,
            tracking_number: sh.tracking_number,
            carrier: sh.carrier ?? null,
            tracking_url: sh.url ?? null,
            status: sh.status ?? info.status,
            shipped_at: new Date(),
            raw: sh as any,
            synced_to_medusa: false,
          },
        ]);
      }

      // push un-synced shipments into core fulfilment
      const toSync = (
        await soService.listSupplierShipments({ supplier_order_id: so.id })
      ).filter((s: any) => !s.synced_to_medusa && s.tracking_number);

      if (toSync.length) {
        const { data: orders } = await query.graph({
          entity: "order",
          filters: { id: so.order_id },
          fields: [
            "id",
            "display_id",
            "email",
            "items.id",
            "items.quantity",
            "items.detail.quantity",
            "items.raw_quantity",
          ],
        });
        const order = orders[0];
        const soItems = await soService.listSupplierOrderItems({
          supplier_order_id: so.id,
        });
        const qtyBySoItem = new Map<string, number>(
          soItems.map((i: any) => [
            i.order_line_item_id as string,
            Number(i.quantity ?? 1),
          ])
        );
        const fulfilItems: { id: string; quantity: number }[] = (
          order?.items ?? []
        )
          .filter((li: any) => qtyBySoItem.has(li.id))
          .map((li: any) => ({
            id: li.id as string,
            quantity:
              qtyBySoItem.get(li.id) ??
              Number(
                li.quantity ??
                  li.detail?.quantity ??
                  li.raw_quantity?.value ??
                  1
              ),
          }));

        try {
          const { result: fulfilment } = await createOrderFulfillmentWorkflow(
            container
          ).run({
            input: { order_id: so.order_id, items: fulfilItems },
          });
          for (const s of toSync) {
            await createOrderShipmentWorkflow(container).run({
              input: {
                order_id: so.order_id,
                fulfillment_id: (fulfilment as any).id,
                items: fulfilItems,
                labels: [
                  {
                    tracking_number: s.tracking_number,
                    tracking_url: s.tracking_url ?? "",
                    label_url: "",
                  },
                ],
              } as any,
            });
            await soService.updateSupplierShipments({
              id: s.id,
              synced_to_medusa: true,
            });
          }
          await notification.createNotifications({
            to: order?.email ?? "",
            channel: "email",
            template: "shipment-created",
            data: {
              display_id: order?.display_id,
              tracking_numbers: toSync.map((s: any) => s.tracking_number),
              tracking_links: toSync.map((s: any) => ({
                url: s.tracking_url,
                tracking_number: s.tracking_number,
              })),
            },
          });
        } catch (e) {
          logger.error(`[sync] fulfilment for ${so.id} failed: ${(e as Error).message}`);
          continue;
        }
      }

      const nextStatus =
        info.status === "delivered"
          ? "delivered"
          : info.status === "cancelled"
            ? so.status
            : "shipped";
      if (nextStatus !== so.status) {
        await soService.updateSupplierOrders({
          id: so.id,
          status: nextStatus,
          ...(nextStatus === "shipped" ? { shipped_at: new Date() } : {}),
        });
        updated++;
      }
    }

    return new StepResponse({ checked: active.length, updated });
  }
);

export const syncSupplierTrackingWorkflow = createWorkflow(
  "sync-supplier-tracking",
  () => new WorkflowResponse(syncStep({}))
);
