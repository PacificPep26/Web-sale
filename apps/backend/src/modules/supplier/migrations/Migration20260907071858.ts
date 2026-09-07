import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260907071858 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "supplier_variant" drop constraint if exists "supplier_variant_variant_id_supplier_id_unique";`);
    this.addSql(`create table if not exists "supplier" ("id" text not null, "name" text not null, "type" text check ("type" in ('cj', 'printify', 'manual')) not null, "credentials" jsonb null, "config" jsonb null, "default_currency" text not null default 'usd', "is_active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_deleted_at" ON "supplier" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "supplier_variant" ("id" text not null, "supplier_id" text not null, "variant_id" text not null, "supplier_sku" text null, "supplier_product_id" text null, "supplier_variant_id" text null, "cost_amount" numeric not null default 0, "cost_currency" text not null default 'usd', "ship_from" text check ("ship_from" in ('us', 'cn', 'other')) not null default 'other', "handling_days_min" integer not null default 2, "handling_days_max" integer not null default 10, "is_preferred" boolean not null default false, "raw_cost_amount" jsonb not null default '{"value":"0","precision":20}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "supplier_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_variant_supplier_id" ON "supplier_variant" ("supplier_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_variant_deleted_at" ON "supplier_variant" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_supplier_variant_variant_id" ON "supplier_variant" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_variant_variant_id_supplier_id_unique" ON "supplier_variant" ("variant_id", "supplier_id") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "supplier_variant" add constraint "supplier_variant_supplier_id_foreign" foreign key ("supplier_id") references "supplier" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "supplier_variant" drop constraint if exists "supplier_variant_supplier_id_foreign";`);

    this.addSql(`drop table if exists "supplier" cascade;`);

    this.addSql(`drop table if exists "supplier_variant" cascade;`);
  }

}
