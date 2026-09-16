"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { addItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import { WishlistButton } from "./WishlistButton";
import type { NicheKey } from "@/themes/registry";
import sunglasses120Handles from "@/lib/sunglasses-120-handles.json";

// The 120-model luxury sunglasses catalogue has Gemini-composited "model
// wearing these glasses" photos for two reference models (see
// scripts/generate-victor-tryon.mjs) — these are additional product
// photography, not a personalized try-on, so they're just extra gallery
// images rather than a separate "Try It On" feature.
const WORN_VICTOR_HANDLES = new Set<string>(sunglasses120Handles as string[]);
const VICTOR_POSES = ["front", "left", "right"];

function wornGalleryImagesFor(handle: string): { id: string; url: string }[] {
  if (!WORN_VICTOR_HANDLES.has(handle)) return [];
  return ["worn-victor", "worn-victor-male"].flatMap((dir) =>
    VICTOR_POSES.map((pose) => ({
      id: `${dir}-${pose}`,
      url: `/tryon/${dir}/${handle}-${pose}.jpg`,
    }))
  );
}

export function ProductDetails({
  product,
}: {
  product: HttpTypes.StoreProduct;
  niche?: NicheKey;
}) {
  const images = useMemo(() => {
    const baseImages = product.images?.length
      ? product.images
      : product.thumbnail
        ? [{ url: product.thumbnail, id: "thumb" }]
        : [];
    return [...baseImages, ...wornGalleryImagesFor(product.handle)];
  }, [product.images, product.thumbnail, product.handle]);
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
    <div className="container-page grid gap-10 py-8 pb-28 md:grid-cols-12 md:gap-14 md:py-14 md:pb-14">
      {/* gallery */}
      <div className="md:col-span-7 md:sticky md:top-24 md:self-start">
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="hidden w-20 shrink-0 flex-col gap-3 sm:flex">
              {images.map((im, i) => (
                <button
                  key={im.id ?? i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Image ${i + 1}`}
                  className="relative aspect-square w-20 overflow-hidden border border-token transition-opacity"
                  style={i === activeImg ? { borderColor: "var(--color-fg)", opacity: 1 } : { opacity: 0.55 }}
                >
                  {im.url && (
                    <Image src={im.url} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="relative aspect-4/5 max-h-[60vh] flex-1 overflow-hidden bg-card md:max-h-none">
            {images[activeImg]?.url && (
              <Image
                src={images[activeImg].url}
                alt={product.title}
                fill
                priority
                sizes="(max-width:768px) 100vw, 55vw"
                className="object-cover"
              />
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto sm:hidden">
            {images.map((im, i) => (
              <button
                key={im.id ?? i}
                onClick={() => setActiveImg(i)}
                aria-label={`Image ${i + 1}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden border border-token"
                style={i === activeImg ? { borderColor: "var(--color-fg)", opacity: 1 } : { opacity: 0.55 }}
              >
                {im.url && <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* buy box */}
      <div className="md:col-span-5 md:pt-1">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl leading-tight md:text-[2.6rem]">{product.title}</h1>
          <WishlistButton
            id={product.id}
            className="text-muted mt-1 flex h-9 w-9 shrink-0 items-center justify-center"
          />
        </div>
        <p className="mt-4 text-2xl md:text-[1.7rem]" style={{ fontFamily: "var(--font-display)" }}>
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

        <div className="mt-6 grid grid-cols-3 gap-2 border-y border-token py-4 text-center">
          {[
            { label: "Authentic", icon: <path d="M12 3l7 3v5c0 4.6-2.98 8.5-7 10-4.02-1.5-7-5.4-7-10V6l7-3z" /> },
            { label: "Fast shipping", icon: <><path d="M3 12h13M12 5l7 7-7 7" /></> },
            { label: "30-day returns", icon: <path d="M4 12a8 8 0 1 1 2.6 5.9M4 12V7M4 12h5" /> },
          ].map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 text-[0.66rem] uppercase tracking-[0.08em] text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
                {b.icon}
              </svg>
              {b.label}
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-token">
          {product.description && (
            <details className="border-b border-token py-4" open>
              <summary className="cursor-pointer list-none text-sm font-medium uppercase tracking-[0.08em]">
                Details &amp; Description
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
