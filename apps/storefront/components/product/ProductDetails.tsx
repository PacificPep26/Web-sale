"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { addItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import { fromPrice, currencyOf } from "@/lib/data/products";
import { WishlistButton } from "./WishlistButton";
import { TryOnModal, type TryOnItem } from "./TryOnModal";
import type { NicheKey } from "@/themes/registry";
import poses from "@/lib/tryon-poses.json";

// Product handles that have a full set of Gemini-composited "model wearing
// these glasses" photos, one per face-visible pose in lib/tryon-poses.json
// (see scripts/generate-worn-composites.mjs) — one unified pose set built
// the same way for every product, not run for the whole catalogue yet.
// Try-on only ever shows products in this set — no lower-quality fallback.
const WORN_COMPOSITE_HANDLES = new Set<string>([
  "blue-light-filter-glasses",
  "heritage-square-sunglasses",
]);

function wornImagesFor(handle: string): Record<string, string> {
  return Object.fromEntries(
    poses.map((p) => [p.id, `/tryon/worn/${handle}-${p.id}.jpg`])
  );
}

export function ProductDetails({
  product,
  niche,
  tryOnProducts,
}: {
  product: HttpTypes.StoreProduct;
  niche?: NicheKey;
  tryOnProducts?: HttpTypes.StoreProduct[];
}) {
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
  const [tryOnOpen, setTryOnOpen] = useState(false);

  const tryOnItems: TryOnItem[] = useMemo(
    () =>
      (tryOnProducts ?? []).flatMap((p) => {
        const img = p.thumbnail ?? p.images?.[0]?.url;
        if (!img || !p.handle || !WORN_COMPOSITE_HANDLES.has(p.handle)) return [];
        return [
          {
            id: p.id,
            handle: p.handle,
            variantId: p.variants?.[0]?.id,
            title: p.title,
            price: fromPrice(p),
            currency: currencyOf(p),
            image: img,
            wornImages: wornImagesFor(p.handle),
          },
        ];
      }),
    [tryOnProducts]
  );

  const canTryOn = WORN_COMPOSITE_HANDLES.has(product.handle) && tryOnItems.length > 0;

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
        <div className="relative aspect-square max-h-[38vh] overflow-hidden bg-card md:aspect-4/5 md:max-h-none">
          {images[activeImg]?.url && (
            <Image
              src={images[activeImg].url}
              alt={product.title}
              fill
              priority
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-contain p-4 md:p-8"
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
        {/* Luxury Trust Badges */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-y border-token py-3 text-center text-[0.72rem] tracking-[0.06em] text-muted uppercase">
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🛡️</span>
            <span>100% Authentic</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-token">
            <span className="text-base">✈️</span>
            <span>Express Shipping</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🔄</span>
            <span>30-Day Returns</span>
          </div>
        </div>

        {niche === "eyewear" && canTryOn && (
          <button
            className="btn btn-outline mt-3 w-full"
            onClick={() => setTryOnOpen(true)}
          >
            Virtual try-on
          </button>
        )}

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

          {/* Craftsmanship & Specs Accordion */}
          <details className="border-b border-token py-4" open>
            <summary className="cursor-pointer list-none text-sm font-medium uppercase tracking-[0.08em]">
              Craftsmanship &amp; Specifications
            </summary>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li className="flex items-center gap-2">
                <span className="font-semibold text-token">Lens Protection:</span> 100% UV400 Protection (UVA/UVB filter)
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-token">Frame Material:</span> Premium Hand-Finished Italian/Japanese Acetate &amp; Light Alloys
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-token">Hinge &amp; Hardware:</span> Reinforced Custom Luxury Hinges
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold text-token">In the Box:</span> Hard Protective Case, Microfiber Pouch &amp; Cleaning Cloth
              </li>
            </ul>
          </details>

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

      {tryOnOpen && canTryOn && (
        <TryOnModal
          items={tryOnItems}
          initialId={product.id}
          onClose={() => setTryOnOpen(false)}
        />
      )}
    </div>
  );
}
