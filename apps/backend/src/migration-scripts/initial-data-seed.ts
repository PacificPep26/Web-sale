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
          images: [{ url: "https://images.unsplash.com/photo-1601593346740-925612772716?w=1200" }],
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
          images: [{ url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200" }],
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
          images: [{ url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200" }],
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
          images: [{ url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200" }],
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
          images: [{ url: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=1200" }],
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
          images: [{ url: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=1200" }],
          options: [{ title: "Design", values: ["Coast", "Mountains"] }],
          variants: [
            { title: "Coast", sku: "PZL-1K-COAST", options: { Design: "Coast" }, prices: usd(18.99) },
            { title: "Mountains", sku: "PZL-1K-MTN", options: { Design: "Mountains" }, prices: usd(18.99) },
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
