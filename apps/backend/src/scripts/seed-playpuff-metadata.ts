import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedPlaypuffMetadata({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

  const channels = await salesChannelModule.listSalesChannels({
    name: "Toys",
  })
  if (!channels.length) {
    logger.error("Sales Channel 'Toys' not found!")
    return
  }
  const toysChannel = channels[0]

  const { data: links } = await query.graph({
    entity: "product_sales_channel",
    fields: ["product_id"],
    filters: { sales_channel_id: toysChannel.id },
  })
  const productIds = links.map((l: any) => l.product_id)

  if (!productIds.length) {
    logger.info("No products found in Toys sales channel.")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "metadata"],
    filters: { id: productIds },
  })

  logger.info(`Adding PlayPuff metadata to ${products.length} products...`)

  const updates = products.map((p: any) => {
    let playpuffMeta = p.metadata?.playpuff

    if (!playpuffMeta) {
      if (p.handle.includes("figure") || p.handle.includes("puzzle") || p.handle.includes("teaser")) {
        playpuffMeta = {
          audience: "kids",
          age_min_months: 36, // 3 years old (Ages 3–5)
          age_max_months: 144,
          age_source: "manual_seed",
          materials: "Eco-friendly wood / Non-toxic plastic",
        }
      } else {
        playpuffMeta = {
          audience: "kids",
          age_min_months: 12, // 1 year old (Ages 0–2)
          age_max_months: 60,
          age_source: "manual_seed",
          materials: "Soft organic cotton / Natural bamboo",
        }
      }
    }

    return {
      id: p.id,
      metadata: {
        ...p.metadata,
        playpuff: playpuffMeta,
      },
    }
  })

  await updateProductsWorkflow(container).run({
    input: { products: updates },
  })

  logger.info("Successfully updated PlayPuff metadata for all toy products!")
}
