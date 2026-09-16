import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";
import sunglassesData from "./data/sunglasses-120.json";

/**
 * Adds the 120-model luxury sunglasses catalogue sourced from the
 * "Sunglasses_120_Models_Trend_and_Bestsellers" spreadsheet. Idempotent —
 * skips handles that already exist. Run:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/add-sunglasses-120.ts
 *
 * Note: the source spreadsheet only linked to Google Image searches, not
 * usable image URLs, and had no price column. We use a rotating pool of
 * free-license stock sunglasses photos (Unsplash) instead of scraping each
 * brand's official photography (avoids copyright/hotlink issues), and a
 * flat $350 price per user instruction.
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;

const PHOTO_POOL = [
  "1511499767150-a48a237f0083",
  "1574258495973-f010dfbb5371",
  "1508296695146-257a814070b4",
  "1577803645773-f96470509666",
  "1572635196237-14b3f281503f",
  "1585386959984-a4155224a1ad",
  "1602810318383-e386cc2a3ccf",
  "1610878180933-123728745d22",
  "1600185365483-26d7a4cc7519",
  "1626947346165-4c2288dadc7e",
  "1508296695146-257a814070b4",
  "1614715838608-2b3a3341c701",
];

const img2 = (i: number) => {
  const a = PHOTO_POOL[i % PHOTO_POOL.length];
  const b = PHOTO_POOL[(i + 1) % PHOTO_POOL.length];
  return [{ url: U(a) }, { url: U(b) }];
};

const usd = (n: number) => [{ amount: n, currency_code: "usd" }];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type Row = { n: number; brand: string; model: string; shape: string; info: string; tier: string; image?: string };
const rows = sunglassesData as Row[];

const PRICE = 350.0;

const DEFS = rows.map((r) => {
  const handle = `sun-${slug(r.brand)}-${slug(r.model)}`;
  const title = `${r.brand} ${r.model}`;
  const description = [r.shape, r.info, r.tier].filter(Boolean).join(" — ");
  const images = r.image ? [{ url: r.image }] : img2(r.n);
  return {
    title,
    handle,
    description,
    weight: 30,
    images,
    skuPrefix: `SUN-${slug(r.brand).slice(0, 4).toUpperCase()}-${r.n}`,
  };
});

export default async function addSunglasses120({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const eyewearChannelId = channels.find((c: any) => c.name === "Eyewear")?.id;

  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const eyewearCatId = cats.find((c: any) => c.name === "Eyewear")?.id;

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfileId = profiles[0]?.id;

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });
  const have = new Set(existing.map((p: any) => p.handle));

  const toCreate = DEFS.filter((d) => !have.has(d.handle));
  if (!toCreate.length) {
    logger.info("All 120 sunglasses already exist — nothing to add.");
    return;
  }

  await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((d) => ({
        title: d.title,
        handle: d.handle,
        description: d.description,
        status: ProductStatus.PUBLISHED,
        weight: d.weight,
        category_ids: eyewearCatId ? [eyewearCatId] : [],
        sales_channels: eyewearChannelId ? [{ id: eyewearChannelId }] : [],
        shipping_profile_id: shippingProfileId,
        images: d.images,
        options: [{ title: "Size", values: ["One Size"] }],
        variants: [
          {
            title: "One Size",
            sku: `${d.skuPrefix}-1`,
            options: { Size: "One Size" },
            prices: usd(PRICE),
          },
        ],
      })),
    },
  });

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  });
  const locationId = locations[0]?.id;
  const { data: invItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "location_levels.location_id"],
  });
  const needLevel = invItems.filter(
    (i: any) => !(i.location_levels ?? []).some((l: any) => l.location_id === locationId)
  );
  if (needLevel.length && locationId) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: needLevel.map((i: any) => ({
          inventory_item_id: i.id,
          location_id: locationId,
          stocked_quantity: 1000,
        })),
      },
    });
  }

  logger.info(`Added ${toCreate.length} sunglasses products.`);
}
