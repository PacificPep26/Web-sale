import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { pushSupplierOrderWorkflow } from "../workflows/push-supplier-order";
import { notifyTelegram } from "../lib/telegram";

export async function onSupplierOrderReady({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  try {
    await pushSupplierOrderWorkflow(container).run({
      input: { supplierOrderId: data.id },
    });
  } catch (e) {
    logger.error(`[supplier_order.ready] push failed ${data.id}: ${(e as Error).message}`);
  }
}

export async function onSupplierOrderFailed({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const soService = container.resolve("supplierOrder") as any;
  const so = await soService.retrieveSupplierOrder(data.id).catch(() => null);
  await notifyTelegram(
    `⚠️ <b>Supplier order failed</b>\n` +
      `${data.id}\norder_id: ${so?.order_id}\nerror: <code>${so?.last_error ?? "?"}</code>`
  );
}

export async function onSupplierOrderNeedsMapping({
  event: { data },
  container,
}: SubscriberArgs<{ display_id: number; unmapped: { variant_id: string }[] }>) {
  await notifyTelegram(
    `🔗 <b>Order #${data.display_id} needs supplier mapping</b>\n` +
      `${data.unmapped.map((u) => `• variant ${u.variant_id}`).join("\n")}`
  );
}

export const config: SubscriberConfig = {
  event: [
    "supplier_order.ready",
    "supplier_order.failed",
    "supplier_order.needs_mapping",
  ],
};

export default async function supplierOrderEvents(args: SubscriberArgs<any>) {
  switch (args.event.name) {
    case "supplier_order.ready":
      return onSupplierOrderReady(args);
    case "supplier_order.failed":
      return onSupplierOrderFailed(args);
    case "supplier_order.needs_mapping":
      return onSupplierOrderNeedsMapping(args);
  }
}
