import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { pushSupplierOrderWorkflow } from "../../../../../workflows/push-supplier-order";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplierOrder") as any;
  const so = await service.retrieveSupplierOrder(req.params.id).catch(() => null);
  if (!so) return res.status(404).json({ message: "not found" });

  await service.updateSupplierOrders({
    id: so.id,
    status: "ready",
    last_error: null,
  });
  await pushSupplierOrderWorkflow(req.scope).run({
    input: { supplierOrderId: so.id },
  });

  const updated = await service.retrieveSupplierOrder(so.id);
  res.json({ supplier_order: updated });
};
