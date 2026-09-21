import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow, updateProductsWorkflow, updateProductVariantsWorkflow, createInventoryLevelsWorkflow, updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import SupplierModuleService from "../modules/supplier/service"
import { toyCatalog } from "../lib/playpuff-catalog"

type Input = { rows: unknown; apply: boolean }

const importToysStep = createStep("import-playpuff-skus", async (input: Input, { container }) => {
  const rows = toyCatalog.parse(input.rows)
  const query = container.resolve("query")
  const suppliers: SupplierModuleService = container.resolve("supplier")
  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id", "name", "stock_locations.id"], filters: { name: "Toys" } })
  const channel = channels[0]
  if (!channel) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Toys sales channel is missing")
  const prepared: { row: typeof rows[number]; productId?: string; variantId?: string; metadata?: Record<string, unknown> | null }[] = []
  // Validate every row and its references before any writes.
  for (const row of rows) {
    const supplier = await suppliers.retrieveSupplier(row.supplier_id)
    if (!supplier.is_active) throw new Error(`${row.sku}: supplier is inactive`)
    if (!channel.stock_locations?.some(l => l?.id === row.location_id)) throw new Error(`${row.sku}: stock location is not linked to Toys`)
    const { data: categories } = await query.graph({ entity: "product_category", fields: ["id"], filters: { id: row.category_ids } })
    if (categories.length !== row.category_ids.length) throw new Error(`${row.sku}: missing category`)
    const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"], filters: { id: row.shipping_profile_id } })
    if (!profiles.length) throw new Error(`${row.sku}: missing shipping profile`)
    const { data: variants } = await query.graph({ entity: "variant", fields: ["id", "product_id", "product.metadata", "product.handle", "product.sales_channels.id", "product.variants.id"], filters: { sku: row.sku } })
    const variant = variants[0]
    if (variant && (!variant.product?.sales_channels?.some(c => c?.id === channel.id) || variant.product.variants?.length !== 1 || variant.product.handle !== row.handle)) throw new Error(`${row.sku}: existing product must be a single-SKU Toys product with the same handle`)
    if (!variant) {
      const { data: sameHandle } = await query.graph({ entity: "product", fields: ["id"], filters: { handle: row.handle } })
      if (sameHandle.length) throw new Error(`${row.sku}: handle already belongs to another product`)
    }
    prepared.push({ row, productId: variant?.product_id ?? undefined, variantId: variant?.id, metadata: variant?.product?.metadata })
  }
  if (!input.apply) return new StepResponse({ dry_run: true, products: prepared.map(p => ({ sku: p.row.sku, operation: p.variantId ? "update" : "create", status: p.row.publish ? "published" : "draft" })) })
  const results: { sku: string; product_id: string }[] = []
  const results: { sku: string; operation: string; status: string }[] = []
  for (const item of prepared) {
    const { row } = item
    const product = { title: row.title, description: row.description, handle: row.handle, thumbnail: row.images[0], images: row.images.map(url => ({ url })), category_ids: row.category_ids, shipping_profile_id: row.shipping_profile_id, metadata: { ...item.metadata, playpuff: row.playpuff }, status: ProductStatus.DRAFT }
    let productId = item.productId, variantId = item.variantId
    if (!productId) {
      const { result } = await createProductsWorkflow(container).run({ input: { products: [{ ...product, sales_channels: [{ id: channel.id }], options: [{ title: "Option", values: ["Standard"] }], variants: [{ title: "Standard", sku: row.sku, manage_inventory: true, allow_backorder: false, options: { Option: "Standard" }, prices: [{ currency_code: "usd", amount: row.price_usd }] }] }] } })
      productId = result[0].id
      variantId = result[0].variants![0].id
    } else {
      await updateProductsWorkflow(container).run({ input: { products: [{ ...product, id: productId }] } })
      await updateProductVariantsWorkflow(container).run({ input: { product_variants: [{ id: variantId!, manage_inventory: true, allow_backorder: false, prices: [{ currency_code: "usd", amount: row.price_usd }] }] } })
    }
    const { data: inventoryVariants } = await query.graph({ entity: "variant", fields: ["id", "inventory_items.inventory_item_id", "inventory_items.inventory.location_levels.id", "inventory_items.inventory.location_levels.location_id"], filters: { id: variantId! } })
    const inventory = inventoryVariants[0]?.inventory_items?.[0]
    if (!inventory) throw new Error(`${row.sku}: inventory missing; product remains draft`)
    const level = inventory.inventory?.location_levels?.find(l => l?.location_id === row.location_id)
    const stock = { inventory_item_id: inventory.inventory_item_id, location_id: row.location_id, stocked_quantity: row.stock }
    if (level) await updateInventoryLevelsWorkflow(container).run({ input: { updates: [{ ...stock, id: level.id }] } })
    else await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [stock] } })
    const mappings = await suppliers.listSupplierVariants({ variant_id: variantId!, supplier_id: row.supplier_id })
    const mapping = { supplier_id: row.supplier_id, variant_id: variantId!, supplier_sku: row.supplier_sku, supplier_product_id: row.supplier_product_id, supplier_variant_id: row.supplier_variant_id, cost_amount: row.cost_usd, cost_currency: "usd", ship_from: row.ship_from, handling_days_min: row.handling_days_min, handling_days_max: row.handling_days_max, is_preferred: true }
    if (mappings[0]) await suppliers.updateSupplierVariants({ ...mapping, id: mappings[0].id })
    else await suppliers.createSupplierVariants(mapping)
    if (row.publish) await updateProductsWorkflow(container).run({ input: { products: [{ id: productId!, status: ProductStatus.PUBLISHED }] } })
    results.push({ sku: row.sku, product_id: productId! })
    results.push({ sku: row.sku, operation: item.variantId ? "update" : "create", status: row.publish ? "published" : "draft" })
  }
  return new StepResponse({ dry_run: false, products: results })
})

export const importToysWorkflow = createWorkflow("import-playpuff-catalog", (input: Input) => new WorkflowResponse(importToysStep(input)))
