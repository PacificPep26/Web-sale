import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedEyewear({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

  // Find Eyewear sales channel
  const channels = await salesChannelModule.listSalesChannels({
    name: "Eyewear",
  })
  
  if (!channels.length) {
    logger.error("Sales Channel 'Eyewear' not found!")
    return
  }
  const eyewearChannel = channels[0]

  // Find shipping profile
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfileResult[0]

  // Find Eyewear category
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: "Eyewear" },
  })
  const categoryId = categories[0]?.id

  const usd = (amount: number) => [{ amount, currency_code: "usd" }]
  const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`

  logger.info("Adding Eyewear (Kính mát & Kính chống ánh sáng xanh) products...")

  const { result: createdProducts } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Polarized Aviator Sunglasses",
          handle: "polarized-aviator-sunglasses",
          description:
            "Classic metal-frame aviator sunglasses with TAC polarized lenses. UV400 protection, lightweight alloy frame, silicone nose pads.",
          status: ProductStatus.PUBLISHED,
          category_ids: categoryId ? [categoryId] : [],
          sales_channels: [{ id: eyewearChannel.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 45,
          images: [
            { url: U("1511499767150-a48a237f0083") },
            { url: U("1508296695146-257a814070b4") },
          ],
          options: [{ title: "Frame Color", values: ["Gold / Green Lens", "Black / Dark Grey Lens"] }],
          variants: [
            { title: "Gold / Green Lens", sku: "EYE-AVI-GLD", options: { "Frame Color": "Gold / Green Lens" }, prices: usd(34.99) },
            { title: "Black / Dark Grey Lens", sku: "EYE-AVI-BLK", options: { "Frame Color": "Black / Dark Grey Lens" }, prices: usd(34.99) },
          ],
        },
        {
          title: "Blue Light Filter Glasses",
          handle: "blue-light-filter-glasses",
          description:
            "TR90 anti-blue light glasses for digital screen glare reduction. Anti-reflective CR-39 lenses, flexible spring hinges.",
          status: ProductStatus.PUBLISHED,
          category_ids: categoryId ? [categoryId] : [],
          sales_channels: [{ id: eyewearChannel.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 30,
          images: [
            { url: U("1574258495973-f010dfbb5371") },
            { url: U("1577803645773-f96470509666") },
          ],
          options: [{ title: "Frame Finish", values: ["Matte Black", "Tortoise Shell", "Clear Crystal"] }],
          variants: [
            { title: "Matte Black", sku: "EYE-BLU-BLK", options: { "Frame Finish": "Matte Black" }, prices: usd(29.99) },
            { title: "Tortoise Shell", sku: "EYE-BLU-TOR", options: { "Frame Finish": "Tortoise Shell" }, prices: usd(29.99) },
            { title: "Clear Crystal", sku: "EYE-BLU-CLR", options: { "Frame Finish": "Clear Crystal" }, prices: usd(29.99) },
          ],
        },
        {
          title: "Round Retro Sunglasses",
          handle: "round-retro-sunglasses",
          description:
            "Vintage round-frame sunglasses with acetate tips and UV400 protective tint.",
          status: ProductStatus.PUBLISHED,
          category_ids: categoryId ? [categoryId] : [],
          sales_channels: [{ id: eyewearChannel.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 40,
          images: [
            { url: U("1508296695146-257a814070b4") },
            { url: U("1473496169904-658ba7c44d8a") },
          ],
          options: [{ title: "Color", values: ["Bronze", "Silver"] }],
          variants: [
            { title: "Bronze", sku: "EYE-RND-BRZ", options: { Color: "Bronze" }, prices: usd(31.50) },
            { title: "Silver", sku: "EYE-RND-SLV", options: { Color: "Silver" }, prices: usd(31.50) },
          ],
        },
        {
          title: "Sport Wrap Sunglasses",
          handle: "sport-wrap-sunglasses",
          description:
            "Aerodynamic sport sunglasses with shatterproof polycarbonate polarized lenses.",
          status: ProductStatus.PUBLISHED,
          category_ids: categoryId ? [categoryId] : [],
          sales_channels: [{ id: eyewearChannel.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 55,
          images: [
            { url: U("1577803645773-f96470509666") },
            { url: U("1473496169904-658ba7c44d8a") },
          ],
          options: [{ title: "Lens", values: ["Mirrored Red", "Polarized Smoke"] }],
          variants: [
            { title: "Mirrored Red", sku: "EYE-SPT-RED", options: { Lens: "Mirrored Red" }, prices: usd(39.99) },
            { title: "Polarized Smoke", sku: "EYE-SPT-SMK", options: { Lens: "Polarized Smoke" }, prices: usd(39.99) },
          ],
        },
        {
          title: "Oversized Square Sunglasses",
          handle: "oversized-square-sunglasses",
          description:
            "Bold acetate oversized square frame with gradient UV protection lenses.",
          status: ProductStatus.PUBLISHED,
          category_ids: categoryId ? [categoryId] : [],
          sales_channels: [{ id: eyewearChannel.id }],
          shipping_profile_id: shippingProfile.id,
          weight: 65,
          images: [
            { url: U("1473496169904-658ba7c44d8a") },
            { url: U("1511499767150-a48a237f0083") },
          ],
          options: [{ title: "Style", values: ["Glossy Black", "Amber Leopard"] }],
          variants: [
            { title: "Glossy Black", sku: "EYE-SQR-BLK", options: { Style: "Glossy Black" }, prices: usd(42.00) },
            { title: "Amber Leopard", sku: "EYE-SQR-AMB", options: { Style: "Amber Leopard" }, prices: usd(42.00) },
          ],
        },
      ],
    },
  })

  logger.info(`Successfully added ${createdProducts.length} Eyewear products!`)
}

