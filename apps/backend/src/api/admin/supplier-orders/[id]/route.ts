import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplierOrder") as any;
  const order = await service
    .retrieveSupplierOrder(req.params.id, { relations: ["items", "shipments"] })
    .catch(() => null);
  if (!order) return res.status(404).json({ message: "not found" });
  res.json({ supplier_order: order });
};
