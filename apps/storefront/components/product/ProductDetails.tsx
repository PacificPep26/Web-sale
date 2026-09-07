"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { addItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import { WishlistButton } from "./WishlistButton";

export function ProductDetails({ product }: { product: HttpTypes.StoreProduct }) {
  const images = product.images?.length
    ? product.images
    : product.thumbnail
      ? [{ url: product.thumbnail, id: "thumb" }]
      : [];
  const [activeImg, setActiveImg] = useState(0);

  const options = product.options ?? [];
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.title!, o.values?.[0]?.value ?? ""]))
  );

  const variant = useMemo(
    () =>
      (product.variants ?? []).find((v) =>
        (v.options ?? []).every(
          (vo) => selected[vo.option?.title ?? ""] === vo.value
        )
      ),
    [product.variants, selected]
  );

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

  const cta = !variant
    ? "Unavailable"
    : !inStock
      ? "Out of stock"
      : pending
        ? "Adding…"
        : added
          ? "Added ✓"
          : "Add to bag";

  return (
    <div className="container-page grid gap-10 py-8 pb-28 md:grid-cols-2 md:gap-16 md:py-14 md:pb-14">
      {/* gallery */}
      <div>
        <div className="relative aspect-[4/5] overflow-hidden bg-card">
          {images[activeImg]?.url && (
            <Image
              src={images[activeImg].url}
              alt={product.title}
              fill
              priority
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-contain p-8"
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {images.map((im, i) => (
              <button
                key={im.id ?? i}
                onClick={() => setActiveImg(i)}
                aria-label={`Image ${i + 1}`}
                className="relative h-20 w-20 overflow-hidden bg-card"
                style={
                  i === activeImg
                    ? { outline: "1px solid var(--color-fg)", outlineOffset: "2px" }
                    : { opacity: 0.55 }
                }
              >
                {im.url && (
                  <Image src={im.url} alt="" fill sizes="80px" className="object-contain p-2" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* buy box */}
      <div className="md:pt-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-4xl">{product.title}</h1>
          <WishlistButton
            id={product.id}
            className="text-muted mt-1 flex h-9 w-9 shrink-0 items-center justify-center"
          />
        </div>
        <p className="mt-3 text-lg" style={{ fontFamily: "var(--font-display)" }}>
          {price != null ? formatMoney(price, currency) : "—"}
        </p>

        {options.map((opt) => (
          <fieldset key={opt.id} className="mt-8">
            <legend className="eyebrow">{opt.title}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {opt.values?.map((val) => {
                const active = selected[opt.title!] === val.value;
                return (
                  <button
                    key={val.id}
                    onClick={() =>
                      setSelected((s) => ({ ...s, [opt.title!]: val.value! }))
                    }
                    className="border px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.12em] transition-colors"
                    style={{
                      borderColor: active ? "var(--color-fg)" : "var(--color-border)",
                      background: active ? "var(--color-fg)" : "transparent",
                      color: active ? "var(--color-bg)" : "var(--color-fg)",
                    }}
                  >
                    {val.value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <button
          className="btn btn-accent mt-10 w-full"
          disabled={!variant || !inStock || pending}
          onClick={handleAdd}
        >
          {cta}
        </button>
        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-muted">
          Ships from the US · 2–7 business days · 30-day returns
        </p>

        <div className="mt-10 border-t border-token">
          {product.description && (
            <details className="border-b border-token py-4" open>
              <summary className="cursor-pointer list-none text-sm font-medium uppercase tracking-[0.08em]">
                Details
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </details>
          )}
          <details className="border-b border-token py-4">
            <summary className="cursor-pointer list-none text-sm font-medium uppercase tracking-[0.08em]">
              Shipping &amp; returns
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Free US shipping over $35, otherwise a flat $6.90. Most orders arrive
              in 2–7 business days. Return unused items within 30 days for a refund.
            </p>
          </details>
        </div>
      </div>

      {/* sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-token bg-base/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <span className="text-base" style={{ fontFamily: "var(--font-display)" }}>
            {price != null ? formatMoney(price, currency) : "—"}
          </span>
          <button
            className="btn btn-accent flex-1"
            disabled={!variant || !inStock || pending}
            onClick={handleAdd}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}
