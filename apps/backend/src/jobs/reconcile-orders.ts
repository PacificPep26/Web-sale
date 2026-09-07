import type { MedusaContainer } from "@medusajs/framework/types";
import { routeOrderToSuppliersWorkflow } from "../workflows/route-order-to-suppliers";

/**
 * Catch orders whose order.placed subscriber never ran (worker down, crash…):
 * a captured order with no supplier orders gets routed again.
 */
export default async function reconcileOrders(container: MedusaContainer) {
  const logger = container.resolve("logger");
  const query = container.resolve("query");

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "payment_collections.status",
      "supplier_orders.id",
    ],
    pagination: { take: 200, skip: 0, order: { created_at: "DESC" } },
  });

  const PAID = ["authorized", "partially_authorized", "captured", "partially_captured"];
  let routed = 0;
  for (const o of orders as Array<Record<string, any>>) {
    const paid = (o.payment_collections ?? []).some((pc: { status?: string }) =>
      PAID.includes(pc.status ?? "")
    );
    const cancelled = ["canceled", "cancelled"].includes(o.status ?? "");
    const hasSupplierOrders = (o.supplier_orders ?? []).length > 0;
    if (paid && !cancelled && !hasSupplierOrders) {
      await routeOrderToSuppliersWorkflow(container).run({
        input: { orderId: o.id },
      });
      routed++;
    }
  }
  if (routed) logger.warn(`[job:reconcile] routed ${routed} orphan order(s)`);
}

export const config = {
  name: "reconcile-orders",
  schedule: "15 */6 * * *",
};
