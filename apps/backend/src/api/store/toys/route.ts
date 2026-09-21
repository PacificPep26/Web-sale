import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { AGE_GROUPS, type ToyFilters } from "@dtc/shared-types/playpuff"
import { listToysWorkflow } from "../../../workflows/list-toys"

export async function GET(req: MedusaRequest & { publishable_key_context?: { sales_channel_ids: string[] } }, res: MedusaResponse) {
  const filters: ToyFilters = {}
  for (const key of ["audience", "age", "category", "min_price", "max_price", "in_stock", "sort", "page", "q"] as const) {
    const value = req.query[key]
    if (value !== undefined && (typeof value !== "string" || value.length > 160)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid ${key}`)
    if (value) filters[key] = value as string
  }
  if (filters.age && !AGE_GROUPS.some(g => g.id === filters.age)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid age group")
  if (filters.audience && !["kids", "collectors"].includes(filters.audience)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid audience")
  if (filters.sort && !["newest", "price-asc", "price-desc"].includes(filters.sort)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid sort")
  for (const key of ["min_price", "max_price", "page"] as const) {
    if (filters[key] && (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < (key === "page" ? 1 : 0))) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid ${key}`)
  }
  if (filters.page && !Number.isInteger(Number(filters.page))) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid page")
  if (filters.in_stock && !["true", "false"].includes(filters.in_stock)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid stock filter")
  if (filters.min_price && filters.max_price && Number(filters.min_price) > Number(filters.max_price)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Minimum price exceeds maximum price")
  if (typeof req.query.region_id !== "string") throw new MedusaError(MedusaError.Types.INVALID_DATA, "region_id is required")
  const { result } = await listToysWorkflow(req.scope).run({ input: { channel_ids: req.publishable_key_context?.sales_channel_ids ?? [], region_id: req.query.region_id, filters } })
  res.json(result)
}
