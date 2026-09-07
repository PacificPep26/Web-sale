import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { routeOrderToSuppliersWorkflow } from "../workflows/route-order-to-suppliers";
import { notifyTelegram } from "../lib/telegram";

/**
 * On order.placed:
 *  1. confirmation email to the customer
 *  2. route the order to suppliers (payment-safety invariant enforced inside)
 *  3. Telegram "new order" ping
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
      "sales_channel.name",
      "items.title",
      "items.quantity",
      "items.unit_price",
    ],
  });
  const order = orders[0];
  if (!order) return;

  if (order.email) {
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
  }

  await notifyTelegram(
    `🛒 <b>New order #${order.display_id}</b>\n` +
      `${order.sales_channel?.name ?? "?"} · ${order.currency_code?.toUpperCase()} ${order.total}\n` +
      `${(order.items ?? []).map((i: any) => `• ${i.title} ×${i.quantity}`).join("\n")}`
  );

  try {
    await routeOrderToSuppliersWorkflow(container).run({
      input: { orderId: data.id },
    });
  } catch (e) {
    logger.error(`[order-placed] routing failed for ${data.id}: ${(e as Error).message}`);
  }
}

export const config: SubscriberConfig = { event: "order.placed" };
