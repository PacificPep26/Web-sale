import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function deleteSpecificProduct({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const handleToDelete = "sun-fendi-fe4075us-first-crystal"
  const productId = process.env.PRODUCT_ID

  if (productId) {
    await deleteProductsWorkflow(container).run({
      input: { ids: [productId] },
    })
    logger.info(`Successfully deleted product ID ${productId} (${handleToDelete})`)
    return
  }

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
    pagination: { take: 1000 },
  })
  const products = data.filter((product) => product.handle === handleToDelete)

  if (!products.length) {
    logger.info(`Product with handle "${handleToDelete}" not found in database.`)
    return
  }

  const ids = products.map((p: any) => p.id)
  await deleteProductsWorkflow(container).run({
    input: { ids },
  })

  logger.info(`Successfully deleted product: ${products[0].title} (${handleToDelete})`)
}
