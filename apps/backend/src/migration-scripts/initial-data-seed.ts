import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Base data for a US-market, multi-niche dropship platform.
 *
 * Creates: USD store · US region + tax region · US warehouse + manual
 * fulfillment · Standard/Express shipping · three sales channels
 * (Cases / Eyewear / Toys), each with its own publishable API key · a couple of
 * sample products per channel.
 *
 * Runs as part of `medusa db:migrate`. Idempotent-ish: it bails early if the
 * "Cases" sales channel already exists, so re-running migrate is safe. For a
 * clean slate use `npm run infra:reset` then migrate again.
 *
 * The generated publishable keys are printed at the end — copy them into
 * apps/storefront/.env.local (NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_<NICHE>).
 * You can also re-print them any time with:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/print-publishable-keys.ts
 */

const NICHES = [
  { key: "cases", name: "Cases", description: "Phone & laptop cases" },
  { key: "eyewear", name: "Eyewear", description: "Sunglasses & blue-light glasses" },
  { key: "toys", name: "Toys", description: "Figures, models & puzzles" },
] as const;

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const existing = await salesChannelModule.listSalesChannels({
    name: "Cases",
  });
  if (existing.length) {
    logger.info("Base data already seeded (found 'Cases' sales channel) — skipping.");
    return;
  }

  logger.info("Seeding sales channels...");
  const { result: channels } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: NICHES.map((n) => ({
        name: n.name,
        description: n.description,
      })),
    },
  });
  const channelByKey = Object.fromEntries(
    NICHES.map((n) => [n.key, channels.find((c) => c.name === n.name)!])
  );

  logger.info("Seeding store...");
  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Web Product Project",
          supported_currencies: [{ currency_code: "usd", is_default: true }],
          default_sales_channel_id: channelByKey.cases.id,
        },
      ],
    },
  });

  logger.info("Seeding US region + tax region...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United States",
          currency_code: "usd",
          countries: ["us"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "us", provider_id: "tp_system" }],
  });

  logger.info("Seeding US warehouse + fulfillment...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "US Warehouse",
          address: { city: "Dover", country_code: "US", address_1: "" },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "US Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "United States",
        geo_zones: [{ country_code: "us", type: "country" }],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  const shippingRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "Ships in 2-5 business days.", code: "standard" },
        prices: [
          { currency_code: "usd", amount: 6.9 },
          { region_id: region.id, amount: 6.9 },
        ],
        rules: shippingRules,
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Express", description: "Ships in 1-2 business days.", code: "express" },
        prices: [
          { currency_code: "usd", amount: 14.9 },
          { region_id: region.id, amount: 14.9 },
        ],
        rules: shippingRules,
      },
    ],
  });

  logger.info("Linking sales channels to warehouse + publishable keys...");
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: channels.map((c) => c.id) },
  });

  const generatedKeys: { niche: string; token: string }[] = [];
  for (const n of NICHES) {
    const {
      result: [apiKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: `${n.name} storefront`, type: "publishable", created_by: "seed" },
        ],
      },
    });
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKey.id, add: [channelByKey[n.key].id] },
    });
    generatedKeys.push({ niche: n.key, token: apiKey.token });
  }

  logger.info("Seeding sample products...");
  const { result: categories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: NICHES.map((n) => ({ name: n.name, is_active: true })),
    },
  });
  const catId = (name: string) => categories.find((c) => c.name === name)!.id;

  const usd = (amount: number) => [{ amount, currency_code: "usd" }];

  // 2–3 verified Unsplash photos per product, by handle
  const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;
  const IMAGES: Record<string, string[]> = {
    "slim-shockproof-phone-case": ["1601593346740-925612772716", "1592890288564-76628a30a657", "1573148195900-7845dcb9b127"],
    "felt-laptop-sleeve-13-14": ["1527443224154-c4a3942d3acf", "1491933382434-500287f9b54b"],
    "magsafe-wallet-case": ["1556228578-8c89e6adf883", "1601972602288-3be527b4f18a"],
    "clear-bumper-case": ["1610945265064-0e34e5519bbf", "1616423640778-28d1b53229bd"],
    "kickstand-rugged-case": ["1587033411391-5d9e51cce126", "1601593346740-925612772716"],
    "16-laptop-sleeve": ["1583394838336-acd977736f90", "1585060544812-6b45742d762f"],
    "polarized-aviator-sunglasses": ["1511499767150-a48a237f0083", "1508296695146-257a814070b4"],
    "blue-light-filter-glasses": ["1574258495973-f010dfbb5371", "1595950653106-6c9ebd614d3a"],
    "round-retro-sunglasses": ["1508296695146-257a814070b4", "1546435770-a3e426bf472b"],
    "sport-wrap-sunglasses": ["1577803645773-f96470509666", "1473496169904-658ba7c44d8a"],
    "oversized-square-sunglasses": ["1473496169904-658ba7c44d8a", "1511499767150-a48a237f0083"],
    "articulated-desk-figure": ["1608889175123-8ee362201f81", "1518384401463-d3876163c195"],
    "1000-piece-landscape-puzzle": ["1611996575749-79a3a250f948", "1529641484336-ef35148bab06"],
    "wooden-brain-teaser-set": ["1606092195730-5d7b9af1efc5", "1622560480605-d83c853bc5c3"],
    "desktop-zen-garden": ["1600880292203-757bb62b4baf", "1607853202273-797f1c22a38e"],
    "magnetic-fidget-sticks": ["1518946222227-364f22132616", "1529641484336-ef35148bab06"],
  };
  const imgs = (handle: string) =>
    (IMAGES[handle] ?? ["1512054502232-10a0a035d672"]).map((id) => ({ url: U(id) }));

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Slim Shockproof Phone Case",
          handle: "slim-shockproof-phone-case",
          description:
            "A low-profile TPU + polycarbonate case with raised camera and screen lips. Grippy matte finish, wireless-charging friendly.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 60,
          images: imgs("slim-shockproof-phone-case"),
          options: [{ title: "Model", values: ["iPhone 15", "iPhone 15 Pro", "Galaxy S24"] }],
          variants: [
            { title: "iPhone 15", sku: "CASE-SLIM-IP15", options: { Model: "iPhone 15" }, prices: usd(19.99) },
            { title: "iPhone 15 Pro", sku: "CASE-SLIM-IP15P", options: { Model: "iPhone 15 Pro" }, prices: usd(19.99) },
            { title: "Galaxy S24", sku: "CASE-SLIM-GS24", options: { Model: "Galaxy S24" }, prices: usd(19.99) },
          ],
        },
        {
          title: "Felt Laptop Sleeve 13–14\"",
          handle: "felt-laptop-sleeve-13-14",
          description:
            "Wool-blend felt sleeve with a soft microfiber lining and magnetic flap. Fits most 13–14\" laptops.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 180,
          images: imgs("felt-laptop-sleeve-13-14"),
          options: [{ title: "Color", values: ["Charcoal", "Sand"] }],
          variants: [
            { title: "Charcoal", sku: "SLV-FELT-CHAR", options: { Color: "Charcoal" }, prices: usd(29) },
            { title: "Sand", sku: "SLV-FELT-SAND", options: { Color: "Sand" }, prices: usd(29) },
          ],
        },
        {
          title: "Polarized Aviator Sunglasses",
          handle: "polarized-aviator-sunglasses",
          description:
            "Classic aviator frame with polarized, impact-resistant lenses and UV400 protection. Spring hinges, lightweight metal frame.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Eyewear")],
          sales_channels: [{ id: channelByKey.eyewear.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 40,
          images: imgs("polarized-aviator-sunglasses"),
          options: [{ title: "Color", values: ["Gold / Green", "Black / Grey"] }],
          variants: [
            { title: "Gold / Green", sku: "SUN-AVI-GLD", options: { Color: "Gold / Green" }, prices: usd(34) },
            { title: "Black / Grey", sku: "SUN-AVI-BLK", options: { Color: "Black / Grey" }, prices: usd(34) },
          ],
        },
        {
          title: "Blue-Light Filter Glasses",
          handle: "blue-light-filter-glasses",
          description:
            "Everyday frames with a clear blue-light filtering coating. Anti-glare, no prescription.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Eyewear")],
          sales_channels: [{ id: channelByKey.eyewear.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 35,
          images: imgs("blue-light-filter-glasses"),
          options: [{ title: "Color", values: ["Tortoise", "Matte Black"] }],
          variants: [
            { title: "Tortoise", sku: "BLF-TORT", options: { Color: "Tortoise" }, prices: usd(25) },
            { title: "Matte Black", sku: "BLF-MBLK", options: { Color: "Matte Black" }, prices: usd(25) },
          ],
        },
        {
          title: "Articulated Desk Figure",
          handle: "articulated-desk-figure",
          description:
            "6-inch articulated collectible figure with display stand. Adult collectors — not a toy for children under 14.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Toys")],
          sales_channels: [{ id: channelByKey.toys.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 220,
          images: imgs("articulated-desk-figure"),
          options: [{ title: "Variant", values: ["Standard"] }],
          variants: [
            { title: "Standard", sku: "FIG-DESK-STD", options: { Variant: "Standard" }, prices: usd(24.99) },
          ],
        },
        {
          title: "1000-Piece Landscape Puzzle",
          handle: "1000-piece-landscape-puzzle",
          description:
            "1000-piece jigsaw puzzle, finished size 27 x 20 in. Recycled board, linen-texture print.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Toys")],
          sales_channels: [{ id: channelByKey.toys.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 600,
          images: imgs("1000-piece-landscape-puzzle"),
          options: [{ title: "Design", values: ["Coast", "Mountains"] }],
          variants: [
            { title: "Coast", sku: "PZL-1K-COAST", options: { Design: "Coast" }, prices: usd(18.99) },
            { title: "Mountains", sku: "PZL-1K-MTN", options: { Design: "Mountains" }, prices: usd(18.99) },
          ],
        },

        // ── more cases ──────────────────────────────────────────────
        {
          title: "MagSafe Wallet Case",
          handle: "magsafe-wallet-case",
          description:
            "Leather-look case with a magnetic card pocket on the back. Holds 2–3 cards. MagSafe pass-through.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 70,
          images: imgs("magsafe-wallet-case"),
          options: [{ title: "Model", values: ["iPhone 15", "iPhone 15 Pro"] }],
          variants: [
            { title: "iPhone 15", sku: "CASE-MAG-IP15", options: { Model: "iPhone 15" }, prices: usd(24.99) },
            { title: "iPhone 15 Pro", sku: "CASE-MAG-IP15P", options: { Model: "iPhone 15 Pro" }, prices: usd(24.99) },
          ],
        },
        {
          title: "Clear Bumper Case",
          handle: "clear-bumper-case",
          description:
            "Ultra-clear, yellowing-resistant TPU with reinforced corners. Shows off your phone.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 45,
          images: imgs("clear-bumper-case"),
          options: [{ title: "Model", values: ["iPhone 15", "Galaxy S24", "Pixel 8"] }],
          variants: [
            { title: "iPhone 15", sku: "CASE-CLR-IP15", options: { Model: "iPhone 15" }, prices: usd(14.99) },
            { title: "Galaxy S24", sku: "CASE-CLR-GS24", options: { Model: "Galaxy S24" }, prices: usd(14.99) },
            { title: "Pixel 8", sku: "CASE-CLR-PX8", options: { Model: "Pixel 8" }, prices: usd(14.99) },
          ],
        },
        {
          title: "Kickstand Rugged Case",
          handle: "kickstand-rugged-case",
          description:
            "Dual-layer armor case with a built-in metal kickstand for hands-free video. Drop-tested to 10 ft.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 95,
          images: imgs("kickstand-rugged-case"),
          options: [{ title: "Model", values: ["iPhone 15 Pro", "Galaxy S24"] }],
          variants: [
            { title: "iPhone 15 Pro", sku: "CASE-KIK-IP15P", options: { Model: "iPhone 15 Pro" }, prices: usd(21.99) },
            { title: "Galaxy S24", sku: "CASE-KIK-GS24", options: { Model: "Galaxy S24" }, prices: usd(21.99) },
          ],
        },
        {
          title: "16\" Laptop Sleeve",
          handle: "16-laptop-sleeve",
          description:
            "Water-repellent sleeve with a plush lining and a front zip pocket for a charger. Fits 15–16\" laptops.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Cases")],
          sales_channels: [{ id: channelByKey.cases.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 210,
          images: imgs("16-laptop-sleeve"),
          options: [{ title: "Color", values: ["Graphite", "Olive"] }],
          variants: [
            { title: "Graphite", sku: "SLV-16-GRA", options: { Color: "Graphite" }, prices: usd(32) },
            { title: "Olive", sku: "SLV-16-OLV", options: { Color: "Olive" }, prices: usd(32) },
          ],
        },

        // ── more eyewear ────────────────────────────────────────────
        {
          title: "Round Retro Sunglasses",
          handle: "round-retro-sunglasses",
          description:
            "Slim metal round frame, polarized UV400 lenses, adjustable nose pads.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Eyewear")],
          sales_channels: [{ id: channelByKey.eyewear.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 32,
          images: imgs("round-retro-sunglasses"),
          options: [{ title: "Color", values: ["Gold", "Gunmetal"] }],
          variants: [
            { title: "Gold", sku: "SUN-RND-GLD", options: { Color: "Gold" }, prices: usd(29) },
            { title: "Gunmetal", sku: "SUN-RND-GUN", options: { Color: "Gunmetal" }, prices: usd(29) },
          ],
        },
        {
          title: "Sport Wrap Sunglasses",
          handle: "sport-wrap-sunglasses",
          description:
            "Wraparound shatter-resistant lenses, rubberized grip temples, made for running and cycling.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Eyewear")],
          sales_channels: [{ id: channelByKey.eyewear.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 28,
          images: imgs("sport-wrap-sunglasses"),
          options: [{ title: "Color", values: ["Black", "Neon"] }],
          variants: [
            { title: "Black", sku: "SUN-SPT-BLK", options: { Color: "Black" }, prices: usd(27) },
            { title: "Neon", sku: "SUN-SPT-NEO", options: { Color: "Neon" }, prices: usd(27) },
          ],
        },
        {
          title: "Oversized Square Sunglasses",
          handle: "oversized-square-sunglasses",
          description:
            "Bold acetate square frame with gradient UV400 lenses. Statement piece, lightweight fit.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Eyewear")],
          sales_channels: [{ id: channelByKey.eyewear.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 44,
          images: imgs("oversized-square-sunglasses"),
          options: [{ title: "Color", values: ["Tortoise", "Black"] }],
          variants: [
            { title: "Tortoise", sku: "SUN-SQR-TRT", options: { Color: "Tortoise" }, prices: usd(31) },
            { title: "Black", sku: "SUN-SQR-BLK", options: { Color: "Black" }, prices: usd(31) },
          ],
        },

        // ── more toys ───────────────────────────────────────────────
        {
          title: "Wooden Brain Teaser Set",
          handle: "wooden-brain-teaser-set",
          description:
            "Set of 6 interlocking wooden puzzles of increasing difficulty. Solutions card included. Ages 14+.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Toys")],
          sales_channels: [{ id: channelByKey.toys.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 320,
          images: imgs("wooden-brain-teaser-set"),
          options: [{ title: "Variant", values: ["Set of 6"] }],
          variants: [
            { title: "Set of 6", sku: "TOY-WBT-6", options: { Variant: "Set of 6" }, prices: usd(19.99) },
          ],
        },
        {
          title: "Desktop Zen Garden",
          handle: "desktop-zen-garden",
          description:
            "Mini sand garden with rake, stones and a bamboo tray. A small reset for a busy desk. Adult decor.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Toys")],
          sales_channels: [{ id: channelByKey.toys.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 500,
          images: imgs("desktop-zen-garden"),
          options: [{ title: "Tray", values: ["Bamboo", "Slate"] }],
          variants: [
            { title: "Bamboo", sku: "TOY-ZEN-BMB", options: { Tray: "Bamboo" }, prices: usd(22.5) },
            { title: "Slate", sku: "TOY-ZEN-SLT", options: { Tray: "Slate" }, prices: usd(22.5) },
          ],
        },
        {
          title: "Magnetic Fidget Sticks",
          handle: "magnetic-fidget-sticks",
          description:
            "Set of magnetic rods and steel balls to build, click and fidget. 84 pieces. Not for children under 14.",
          status: ProductStatus.PUBLISHED,
          category_ids: [catId("Toys")],
          sales_channels: [{ id: channelByKey.toys.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 260,
          images: imgs("magnetic-fidget-sticks"),
          options: [{ title: "Pieces", values: ["84 pcs"] }],
          variants: [
            { title: "84 pcs", sku: "TOY-MFS-84", options: { Pieces: "84 pcs" }, prices: usd(16.5) },
          ],
        },
      ],
    },
  });

  // Stock every inventory item at the US warehouse so checkout/reservations work
  // in dev (real routing uses supplier stock checks, added in M2).
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  if (inventoryItems.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryItems.map((i: { id: string }) => ({
          inventory_item_id: i.id,
          location_id: stockLocation.id,
          stocked_quantity: 1000,
        })),
      },
    });
  }

  logger.info("──────────────────────────────────────────────────────────────");
  logger.info("Publishable API keys (put in apps/storefront/.env.local):");
  for (const k of generatedKeys) {
    logger.info(`  NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_${k.niche.toUpperCase()}=${k.token}`);
  }
  logger.info("──────────────────────────────────────────────────────────────");
  logger.info("Finished base data seed.");
}
