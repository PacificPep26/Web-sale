import { notFound } from "next/navigation";
import { getCategoryByHandle, listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";

export const revalidate = 300;

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { handle } = await params;
  const { page } = await searchParams;
  const category = await getCategoryByHandle(handle);
  if (!category) notFound();

  const limit = 12;
  const current = Math.max(1, Number(page ?? "1"));
  const { products, count } = await listProducts({
    category_id: category.id,
    limit,
    offset: (current - 1) * limit,
  });
  const pages = Math.ceil(count / limit);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl md:text-3xl">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-muted">{category.description}</p>
      )}
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/collections/${handle}?page=${p}`}
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
