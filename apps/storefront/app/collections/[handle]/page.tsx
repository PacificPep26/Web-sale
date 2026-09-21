import { ToyCollection } from "@/components/toys/toy-collection"
import { NICHE } from "@/lib/config"
import type { ToyFilters } from "@dtc/shared-types/playpuff"
import { notFound } from "next/navigation";
import { getCategoryByHandle, listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 300;

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<ToyFilters & { brand?: string }>;
}) {
  const { handle } = await params;
  const filters = await searchParams
  if (NICHE === "toys" && handle === "toys") return <ToyCollection filters={filters} />
  const { page, brand } = filters
  const category = await getCategoryByHandle(handle);
  if (!category) notFound();

  const limit = 12;
  const current = Math.max(1, Number(page ?? "1"));
  // brand tiles link here with ?brand=<slug> (e.g. "tom-ford") — products
  // don't have a dedicated brand field, but every handle is "sun-<brand>-<model>"
  // and titles start with the brand name, so a full-text q search on the
  // brand name (spaces, not dashes) reliably narrows to just that maison.
  const brandQuery = brand ? brand.replace(/-/g, " ") : undefined;
  const { products, count } = await listProducts({
    category_id: category.id,
    q: brandQuery,
    limit,
    offset: (current - 1) * limit,
  });
  const pages = Math.ceil(count / limit);

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mb-10 text-center">
        <p className="eyebrow">Collection</p>
        <h1 className="mt-2" style={{ fontSize: "var(--fs-h2)" }}>
          {brandQuery ? `${category.name} — ${brandQuery}` : category.name}
        </h1>
        {category.description && (
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
            {category.description}
          </p>
        )}
        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>
      </div>
      <ProductGrid products={products} priorityCount={4} />
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/collections/${handle}?page=${p}${brand ? `&brand=${brand}` : ""}`}
              className="btn btn-outline"
              style={
                p === current
                  ? { background: "var(--color-accent)", color: "var(--color-accent-fg)" }
                  : undefined
              }
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
