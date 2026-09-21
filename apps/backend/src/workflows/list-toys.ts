import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, getVariantAvailability, MedusaError, ProductStatus, QueryContext } from "@medusajs/framework/utils"
import { filterToys, type ToyFilters } from "@dtc/shared-types/playpuff"

type Input = { channel_ids: string[]; region_id: string; filters: ToyFilters }

const listToysStep = createStep("list-playpuff-products", async (input: Input, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "name"], filters: { id: input.channel_ids } })
  const channel = channels.find(c => c.name === "Toys")
  if (!channel) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This key does not have access to the Toys sales channel")
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code", "countries.iso_2"], filters: { id: input.region_id } })
  const region = regions[0]
  if (!region || region.currency_code !== "usd" || !region.countries?.some(c => c?.iso_2 === "us")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "PlayPuff requires a USD region serving the United States")
  }
  const ids: string[] = []
  for (let skip = 0; ; skip += 100) {
    const { data: links } = await query.graph({ entity: "product_sales_channel", fields: ["product_id"], filters: { sales_channel_id: channel.id }, pagination: { skip, take: 100 } })
    ids.push(...links.map(link => link.product_id))
    if (links.length < 100) break
  }
  if (!ids.length) return new StepResponse({ products: [], count: 0, page: 1, limit: 24, categories: [] })
  const productFilters = { status: ProductStatus.PUBLISHED, id: ids }
  const products: Array<Record<string, any>> = []
  for (let skip = 0; ; skip += 100) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "description", "thumbnail", "created_at", "metadata", "images.url", "categories.id", "categories.name", "categories.handle", "categories.is_internal", "categories.is_active", "variants.id", "variants.title", "variants.manage_inventory", "variants.allow_backorder", "variants.calculated_price.*"],
      filters: productFilters,
      pagination: { skip, take: 100, order: { id: "ASC" } },
      context: { variants: { calculated_price: QueryContext({ region_id: region.id, currency_code: region.currency_code }) } },
    })
    const variants = data.flatMap(p => p.variants ?? []).filter(v => v != null)
    if (variants.length) {
      const availability = await getVariantAvailability(query, { variant_ids: variants.map(v => v.id), sales_channel_id: channel.id })
      for (const variant of variants) Object.assign(variant, { inventory_quantity: availability[variant.id]?.availability ?? 0 })
    }
    products.push(...data)
    if (data.length < 100) break
  }
  // Only expose the public, validated merchandising fields, never arbitrary supplier metadata.
  const publicProducts = products.map(p => ({ ...p, id: p.id as string, title: p.title as string, categories: (p.categories ?? []).filter(c => !c.is_internal && c.is_active), metadata: { playpuff: p.metadata?.playpuff ?? null } }))
  const categories = Array.from(new Map(publicProducts.flatMap(p => p.categories ?? []).filter(c => c.handle !== "toys").map(c => [c.id, { id: c.id, name: c.name, handle: c.handle }])).values())
  return new StepResponse({ ...filterToys(publicProducts, input.filters), categories })
})

export const listToysWorkflow = createWorkflow("list-playpuff-catalog", (input: Input) => new WorkflowResponse(listToysStep(input)))
