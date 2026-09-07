import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260907071900 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "ad_spend" ("id" text not null, "date" text not null, "sales_channel_id" text null, "channel" text check ("channel" in ('meta', 'tiktok', 'pinterest', 'google', 'other')) not null default 'other', "amount" numeric not null, "currency" text not null default 'usd', "note" text null, "source" text check ("source" in ('manual', 'api')) not null default 'manual', "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ad_spend_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ad_spend_deleted_at" ON "ad_spend" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ad_spend_date" ON "ad_spend" ("date") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ad_spend_sales_channel_id" ON "ad_spend" ("sales_channel_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ad_spend" cascade;`);
  }

}
