import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** Mark a `manual`-type supplier order as placed by hand, with tracking. */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplierOrder") as any;
  const body = req.body as {
    supplier_ref: string;
    tracking_number?: string;
    carrier?: string;
    tracking_url?: string;
    total_cost?: number;
  };
  if (!body?.supplier_ref) {
    return res.status(400).json({ message: "supplier_ref is required" });
  }
  const so = await service.retrieveSupplierOrder(req.params.id).catch(() => null);
  if (!so) return res.status(404).json({ message: "not found" });

  await service.markPlaced(so.id, body.supplier_ref, {
    total: body.total_cost,
  });
  if (body.tracking_number) {
    await service.createSupplierShipments([
      {
        supplier_order_id: so.id,
        tracking_number: body.tracking_number,
        carrier: body.carrier ?? null,
        tracking_url: body.tracking_url ?? null,
        status: "shipped",
        shipped_at: new Date(),
        synced_to_medusa: false,
      },
    ]);
  }
  const updated = await service.retrieveSupplierOrder(so.id, {
    relations: ["shipments"],
  });
  res.json({ supplier_order: updated });
};
