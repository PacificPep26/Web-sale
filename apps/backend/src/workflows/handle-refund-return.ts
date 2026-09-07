import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { getSupplierClient } from "../lib/suppliers";

type Input = {
  orderId: string;
  /** already-refunded amount, if a Stripe refund was created upstream */
  refundedAmount?: number;
};

/**
 * Cancel supplier orders where possible; record a loss where the goods already
 * shipped. Does NOT itself refund Stripe — Medusa's refund flow does that; this
 * reconciles the dropship + P&L side and notifies the customer.
 */
const step = createStep(
  "handle-refund-return-step",
  async (
    { orderId, refundedAmount }: Input,
    { container }
  ): Promise<StepResponse<Record<string, unknown>>> => {
    const query = container.resolve("query");
    const logger = container.resolve("logger");
    const notification = container.resolve(Modules.NOTIFICATION) as any;
    const soService = container.resolve("supplierOrder") as any;
    const supplierService = container.resolve("supplier") as any;

    const supplierOrders = await soService.listSupplierOrders({ order_id: orderId });
    if (!supplierOrders.length) return new StepResponse({ handled: 0 });

    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: ["id", "display_id", "email", "currency_code"],
    });
    const order = orders[0];

    let cancelled = 0;
    let loss = 0;

    for (const so of supplierOrders) {
      if (["cancelled"].includes(so.status)) continue;

      if (["pending", "ready", "failed"].includes(so.status)) {
        await soService.updateSupplierOrders({ id: so.id, status: "cancelled" });
        cancelled++;
        continue;
      }

      // placed / shipped / delivered
      let cancelledAtSupplier = false;
      if (so.status === "placed" && so.supplier_ref) {
        const supplier = await supplierService.retrieveSupplier(so.supplier_id);
        const client = await getSupplierClient(container, supplier, {
          onLog: (e: any) =>
            soService.logApiCall({
              supplier_id: so.supplier_id,
              supplier_order_id: so.id,
              ...e,
            }),
        });
        cancelledAtSupplier = await client.cancelOrder(so.supplier_ref).catch(() => false);
      }

      if (cancelledAtSupplier) {
        await soService.updateSupplierOrders({ id: so.id, status: "cancelled" });
        cancelled++;
      } else {
        // could not stop it — the cost is a sunk loss
        await soService.updateSupplierOrders({
          id: so.id,
          status: "cancelled",
          loss_amount: so.total_cost ?? 0,
        });
        loss += so.total_cost ?? 0;
      }
    }

    await notification.createNotifications({
      to: order?.email ?? "",
      channel: "email",
      template: "order-canceled",
      data: {
        display_id: order?.display_id,
        refund_amount: refundedAmount,
        currency_code: order?.currency_code,
      },
    });

    logger.info(
      `[refund] order #${order?.display_id}: ${cancelled} supplier order(s) cancelled, loss ${loss.toFixed(2)}`
    );
    return new StepResponse({ cancelled, loss });
  }
);

export const handleRefundReturnWorkflow = createWorkflow(
  "handle-refund-return",
  (input: Input) => new WorkflowResponse(step(input))
);
