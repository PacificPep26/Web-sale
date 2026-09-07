import { model } from "@medusajs/framework/utils";
import { SupplierOrder } from "./supplier-order";

export const SupplierShipment = model
  .define("supplier_shipment", {
    id: model.id({ prefix: "supship" }).primaryKey(),
    supplier_order: model.belongsTo(() => SupplierOrder, { mappedBy: "shipments" }),
    tracking_number: model.text().nullable(),
    carrier: model.text().nullable(),
    tracking_url: model.text().nullable(),
    status: model.text().nullable(),
    shipped_at: model.dateTime().nullable(),
    raw: model.json().nullable(),
    /** true once a matching core Fulfillment/Shipment has been created */
    synced_to_medusa: model.boolean().default(false),
  })
  .indexes([{ on: ["tracking_number"] }]);
