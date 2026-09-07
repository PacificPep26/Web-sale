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
  const suppliers = await service.listSuppliers({});
  res.json({ suppliers: suppliers.map(redact) });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("supplier") as any;
  const body = req.body as {
    name: string;
    type: "cj" | "printify" | "manual";
    credentials?: Record<string, unknown>;
    config?: Record<string, unknown>;
    default_currency?: string;
    is_active?: boolean;
  };
  if (!body?.name || !body?.type) {
    return res.status(400).json({ message: "name and type are required" });
  }
  const created = await service.createSupplierWithSecrets(body);
  res.status(201).json({ supplier: redact(Array.isArray(created) ? created[0] : created) });
};
