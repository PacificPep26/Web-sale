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

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
    filters: { handle: handleToDelete },
  })

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
