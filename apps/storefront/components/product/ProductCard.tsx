/* eslint-disable react-hooks/purity */
import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { fromPrice, currencyOf } from "@/lib/data/products";
import { Price } from "@/components/ui/Price";
import { WishlistButton } from "./WishlistButton";

const NEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 45;

export function ProductCard({
  product,
  priority = false,
}: {
  product: HttpTypes.StoreProduct;
  priority?: boolean;
}) {
  const imgPrimary = product.thumbnail ?? product.images?.[0]?.url;
  const imgSecondary =
    product.images && product.images.length > 1
      ? product.images[1].url
      : undefined;

  const price = fromPrice(product);
  const multiVariant = (product.variants?.length ?? 0) > 1;
  const isNew =
    product.created_at != null &&
    Date.now() - new Date(product.created_at).getTime() < NEW_WINDOW_MS;
  const subtitle =
    product.description?.split(/[.\n]/)[0]?.trim().slice(0, 60) ?? "";

  return (
    <Link href={`/products/${product.handle}`} className="group block text-center">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        {imgPrimary ? (
          <>
            <Image
              src={imgPrimary}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className={`object-contain p-6 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                imgSecondary ? "group-hover:opacity-0 group-hover:scale-[1.04]" : "group-hover:scale-[1.04]"
              }`}
            />
            {imgSecondary && (
              <Image
                src={imgSecondary}
                alt={`${product.title} campaign`}
                fill
                className={`absolute inset-0 opacity-0 transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 group-hover:scale-[1.04] ${
                  imgSecondary.includes("/tryon/") ? "object-contain p-2" : "object-contain p-6"
                }`}
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 skeleton" />
        )}

        {isNew && (
          <span className="badge-new absolute left-3 top-3">New</span>
        )}
        <WishlistButton
          id={product.id}
          className="text-muted absolute right-3 top-3 flex h-8 w-8 items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      <h3 className="mt-4 text-[0.82rem] font-medium uppercase leading-snug tracking-[0.08em]">
        {product.title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-[0.8rem] text-muted">{subtitle}</p>
      )}
      <p className="mt-2 text-[0.85rem]">
        <Price amount={price} currency={currencyOf(product)} from={multiVariant} />
      </p>
    </Link>
  );
}
