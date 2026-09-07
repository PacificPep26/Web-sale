import { MedusaService } from "@medusajs/framework/utils";
import { Supplier } from "./models/supplier";
import { SupplierVariant } from "./models/supplier-variant";
import { encryptCredentials, decryptCredentials } from "../../lib/crypto";

type CreateSupplierInput = {
  name: string;
  type: "cj" | "printify" | "manual";
  credentials?: Record<string, unknown>;
  config?: Record<string, unknown>;
  default_currency?: string;
  is_active?: boolean;
};

class SupplierModuleService extends MedusaService({
  Supplier,
  SupplierVariant,
}) {
  /** Create a supplier, encrypting credentials before persistence. */
  async createSupplierWithSecrets(input: CreateSupplierInput) {
    const { credentials, ...rest } = input;
    return this.createSuppliers({
      ...rest,
      credentials: credentials ? encryptCredentials(credentials) : null,
    });
  }

  async updateSupplierSecrets(id: string, credentials: Record<string, unknown>) {
    return this.updateSuppliers({
      id,
      credentials: encryptCredentials(credentials),
    });
  }

  /** Decrypted credentials — only call inside workflows, never expose via API. */
  async getDecryptedCredentials(supplierId: string): Promise<Record<string, string>> {
    const supplier = await this.retrieveSupplier(supplierId);
    return decryptCredentials(
      supplier.credentials as Record<string, string> | null
    );
  }

  /**
   * Pick the supplier variant to fulfil a Medusa variant:
   *   is_preferred  →  ship_from === "us"  →  lowest cost_amount
   */
  async resolveSupplierForVariant(variantId: string): Promise<{
    supplier: typeof Supplier extends never ? never : Record<string, unknown>;
    supplierVariant: Record<string, unknown>;
  } | null> {
    const candidates = await this.listSupplierVariants(
      { variant_id: variantId },
      { relations: ["supplier"] }
    );
    const active = candidates.filter(
      (c) => (c as { supplier?: { is_active?: boolean } }).supplier?.is_active !== false
    );
    if (!active.length) return null;

    active.sort((a, b) => {
      const A = a as Record<string, unknown>;
      const B = b as Record<string, unknown>;
      if (!!B.is_preferred !== !!A.is_preferred) return B.is_preferred ? 1 : -1;
      const usA = A.ship_from === "us" ? 1 : 0;
      const usB = B.ship_from === "us" ? 1 : 0;
      if (usA !== usB) return usB - usA;
      return (A.cost_amount as number) - (B.cost_amount as number);
    });

    const chosen = active[0] as Record<string, unknown> & {
      supplier: Record<string, unknown>;
    };
    return { supplier: chosen.supplier, supplierVariant: chosen };
  }
}

export default SupplierModuleService;
