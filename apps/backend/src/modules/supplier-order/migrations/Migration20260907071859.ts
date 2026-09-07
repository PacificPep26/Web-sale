import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260907071859 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order" drop constraint if exists "supplier_order_order_id_supplier_id_unique";`);
    this.addSql(`create table if not exists "supplier_api_log" ("id" text not null, "supplier_id" text not null, "supplier_order_id" text null, "endpoint" text not null, "method" text not null default 'POST', "request" jsonb null, "response" jsonb null, "status_code" integer null, "ok" boolean not null default false, "duration_ms" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_api_log_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_api_log_deleted_at" ON "supplier_api_log" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_api_log_supplier_id" ON "supplier_api_log" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_api_log_supplier_order_id" ON "supplier_api_log" ("supplier_order_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_order" ("id" text not null, "order_id" text not null, "supplier_id" text not null, "status" text check ("status" in ('pending', 'ready', 'placing', 'placed', 'shipped', 'delivered', 'failed', 'cancelled')) not null default 'pending', "idempotency_key" text not null, "supplier_ref" text null, "attempt_count" integer not null default 0, "last_error" text null, "subtotal_cost" numeric not null default 0, "shipping_cost" numeric not null default 0, "total_cost" numeric not null default 0, "currency" text not null default 'usd', "loss_amount" numeric not null default 0, "placed_at" timestamptz null, "shipped_at" timestamptz null, "raw_subtotal_cost" jsonb not null default '{"value":"0","precision":20}', "raw_shipping_cost" jsonb not null default '{"value":"0","precision":20}', "raw_total_cost" jsonb not null default '{"value":"0","precision":20}', "raw_loss_amount" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_order_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_deleted_at" ON "supplier_order" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_order_id" ON "supplier_order" ("order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_status" ON "supplier_order" ("status") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_order_order_id_supplier_id_unique" ON "supplier_order" ("order_id", "supplier_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_order_item" ("id" text not null, "supplier_order_id" text not null, "order_line_item_id" text not null, "variant_id" text not null, "supplier_sku" text null, "quantity" integer not null, "unit_cost" numeric not null default 0, "raw_unit_cost" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_order_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_item_supplier_order_id" ON "supplier_order_item" ("supplier_order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_order_item_deleted_at" ON "supplier_order_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_shipment" ("id" text not null, "supplier_order_id" text not null, "tracking_number" text null, "carrier" text null, "tracking_url" text null, "status" text null, "shipped_at" timestamptz null, "raw" jsonb null, "synced_to_medusa" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_shipment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_shipment_supplier_order_id" ON "supplier_shipment" ("supplier_order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_shipment_deleted_at" ON "supplier_shipment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_shipment_tracking_number" ON "supplier_shipment" ("tracking_number") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "supplier_order_item" add constraint "supplier_order_item_supplier_order_id_foreign" foreign key ("supplier_order_id") references "supplier_order" ("id") on update cascade;`);

    this.addSql(`alter table if exists "supplier_shipment" add constraint "supplier_shipment_supplier_order_id_foreign" foreign key ("supplier_order_id") references "supplier_order" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_order_item" drop constraint if exists "supplier_order_item_supplier_order_id_foreign";`);

    this.addSql(`alter table if exists "supplier_shipment" drop constraint if exists "supplier_shipment_supplier_order_id_foreign";`);

    this.addSql(`drop table if exists "supplier_api_log" cascade;`);

    this.addSql(`drop table if exists "supplier_order" cascade;`);

    this.addSql(`drop table if exists "supplier_order_item" cascade;`);

    this.addSql(`drop table if exists "supplier_shipment" cascade;`);
  }

}
