import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { notifyTelegram } from "../lib/telegram";

export default async function detectStuckOrders(container: MedusaContainer) {
  const logger = container.resolve("logger");
  const eventBus = container.resolve(Modules.EVENT_BUS);
  const soService = container.resolve("supplierOrder") as any;

  const stuck = await soService.listStuck(120);
  if (!stuck.length) return;

  const requeued: string[] = [];
  for (const so of stuck) {
    if (so.status === "ready" || so.status === "placing") {
      await soService.updateSupplierOrders({ id: so.id, status: "ready" });
      await eventBus.emit({ name: "supplier_order.ready", data: { id: so.id } });
      requeued.push(so.id);
    }
  }

  logger.warn(`[job:stuck] ${stuck.length} stuck supplier order(s), re-queued ${requeued.length}`);
  await notifyTelegram(
    `⏳ <b>${stuck.length} stuck supplier order(s)</b>\n` +
      stuck
        .slice(0, 10)
        .map((s: any) => `• ${s.id} (${s.status}) order ${s.order_id}`)
        .join("\n")
  );
}

export const config = {
  name: "detect-stuck-orders",
  schedule: "0 * * * *",
};
