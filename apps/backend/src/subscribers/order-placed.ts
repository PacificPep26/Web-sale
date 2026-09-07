import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * On order.placed:
 *  - send the customer an "order-placed" confirmation email
 *
 * M2 extends this to also run routeOrderToSuppliersWorkflow + a Telegram ping.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");
  const notification = container.resolve(Modules.NOTIFICATION);

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id: data.id },
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "total",
      "items.title",
      "items.quantity",
      "items.unit_price",
    ],
  });
  const order = orders[0];
  if (!order?.email) {
    logger.warn(`[order-placed] order ${data.id} has no email — skipping confirmation`);
    return;
  }

  await notification.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: {
      display_id: order.display_id,
      email: order.email,
      currency_code: order.currency_code,
      total: order.total,
      items: order.items,
    },
  });

  logger.info(`[order-placed] confirmation queued for order #${order.display_id}`);
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
