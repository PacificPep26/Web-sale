import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Adds a second wave of catalogue products (idempotent — skips handles that
 * already exist). Run:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/add-more-products.ts
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;
const img2 = (a: string, b: string) => [{ url: U(a) }, { url: U(b) }];
const usd = (n: number) => [{ amount: n, currency_code: "usd" }];

type Def = {
  channel: "Cases" | "Eyewear" | "Toys" | "Watches";
  title: string;
  handle: string;
  description: string;
  weight: number;
  images: { url: string }[];
  option: { title: string; values: string[] };
  price: number;
  skuPrefix: string;
};

const DEFS: Def[] = [
  // ── Cases ────────────────────────────────────────────────────────
  {
    channel: "Cases", title: "Leather Snap Wallet Case", handle: "leather-snap-wallet-case",
    description: "Full-grain leather case with a snap card pocket for two cards. Ages to a patina.",
    weight: 75, images: img2("1556228578-8c89e6adf883", "1601972602288-3be527b4f18a"),
    option: { title: "Model", values: ["iPhone 15", "iPhone 15 Pro", "Galaxy S24"] }, price: 27.99, skuPrefix: "CASE-LSW",
  },
  {
    channel: "Cases", title: "Matte Grip Case", handle: "matte-grip-case",
    description: "Soft-touch matte finish with textured side rails for a secure one-handed hold.",
    weight: 48, images: img2("1573148195900-7845dcb9b127", "1610945265064-0e34e5519bbf"),
    option: { title: "Color", values: ["Black", "Sage", "Sand"] }, price: 16.99, skuPrefix: "CASE-MGR",
  },
  {
    channel: "Cases", title: "Ring Holder Case", handle: "ring-holder-case",
    description: "Slim case with a 360° metal ring for grip and as a kickstand.",
    weight: 62, images: img2("1587033411391-5d9e51cce126", "1616423640778-28d1b53229bd"),
    option: { title: "Model", values: ["iPhone 15", "Galaxy S24"] }, price: 15.99, skuPrefix: "CASE-RNG",
  },
  {
    channel: "Cases", title: "13\" Hardshell Laptop Case", handle: "13-hardshell-laptop-case",
    description: "Two-piece polycarbonate shell with rubber feet and vents. Fits 13\" ultrabooks.",
    weight: 240, images: img2("1541345023926-55d6e0853f4b", "1512054502232-10a0a035d672"),
    option: { title: "Finish", values: ["Frost", "Black"] }, price: 34.0, skuPrefix: "CASE-HSL",
  },
  {
    channel: "Cases", title: "Cable Organiser Pouch", handle: "cable-organiser-pouch",
    description: "Zip pouch with elastic loops and mesh pockets for chargers, dongles and drives.",
    weight: 110, images: img2("1583394838336-acd977736f90", "1585060544812-6b45742d762f"),
    option: { title: "Size", values: ["Small", "Medium"] }, price: 18.5, skuPrefix: "CASE-COP",
  },

  // ── Eyewear ──────────────────────────────────────────────────────
  {
    channel: "Eyewear", title: "Clubmaster Sunglasses", handle: "clubmaster-sunglasses",
    description: "Browline acetate-and-metal frame, polarised UV400 lenses.",
    weight: 34, images: img2("1574258495973-f010dfbb5371", "1511499767150-a48a237f0083"),
    option: { title: "Color", values: ["Tortoise", "Black / Gold"] }, price: 32.0, skuPrefix: "SUN-CLB",
  },
  {
    channel: "Eyewear", title: "Cat-Eye Sunglasses", handle: "cat-eye-sunglasses",
    description: "Uplifted cat-eye acetate frame with gradient UV400 lenses.",
    weight: 30, images: img2("1508296695146-257a814070b4", "1574258495973-f010dfbb5371"),
    option: { title: "Color", values: ["Amber", "Black"] }, price: 29.0, skuPrefix: "SUN-CAT",
  },
  {
    channel: "Eyewear", title: "Blue-Light Reading Glasses", handle: "blue-light-reading-glasses",
    description: "Blue-light filter with a light magnification. Spring hinges, matte frame.",
    weight: 26, images: img2("1577803645773-f96470509666", "1574258495973-f010dfbb5371"),
    option: { title: "Strength", values: ["+1.0", "+1.5", "+2.0"] }, price: 22.0, skuPrefix: "BLF-RDG",
  },
  {
    channel: "Eyewear", title: "Rimless Titanium Frames", handle: "rimless-titanium-frames",
    description: "Featherweight rimless titanium frames with blue-light filtering lenses.",
    weight: 18, images: img2("1574258495973-f010dfbb5371", "1511499767150-a48a237f0083"),
    option: { title: "Color", values: ["Silver", "Graphite"] }, price: 39.0, skuPrefix: "FRM-TTN",
  },
  {
    channel: "Eyewear", title: "Heritage Square Sunglasses", handle: "heritage-square-sunglasses",
    description: "Thick acetate square frame in tortoise, blue-mirrored UV400 lenses. Studio shots, true product photos.",
    weight: 32,
    images: [
      { url: "/tryon/frame-01-front.png" },
      { url: "/tryon/frame-01-angle.png" },
      { url: "/tryon/frame-01-side.png" },
    ],
    option: { title: "Color", values: ["Tortoise"] }, price: 45.0, skuPrefix: "SUN-HER",
  },

  // ── Toys ─────────────────────────────────────────────────────────
  {
    channel: "Toys", title: "500-Piece Art Puzzle", handle: "500-piece-art-puzzle",
    description: "500-piece puzzle, 20 x 15 in finished. Recycled board, matte finish.",
    weight: 420, images: img2("1611996575749-79a3a250f948", "1529641484336-ef35148bab06"),
    option: { title: "Design", values: ["Bloom", "Harbour"] }, price: 15.99, skuPrefix: "PZL-500",
  },
  {
    channel: "Toys", title: "Balancing Stones Set", handle: "balancing-stones-set",
    description: "Set of 9 weighted resin stones for desktop stacking and focus breaks. Adults.",
    weight: 380, images: img2("1607853202273-797f1c22a38e", "1600880292203-757bb62b4baf"),
    option: { title: "Finish", values: ["Slate", "Sandstone"] }, price: 21.0, skuPrefix: "TOY-BAL",
  },
  {
    channel: "Toys", title: "Metal Puzzle Trio", handle: "metal-puzzle-trio",
    description: "Three cast-metal disentanglement puzzles, easy / medium / hard. Ages 14+.",
    weight: 200, images: img2("1622560480605-d83c853bc5c3", "1518384401463-d3876163c195"),
    option: { title: "Variant", values: ["Trio"] }, price: 17.5, skuPrefix: "TOY-MPT",
  },
  {
    channel: "Toys", title: "Poseable Artist Mannequin 12\"", handle: "poseable-artist-mannequin-12",
    description: "12-inch wooden artist mannequin with weighted base. Full articulation.",
    weight: 340, images: img2("1608889175123-8ee362201f81", "1518384401463-d3876163c195"),
    option: { title: "Wood", values: ["Natural", "Walnut"] }, price: 23.0, skuPrefix: "TOY-MAN",
  },

  // ── Watches ──────────────────────────────────────────────────────
  {
    channel: "Watches", title: "GMT Automatic 40mm", handle: "gmt-automatic-40mm",
    description: "40mm GMT, automatic with independent 24h hand, 100m WR, sapphire, steel bracelet.",
    weight: 200, images: img2("1533139502658-0198f920d8e8", "1508057198894-247b23fe5ade"),
    option: { title: "Bezel", values: ["Black / Blue", "Black / Red"] }, price: 249.0, skuPrefix: "WCH-GMT",
  },
  {
    channel: "Watches", title: "Bauhaus Quartz 38mm", handle: "bauhaus-quartz-38mm",
    description: "38mm minimalist quartz, printed dial, domed sapphire, 30m WR, leather strap.",
    weight: 95, images: img2("1524805444758-089113d48a6d", "1523170335258-f5ed11844a49"),
    option: { title: "Dial", values: ["White", "Anthracite"] }, price: 89.0, skuPrefix: "WCH-BHS",
  },
  {
    channel: "Watches", title: "Titanium Field 39mm", handle: "titanium-field-39mm",
    description: "39mm grade-2 titanium field watch, automatic, 100m WR, sapphire, sandwich dial.",
    weight: 120, images: img2("1509048191080-d2984bad6ae5", "1594534475808-b18fc33b045e"),
    option: { title: "Strap", values: ["Titanium", "Nylon"] }, price: 199.0, skuPrefix: "WCH-TIF",
  },
  {
    channel: "Watches", title: "Solar Diver 42mm", handle: "solar-diver-42mm",
    description: "42mm solar-powered quartz diver, 200m WR, unidirectional bezel, lume pip.",
    weight: 170, images: img2("1434056886845-dac89ffe9b56", "1533139502658-0198f920d8e8"),
    option: { title: "Dial", values: ["Black", "Green"] }, price: 139.0, skuPrefix: "WCH-SLR",
  },
];

export default async function addMoreProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  });
  const chId = (name: string) => channels.find((c: any) => c.name === name)?.id;

  const { data: cats } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const catId = (name: string) => cats.find((c: any) => c.name === name)?.id;

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
    logger.info("All extra products already exist — nothing to add.");
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
        category_ids: catId(d.channel) ? [catId(d.channel) as string] : [],
        sales_channels: [{ id: chId(d.channel)! }],
        shipping_profile_id: shippingProfileId,
        images: d.images,
        options: [{ title: d.option.title, values: d.option.values }],
        variants: d.option.values.map((v, i) => ({
          title: v,
          sku: `${d.skuPrefix}-${i + 1}`,
          options: { [d.option.title]: v },
          prices: usd(d.price),
        })),
      })),
    },
  });

  // stock every inventory item at the first location
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

  logger.info(`Added ${toCreate.length} products: ${toCreate.map((d) => d.handle).join(", ")}`);
}
