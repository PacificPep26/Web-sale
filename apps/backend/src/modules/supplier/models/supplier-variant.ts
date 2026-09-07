import { model } from "@medusajs/framework/utils";
import { Supplier } from "./supplier";

/**
 * Maps a Medusa product variant to a supplier's SKU + landed cost.
 * `variant_id` is a soft reference to product.variant (linked via module link).
 */
export const SupplierVariant = model
  .define("supplier_variant", {
    id: model.id({ prefix: "supvar" }).primaryKey(),
    supplier: model.belongsTo(() => Supplier, { mappedBy: "variants" }),
    variant_id: model.text(),
    supplier_sku: model.text().nullable(),
    supplier_product_id: model.text().nullable(),
    supplier_variant_id: model.text().nullable(),
    /** landed cost per unit, decimal major units in cost_currency */
    cost_amount: model.bigNumber().default(0),
    cost_currency: model.text().default("usd"),
    ship_from: model.enum(["us", "cn", "other"]).default("other"),
    handling_days_min: model.number().default(2),
    handling_days_max: model.number().default(10),
    is_preferred: model.boolean().default(false),
  })
  .indexes([{ on: ["variant_id"] }, { on: ["variant_id", "supplier_id"], unique: true }]);
