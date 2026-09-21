import { z } from "zod"

export const toyCatalogRow = z.object({
  sku: z.string().trim().min(1),
  handle: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  price_usd: z.number().positive(),
  stock: z.number().int().nonnegative(),
  images: z.array(z.string().url()).min(1),
  image_rights_confirmed: z.literal(true),
  category_ids: z.array(z.string().min(1)).min(1),
  shipping_profile_id: z.string().min(1),
  location_id: z.string().min(1),
  supplier_id: z.string().min(1),
  supplier_sku: z.string().min(1),
  supplier_product_id: z.string().min(1),
  supplier_variant_id: z.string().min(1),
  cost_usd: z.number().nonnegative(),
  ship_from: z.enum(["us", "cn", "other"]),
  handling_days_min: z.number().int().nonnegative(),
  handling_days_max: z.number().int().nonnegative(),
  publish: z.boolean().default(false),
  playpuff: z.object({
    audience: z.enum(["kids", "collectors"]),
    age_min_months: z.number().int().nonnegative(),
    age_max_months: z.number().int().nonnegative().nullable().optional(),
    age_source: z.string().trim().min(1),
    materials: z.string().min(1),
    dimensions: z.string().min(1),
    box_contents: z.string().min(1),
    warnings: z.string().min(1),
    instructions: z.string().min(1),
    delivery_estimate: z.string().min(1),
  }),
}).superRefine((row, context) => {
  if (row.playpuff.age_max_months != null && row.playpuff.age_max_months < row.playpuff.age_min_months) context.addIssue({ code: "custom", path: ["playpuff", "age_max_months"], message: "Maximum age must not be less than minimum age" })
  if (row.playpuff.audience === "collectors" && row.playpuff.age_min_months < 168) context.addIssue({ code: "custom", path: ["playpuff", "age_min_months"], message: "Collectors must be at least 14 years (168 months)" })
  if (row.handling_days_max < row.handling_days_min) context.addIssue({ code: "custom", path: ["handling_days_max"], message: "Invalid handling range" })
})

export const toyCatalog = z.array(toyCatalogRow).min(1).superRefine((rows, context) => {
  for (const key of ["sku", "handle"] as const) {
    const seen = new Set<string>()
    rows.forEach((row, i) => { if (seen.has(row[key])) context.addIssue({ code: "custom", path: [i, key], message: `Duplicate ${key}` }); seen.add(row[key]) })
  }
})

export type ToyCatalogRow = z.infer<typeof toyCatalogRow>
