import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow, deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

export default async function seedRealEyewear({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

  // 1. Find Eyewear sales channel
  const channels = await salesChannelModule.listSalesChannels({
    name: "Eyewear",
  })
  if (!channels.length) {
    logger.error("Sales Channel 'Eyewear' not found!")
    return
  }
  const eyewearChannel = channels[0]

  // 2. Find shipping profile
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfileResult[0]

  // 3. Find Eyewear category
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    filters: { name: "Eyewear" },
  })
  const categoryId = categories[0]?.id

  // 4. Delete existing products assigned to Eyewear channel or category
  logger.info("Cleaning up demo/old products in Eyewear...")
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  })
  
  const demoHandles = [
    "polarized-aviator-sunglasses",
    "blue-light-filter-glasses",
    "round-retro-sunglasses",
    "sport-wrap-sunglasses",
    "oversized-square-sunglasses",
  ]
  
  const toDelete = existingProducts.filter((p: any) => demoHandles.includes(p.handle))
  if (toDelete.length > 0) {
    await deleteProductsWorkflow(container).run({
      input: { ids: toDelete.map((p: any) => p.id) },
    })
    logger.info(`Deleted ${toDelete.length} demo products.`)
  }

  // 5. Read product-photos.json
  const photosJsonPath = path.resolve(process.cwd(), "../storefront/lib/product-photos.json")
  let photosMap: Record<string, { src: string }> = {}
  try {
    const raw = fs.readFileSync(photosJsonPath, "utf-8")
    photosMap = JSON.parse(raw)
  } catch (err) {
    logger.warn(`Could not read product-photos.json from ${photosJsonPath}, fallbacking to empty photos.`)
  }

  const usd = (amount: number) => [{ amount, currency_code: "usd" }]

  // Helper to format title from handle: sun-cartier-c-allonge-de-cartier -> Cartier C Allonge De Cartier
  const formatProductFromHandle = (handle: string) => {
    // handle e.g. "sun-cartier-c-allonge-de-cartier"
    const parts = handle.replace(/^sun-/, "").split("-")
    const brandRaw = parts[0]
    
    // Capitalize words
    const titleWords = parts.map(w => w.charAt(0).toUpperCase() + w.slice(1))
    const title = titleWords.join(" ")

    const photoInfo = photosMap[handle]
    const imageUrl = photoInfo?.src || `/images/eyewear/${handle}.jpg`

    const isChromeHearts = handle.toLowerCase().includes("chrome-hearts")
    const itemPrice = isChromeHearts ? 450 : 350

    return {
      title,
      handle,
      description: `Handcrafted luxury eyewear (${titleWords[0]} design). Features premium UV protection lenses, durable frame architecture, and signature designer aesthetic.`,
      status: ProductStatus.PUBLISHED,
      category_ids: categoryId ? [categoryId] : [],
      sales_channels: [{ id: eyewearChannel.id }],
      shipping_profile_id: shippingProfile.id,
      weight: 120,
      images: [{ url: imageUrl }],
      options: [{ title: "Frame & Lens", values: ["Standard Edition"] }],
      variants: [
        {
          title: "Standard Edition",
          sku: `SKU-${handle.toUpperCase()}`,
          options: { "Frame & Lens": "Standard Edition" },
          prices: usd(itemPrice),
        },
      ],
    }
  }

  const existingHandles = new Set(existingProducts.map((p: any) => p.handle))
  const handles = Object.keys(photosMap).filter(h => !existingHandles.has(h))
  logger.info(`Seeding ${handles.length} real luxury eyewear products (skipping existing ones)...`)

  const productsInput = handles.map(formatProductFromHandle)

  // Chunk in batches of 20 to prevent huge single transactions
  const chunkSize = 20
  let totalCreated = 0

  for (let i = 0; i < productsInput.length; i += chunkSize) {
    const chunk = productsInput.slice(i, i + chunkSize)
    const { result } = await createProductsWorkflow(container).run({
      input: { products: chunk },
    })
    totalCreated += result.length
    logger.info(`Created batch ${Math.floor(i / chunkSize) + 1}/${Math.ceil(productsInput.length / chunkSize)} (${result.length} products)...`)
  }

  logger.info(`Successfully seeded ${totalCreated} REAL luxury eyewear products!`)
}
