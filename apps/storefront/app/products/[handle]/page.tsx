import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/data/products";
import { ProductDetails } from "@/components/product/ProductDetails";
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
    </>
  );
}
