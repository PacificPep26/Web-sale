import { model } from "@medusajs/framework/utils";
import { SupplierOrderItem } from "./supplier-order-item";
import { SupplierShipment } from "./supplier-shipment";

export type SupplierOrderStatus =
  | "pending"
  | "ready"
  | "placing"
  | "placed"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export const SupplierOrder = model
  .define("supplier_order", {
    id: model.id({ prefix: "suporder" }).primaryKey(),
    /** soft ref to core order (module link) */
    order_id: model.text(),
    supplier_id: model.text(),
    status: model
      .enum([
        "pending",
        "ready",
        "placing",
        "placed",
        "shipped",
        "delivered",
        "failed",
        "cancelled",
      ])
      .default("pending"),
    /** stable key sent to the supplier API to dedupe order creation */
    idempotency_key: model.text(),
    /** supplier's own order id/number */
    supplier_ref: model.text().nullable(),
    attempt_count: model.number().default(0),
    last_error: model.text().nullable(),
    subtotal_cost: model.bigNumber().default(0),
    shipping_cost: model.bigNumber().default(0),
    total_cost: model.bigNumber().default(0),
    currency: model.text().default("usd"),
    /** set when a refund/return happened after the goods were already shipped */
    loss_amount: model.bigNumber().default(0),
    placed_at: model.dateTime().nullable(),
    shipped_at: model.dateTime().nullable(),
    items: model.hasMany(() => SupplierOrderItem, { mappedBy: "supplier_order" }),
    shipments: model.hasMany(() => SupplierShipment, { mappedBy: "supplier_order" }),
  })
  .indexes([
    { on: ["order_id"] },
    { on: ["status"] },
    { on: ["order_id", "supplier_id"], unique: true },
  ]);
