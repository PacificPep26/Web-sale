import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  const variants = await service.listSupplierVariants({
    supplier_id: req.params.id,
  });
  res.json({ supplier_variants: variants });
};

type Row = {
  variant_id: string;
  supplier_sku?: string;
  supplier_product_id?: string;
  supplier_variant_id?: string;
  cost_amount?: number;
  cost_currency?: string;
  ship_from?: "us" | "cn" | "other";
  handling_days_min?: number;
  handling_days_max?: number;
  is_preferred?: boolean;
};

/** Bulk upsert mapping rows (used by the CSV importer in the Admin UI). */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  const supplierId = req.params.id;
  const rows = ((req.body as { rows?: Row[] })?.rows ?? []).filter(
    (r) => r.variant_id
  );

  const existing = await service.listSupplierVariants({ supplier_id: supplierId });
  const byVariant = new Map(existing.map((e: any) => [e.variant_id, e]));

  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const payload = {
      supplier_id: supplierId,
      variant_id: r.variant_id,
      supplier_sku: r.supplier_sku ?? null,
      supplier_product_id: r.supplier_product_id ?? null,
      supplier_variant_id: r.supplier_variant_id ?? null,
      cost_amount: r.cost_amount ?? 0,
      cost_currency: r.cost_currency ?? "usd",
      ship_from: r.ship_from ?? "other",
      handling_days_min: r.handling_days_min ?? 2,
      handling_days_max: r.handling_days_max ?? 10,
      is_preferred: r.is_preferred ?? false,
    };
    const found: any = byVariant.get(r.variant_id);
    if (found) {
      await service.updateSupplierVariants({ id: found.id, ...payload });
      updated++;
    } else {
      await service.createSupplierVariants(payload);
      created++;
    }
  }
  res.json({ created, updated });
};
