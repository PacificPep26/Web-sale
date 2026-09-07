import { model } from "@medusajs/framework/utils";

export const AdSpend = model
  .define("ad_spend", {
    id: model.id({ prefix: "adspend" }).primaryKey(),
    /** YYYY-MM-DD */
    date: model.text(),
    sales_channel_id: model.text().nullable(),
    channel: model.enum(["meta", "tiktok", "pinterest", "google", "other"]).default("other"),
    amount: model.bigNumber(),
    currency: model.text().default("usd"),
    note: model.text().nullable(),
    source: model.enum(["manual", "api"]).default("manual"),
  })
  .indexes([{ on: ["date"] }, { on: ["sales_channel_id"] }]);
