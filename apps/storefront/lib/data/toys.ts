import "server-only"
import { sdk } from "@/lib/medusa"
import { getRegion } from "./regions"
import type { HttpTypes } from "@medusajs/types"
import type { ToyFilters } from "@dtc/shared-types/playpuff"

export type ToyCatalog = { products: HttpTypes.StoreProduct[]; count: number; page: number; limit: number; categories: { id: string; name: string; handle: string }[] }

export async function listToys(filters: ToyFilters = {}): Promise<ToyCatalog> {
  const region = await getRegion()
  return sdk.client.fetch<ToyCatalog>("/store/toys", { query: { ...filters, region_id: region.id }, cache: "no-store" })
}
