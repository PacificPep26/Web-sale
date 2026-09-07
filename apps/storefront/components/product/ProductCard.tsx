import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { fromPrice, currencyOf } from "@/lib/data/products";
import { Price } from "@/components/ui/Price";

export function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const img = product.thumbnail ?? product.images?.[0]?.url;
  const price = fromPrice(product);
  const multiVariant = (product.variants?.length ?? 0) > 1;
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block rounded-token overflow-hidden border border-token surface transition-shadow hover:shadow-card"
    >
      <div className="relative aspect-square bg-base">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 skeleton" />
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium leading-snug line-clamp-2">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-muted">
          <Price amount={price} currency={currencyOf(product)} from={multiVariant} />
        </p>
      </div>
    </Link>
  );
}
