"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import type { HttpTypes } from "@medusajs/types";
import { updateItem, removeItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import { productPhoto, productPhotoStyle, resolveProductPhoto } from "@/lib/product-photos"

export function CartLineItem({
  item,
  currency,
}: {
  item: HttpTypes.StoreCartLineItem;
  currency: string;
}) {
  const [pending, start] = useTransition();
  const handle = item.variant?.product?.handle;
  const thumb = productPhoto(handle) ?? resolveProductPhoto(item.thumbnail ?? item.variant?.product?.thumbnail)

  return (
    <div className="flex gap-4 py-4" aria-busy={pending}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-token-sm surface">
        {thumb && (
          <Image src={thumb} style={productPhotoStyle(thumb)} alt={item.product_title ?? ""} fill sizes="80px" className="object-contain" />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between gap-3">
          <div>
            <p className="text-sm font-medium">
              {handle ? (
                <Link href={`/products/${handle}`}>{item.product_title}</Link>
              ) : (
                item.product_title
              )}
            </p>
            <p className="text-xs text-muted">{item.variant_title}</p>
          </div>
          <p className="text-sm">{formatMoney(item.total ?? 0, currency)}</p>
        </div>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <div className="flex items-center rounded-token-sm border border-token">
            <button
              className="px-2 py-1 text-sm"
              disabled={pending}
              onClick={() => start(() => updateItem(item.id, (item.quantity ?? 1) - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              className="px-2 py-1 text-sm"
              disabled={pending}
              onClick={() => start(() => updateItem(item.id, (item.quantity ?? 1) + 1))}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            className="text-xs text-muted underline"
            disabled={pending}
            onClick={() => start(() => removeItem(item.id))}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
