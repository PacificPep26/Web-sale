export const AGE_GROUPS = [
  { id: "0-2", name: "Baby & Toddler", label: "Ages 0–2", min: 0, max: 35, color: "mint" },
  { id: "3-5", name: "Preschool", label: "Ages 3–5", min: 36, max: 71, color: "coral" },
  { id: "6-12", name: "Kids", label: "Ages 6–12", min: 72, max: 155, color: "yellow" },
  { id: "13-plus", name: "Teens & Adults", label: "Ages 13+", min: 156, max: Infinity, color: "lavender" },
] as const

export type ToyMetadata = {
  audience: "kids" | "collectors"
  age_min_months: number
  age_max_months?: number | null
  age_source: string
  materials?: string
  dimensions?: string
  box_contents?: string
  warnings?: string
  instructions?: string
  delivery_estimate?: string
}

export function toyMetadata(metadata?: Record<string, unknown> | null): ToyMetadata | null {
  const value = metadata?.playpuff as Partial<ToyMetadata> | undefined
  if (!value || !["kids", "collectors"].includes(value.audience ?? "") ||
    !Number.isInteger(value.age_min_months) || value.age_min_months! < 0 ||
    typeof value.age_source !== "string" || !value.age_source.trim()) return null
  if (value.age_max_months != null && (!Number.isInteger(value.age_max_months) || value.age_max_months < value.age_min_months!)) return null
  if (value.audience === "collectors" && value.age_min_months! < 168) return null
  return value as ToyMetadata
}

export function matchesAge(metadata: Record<string, unknown> | null | undefined, age: string): boolean {
  const group = AGE_GROUPS.find(g => g.id === age)
  const toy = toyMetadata(metadata)
  if (!group || !toy || (toy.audience === "collectors" && group.id !== "13-plus")) return false
  return toy.age_min_months <= group.max && (toy.age_max_months ?? Infinity) >= group.min
}

export function ageLabel(metadata?: Record<string, unknown> | null): string | null {
  const toy = toyMetadata(metadata)
  if (!toy) return null
  const label = (months: number) => months >= 24 && months % 12 === 0 ? `${months / 12}` : `${months} months`
  return toy.age_max_months == null
    ? `${label(toy.age_min_months)}+`
    : `${label(toy.age_min_months)} – ${label(toy.age_max_months)}`
}

export type ToyFilters = {
  audience?: string
  age?: string
  category?: string
  min_price?: string
  max_price?: string
  in_stock?: string
  sort?: string
  page?: string
  q?: string
}

export type ToyVariant = {
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
  calculated_price?: { calculated_amount?: number | null } | null
}

export function variantAvailable(variant: ToyVariant): boolean {
  return variant.manage_inventory === false || variant.allow_backorder === true || (variant.inventory_quantity ?? 0) > 0
}

export function toyPrice(product: { variants?: ToyVariant[] | null }): number | undefined {
  const prices = (product.variants ?? []).map(v => v.calculated_price?.calculated_amount).filter((p): p is number => typeof p === "number" && Number.isFinite(p))
  return prices.length ? Math.min(...prices) : undefined
}

export function filterToys<T extends { id: string; title: string; metadata?: Record<string, unknown> | null; created_at?: string | Date | null; categories?: { id: string; name?: string; handle?: string }[] | null; variants?: ToyVariant[] | null }>(products: T[], filters: ToyFilters) {
  const number = (value?: string) => value?.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : undefined
  const min = number(filters.min_price)
  const max = number(filters.max_price)
  const filtered = products.filter(p => {
    const toy = toyMetadata(p.metadata)
    const price = toyPrice(p)
    return (!filters.audience || toy?.audience === filters.audience) &&
      (!filters.age || matchesAge(p.metadata, filters.age)) &&
      (!filters.category || p.categories?.some(c => c.handle === filters.category)) &&
      (min === undefined || (price !== undefined && price >= min)) &&
      (max === undefined || (price !== undefined && price <= max)) &&
      (filters.in_stock !== "true" || p.variants?.some(variantAvailable)) &&
      (!filters.q || p.title.toLowerCase().includes(filters.q.toLowerCase()))
  })
  filtered.sort((a, b) => {
    if (filters.sort === "price-asc" || filters.sort === "price-desc") {
      const x = toyPrice(a), y = toyPrice(b)
      if (x === undefined) return y === undefined ? a.id.localeCompare(b.id) : 1
      if (y === undefined) return -1
      return (filters.sort === "price-asc" ? x - y : y - x) || a.id.localeCompare(b.id)
    }
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime() || a.id.localeCompare(b.id)
  })
  const page = Math.max(1, Math.floor(number(filters.page) ?? 1))
  return { products: filtered.slice((page - 1) * 24, page * 24), count: filtered.length, page, limit: 24 }
}
