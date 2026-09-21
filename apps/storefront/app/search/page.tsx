import { NICHE } from "@/lib/config"
import { ToyCollection } from "@/components/toys/toy-collection"
import Link from "next/link";
import { listProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/product/ProductGrid";
import { SearchField } from "@/components/layout/SearchField";
import { ImageSearch } from "@/components/search/image-search"
import { WhatsappHelp } from "@/components/search/whatsapp-help"

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  if (NICHE === "toys") return <ToyCollection filters={{ q: query }} />
  const { products, count } = query
    ? await listProducts({ q: query, limit: 24 })
    : { products: [], count: 0 };

  return (
    <div className="container-page py-12 md:py-16">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Search</p>
        <SearchField initial={query} autoFocus className="mt-4" />
        <ImageSearch />
      </div>

      <div className="mt-12">
        {!query ? (
          <p className="text-muted py-16 text-center text-sm uppercase tracking-[0.14em]">
            Type to search the collection
          </p>
        ) : count === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted text-sm">
              No results for “{query}”.
            </p>
            <Link href="/" className="link-underline mt-4 inline-block">
              Back to home
            </Link>
            <WhatsappHelp query={query} />
          </div>
        ) : (
          <>
            <p className="mb-8 text-center text-xs uppercase tracking-[0.14em] text-muted">
              {count} {count === 1 ? "result" : "results"} for “{query}”
            </p>
            <ProductGrid products={products} />
          </>
        )}
      </div>
    </div>
  );
}
