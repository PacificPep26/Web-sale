import { model } from "@medusajs/framework/utils";

/** Audit trail for every outbound call to a supplier API. */
export const SupplierApiLog = model
  .define("supplier_api_log", {
    id: model.id({ prefix: "supapilog" }).primaryKey(),
    supplier_id: model.text(),
    supplier_order_id: model.text().nullable(),
    endpoint: model.text(),
    method: model.text().default("POST"),
    request: model.json().nullable(),
    response: model.json().nullable(),
    status_code: model.number().nullable(),
    ok: model.boolean().default(false),
    duration_ms: model.number().default(0),
  })
  .indexes([{ on: ["supplier_id"] }, { on: ["supplier_order_id"] }]);
