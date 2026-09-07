import type { MedusaContainer } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { SupplierClient, SupplierType } from "./types";
import { ManualClient } from "./manual-client";
import { PrintifyClient } from "./printify-client";
import { CjClient } from "./cj-client";

export * from "./types";

type SupplierRow = {
  id: string;
  type: SupplierType;
  config?: Record<string, unknown> | null;
};

export type ApiLogEntry = {
  endpoint: string;
  method: string;
  request?: unknown;
  response?: unknown;
  status_code?: number;
  ok: boolean;
  duration_ms: number;
};

/**
 * Build a client for a supplier. Credentials are decrypted here (never leave the
 * backend). Falls back to sandbox mode when creds are missing so the whole
 * pipeline is exercisable in dev.
 */
export async function getSupplierClient(
  container: MedusaContainer,
  supplier: SupplierRow,
  opts: { onLog?: (e: ApiLogEntry) => Promise<void> | void } = {}
): Promise<SupplierClient> {
  if (supplier.type === "manual") return new ManualClient();

  const supplierService = container.resolve("supplier") as {
    getDecryptedCredentials: (id: string) => Promise<Record<string, string>>;
  };
  const creds = await supplierService.getDecryptedCredentials(supplier.id);
  const cache = container.resolve(Modules.CACHE) as {
    get: (k: string) => Promise<unknown>;
    set: (k: string, v: unknown, ttl?: number) => Promise<void>;
  };
  const cfg = (supplier.config ?? {}) as Record<string, unknown>;
  const sandbox = cfg.sandbox === true || !Object.keys(creds).length;
  const onLog = opts.onLog;

  if (supplier.type === "printify") {
    return new PrintifyClient({
      token: creds.token ?? creds.apiKey ?? "",
      shopId: String(cfg.shopId ?? creds.shopId ?? ""),
      sandbox,
      onLog,
    });
  }

  // cj
  return new CjClient({
    email: creds.email ?? "",
    apiKey: creds.apiKey ?? creds.password ?? "",
    sandbox,
    getToken: async () => (await cache.get(`cj:token:${supplier.id}`)) as string | null,
    setToken: async (t, ttl) => {
      if (!t) return cache.set(`cj:token:${supplier.id}`, "", 1);
      return cache.set(`cj:token:${supplier.id}`, t, ttl);
    },
    onLog,
  });
}
