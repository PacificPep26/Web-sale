import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle, listProducts } from "@/lib/data/products";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductGrid } from "@/components/product/ProductGrid";
import { NICHE } from "@/lib/config";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: {
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const related = await listProducts({ limit: 4 });

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.map((i) => i.url) ?? [],
    offers: {
      "@type": "Offer",
      priceCurrency:
        product.variants?.[0]?.calculated_price?.currency_code?.toUpperCase() ??
        "USD",
      price: product.variants?.[0]?.calculated_price?.calculated_amount ?? 0,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails product={product} niche={NICHE} />
      <section className="surface">
        <div className="container-page py-[var(--space-section)]">
          <div className="mb-10 text-center">
            <p className="eyebrow">More to see</p>
            <h2 className="mt-2" style={{ fontSize: "var(--fs-h2)" }}>
              You might also like
            </h2>
          </div>
          <ProductGrid
            products={related.products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)}
          />
        </div>
      </section>
    </>
  );
}
