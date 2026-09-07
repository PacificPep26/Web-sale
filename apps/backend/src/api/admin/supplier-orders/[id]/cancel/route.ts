import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getSupplierClient } from "../../../../../lib/suppliers";

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplierOrder") as any;
  const supplierService = req.scope.resolve("supplier") as any;
  const so = await service.retrieveSupplierOrder(req.params.id).catch(() => null);
  if (!so) return res.status(404).json({ message: "not found" });

  let cancelledAtSupplier = false;
  if (so.status === "placed" && so.supplier_ref) {
    const supplier = await supplierService.retrieveSupplier(so.supplier_id);
    const client = await getSupplierClient(req.scope, supplier);
    cancelledAtSupplier = await client.cancelOrder(so.supplier_ref).catch(() => false);
  }

  await service.updateSupplierOrders({
    id: so.id,
    status: "cancelled",
    loss_amount: cancelledAtSupplier ? 0 : so.total_cost ?? 0,
  });
  res.json({
    supplier_order: await service.retrieveSupplierOrder(so.id),
    cancelled_at_supplier: cancelledAtSupplier,
  });
};
