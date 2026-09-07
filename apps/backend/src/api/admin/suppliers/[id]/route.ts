import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

const PUBLIC_FIELDS = [
  "id",
  "name",
  "type",
  "config",
  "default_currency",
  "is_active",
  "created_at",
  "updated_at",
] as const;

function redact<T extends Record<string, unknown>>(s: T) {
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_FIELDS) out[k] = s[k];
  out.has_credentials = !!s.credentials && Object.keys(s.credentials).length > 0;
  return out;
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  const supplier = await service.retrieveSupplier(req.params.id).catch(() => null);
  if (!supplier) return res.status(404).json({ message: "not found" });
  res.json({ supplier: redact(supplier) });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  const body = req.body as {
    name?: string;
    is_active?: boolean;
    config?: Record<string, unknown>;
    default_currency?: string;
    credentials?: Record<string, unknown>;
  };
  const { credentials, ...rest } = body;
  await service.updateSuppliers({ id: req.params.id, ...rest });
  if (credentials && Object.keys(credentials).length) {
    await service.updateSupplierSecrets(req.params.id, credentials);
  }
  const supplier = await service.retrieveSupplier(req.params.id);
  res.json({ supplier: redact(supplier) });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  await service.deleteSuppliers(req.params.id);
  res.status(200).json({ id: req.params.id, deleted: true });
};
