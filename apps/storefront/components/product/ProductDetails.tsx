"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { addItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";

type Props = { product: HttpTypes.StoreProduct };

export function ProductDetails({ product }: Props) {
  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ url: product.thumbnail, id: "thumb" }]
      : [];
  const [activeImg, setActiveImg] = useState(0);

  const options = product.options ?? [];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      options.map((o) => [o.title!, o.values?.[0]?.value ?? ""])
    )
  );

  const variant = useMemo(() => {
    return (product.variants ?? []).find((v) =>
      (v.options ?? []).every(
        (vo) => selected[vo.option?.title ?? ""] === vo.value
      )
    );
  }, [product.variants, selected]);

  const price = variant?.calculated_price?.calculated_amount;
  const currency = variant?.calculated_price?.currency_code ?? "usd";
  const inStock =
    !variant?.manage_inventory ||
    variant?.allow_backorder ||
    (variant?.inventory_quantity ?? 0) > 0;

  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!variant) return;
    startTransition(async () => {
      await addItem(variant.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    });
  }

  return (
    <div className="container-page grid gap-8 py-8 md:grid-cols-2 md:py-12">
      {/* gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-token border border-token surface">
          {images[activeImg]?.url && (
            <Image
              src={images[activeImg].url}
              alt={product.title}
              fill
              priority
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((im, i) => (
              <button
                key={im.id ?? i}
                onClick={() => setActiveImg(i)}
                aria-label={`Image ${i + 1}`}
                className={`relative h-16 w-16 overflow-hidden rounded-token-sm border ${
                  i === activeImg ? "border-token text-accent" : "border-token opacity-60"
                }`}
                style={i === activeImg ? { outline: "2px solid var(--color-accent)" } : undefined}
              >
                {im.url && (
                  <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* buy box */}
      <div>
        <h1 className="text-2xl md:text-3xl">{product.title}</h1>
        <p className="mt-2 text-xl">
          {price != null ? formatMoney(price, currency) : "—"}
        </p>

        {options.map((opt) => (
          <fieldset key={opt.id} className="mt-5">
            <legend className="text-sm font-medium">{opt.title}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {opt.values?.map((val) => {
                const active = selected[opt.title!] === val.value;
                return (
                  <button
                    key={val.id}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [opt.title!]: val.value! }))
                    }
                    className="btn btn-outline"
                    style={
                      active
                        ? {
                            background: "var(--color-accent)",
                            color: "var(--color-accent-fg)",
                            borderColor: "var(--color-accent)",
                          }
                        : undefined
                    }
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="mt-6">
          <button
            className="btn btn-accent w-full"
            disabled={!variant || !inStock || pending}
            onClick={handleAdd}
          >
            {!variant
              ? "Unavailable"
              : !inStock
                ? "Out of stock"
                : pending
                  ? "Adding…"
                  : added
                    ? "Added ✓"
                    : "Add to cart"}
          </button>
          <p className="mt-3 text-sm text-muted">
            Ships from our US warehouse · most orders arrive in 2–7 business days.
            30-day returns.
          </p>
        </div>

        {product.description && (
          <div className="mt-8 border-t border-token pt-6">
            <h2 className="text-base font-semibold">Details</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
