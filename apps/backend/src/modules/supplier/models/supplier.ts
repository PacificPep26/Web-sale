import { model } from "@medusajs/framework/utils";
import { SupplierVariant } from "./supplier-variant";

export const Supplier = model.define("supplier", {
  id: model.id({ prefix: "sup" }).primaryKey(),
  name: model.text(),
  type: model.enum(["cj", "printify", "manual"]),
  /** encrypted map of credential fields (apiKey, email, token, …) */
  credentials: model.json().nullable(),
  /** non-secret config: { shopId, warehousePreference, cutoffMinutes, ... } */
  config: model.json().nullable(),
  default_currency: model.text().default("usd"),
  is_active: model.boolean().default(true),
  variants: model.hasMany(() => SupplierVariant, { mappedBy: "supplier" }),
});
