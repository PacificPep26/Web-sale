import { unstable_cache } from "next/cache";
import { sdk } from "@/lib/medusa";
import { getRegion } from "./regions";
import type { HttpTypes } from "@medusajs/types";
import { withProductPhoto } from "@/lib/product-photos"

const PRODUCT_FIELDS =
  "id,title,handle,description,thumbnail,*images,*options,*options.values,*variants,*variants.options,*variants.calculated_price,variants.inventory_quantity,*categories";

export async function listProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string | string[];
  q?: string;
  order?: string;
}): Promise<{ products: HttpTypes.StoreProduct[]; count: number }> {
  const region = await getRegion();
  const { products, count } = await sdk.store.product.list({
    limit: params?.limit ?? 12,
    offset: params?.offset ?? 0,
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    ...(params?.category_id ? { category_id: params.category_id } : {}),
    ...(params?.q ? { q: params.q } : {}),
    ...(params?.order ? { order: params.order } : {}),
  });
  return { products: products.map(withProductPhoto), count };
}

export async function getProductByHandle(
  handle: string
): Promise<HttpTypes.StoreProduct | null> {
  const region = await getRegion();
  const { products } = await sdk.store.product.list({
    handle,
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: 1,
  });
  return products[0] ? withProductPhoto(products[0]) : null;
}

export const listCategories = unstable_cache(
  async (): Promise<HttpTypes.StoreProductCategory[]> => {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description",
      limit: 100,
    });
    return product_categories;
  },
  ["categories"],
  { revalidate: 3600, tags: ["categories"] }
);

export async function getCategoryByHandle(handle: string) {
  const cats = await listCategories();
  return cats.find((c) => c.handle === handle) ?? null;
}

/** cheapest calculated amount across a product's variants */
export function fromPrice(product: HttpTypes.StoreProduct) {
  const amounts = (product.variants ?? [])
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((n): n is number => typeof n === "number");
  if (!amounts.length) return undefined;
  return Math.min(...amounts);
}

export function currencyOf(product: HttpTypes.StoreProduct) {
  return (
    product.variants?.[0]?.calculated_price?.currency_code ?? "usd"
  );
}
