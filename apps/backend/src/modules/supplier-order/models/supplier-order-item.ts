import { model } from "@medusajs/framework/utils";
import { SupplierOrder } from "./supplier-order";

export const SupplierOrderItem = model.define("supplier_order_item", {
  id: model.id({ prefix: "suporderitem" }).primaryKey(),
  supplier_order: model.belongsTo(() => SupplierOrder, { mappedBy: "items" }),
  order_line_item_id: model.text(),
  variant_id: model.text(),
  supplier_sku: model.text().nullable(),
  quantity: model.number(),
  unit_cost: model.bigNumber().default(0),
});
