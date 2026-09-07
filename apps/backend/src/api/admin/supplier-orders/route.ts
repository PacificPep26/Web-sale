import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplierOrder") as any;
  const q = req.query as Record<string, string>;
  const filters: Record<string, unknown> = {};
  if (q.status) filters.status = q.status.split(",");
  if (q.order_id) filters.order_id = q.order_id;
  if (q.supplier_id) filters.supplier_id = q.supplier_id;

  const orders = await service.listSupplierOrders(filters, {
    relations: ["items", "shipments"],
    order: { created_at: "DESC" },
    take: q.limit ? Number(q.limit) : 100,
  });
  res.json({ supplier_orders: orders, count: orders.length });
};
