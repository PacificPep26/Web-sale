import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { handleRefundReturnWorkflow } from "../workflows/handle-refund-return";

/**
 * When an order is refunded or canceled, reconcile the dropship side:
 * cancel supplier orders where possible, record a loss where already shipped.
 */
export default async function orderRefundedHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string; order_id?: string; amount?: number }>) {
  const logger = container.resolve("logger");
  const orderId = event.data.order_id ?? event.data.id;
  if (!orderId) return;
  try {
    await handleRefundReturnWorkflow(container).run({
      input: { orderId, refundedAmount: event.data.amount },
    });
  } catch (e) {
    logger.error(`[order-refunded] ${orderId}: ${(e as Error).message}`);
  }
}

export const config: SubscriberConfig = {
  event: ["order.refund_created", "order.canceled"],
};
