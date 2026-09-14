"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { addItem } from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import poses from "@/lib/tryon-poses.json";

export type TryOnItem = {
  id: string;
  handle?: string;
  variantId?: string;
  title: string;
  price?: number;
  currency?: string;
  /** picker thumbnail (original product photo) */
  image: string;
  /**
   * AI-composited "model actually wearing these glasses" photos (Gemini),
   * one per pose in lib/tryon-poses.json (keyed by pose id) — see
   * scripts/generate-worn-composites.mjs. Every product passed to
   * TryOnModal must have a complete set (one entry per pose), so the modal
   * never has to guess or approximate.
   */
  wornImages: Record<string, string>;
};

type Pose = (typeof poses)[number];

const POSES = poses as Pose[];
const FRONT_INDEX = POSES.findIndex((p) => p.id === "front");
const LAST_INDEX = POSES.length - 1;
// Minimum swipe distance (px) to count as an intentional "turn one step"
// gesture. The index only changes once, on release — not continuously
// while dragging — so a touch swipe can't send it spinning past several
// poses from one accidental finger movement; the user always ends up
// exactly one step from where they started, in the direction they swiped.
const SWIPE_THRESHOLD = 24;

export function TryOnModal({
  items,
  initialId,
  onClose,
}: {
  items: TryOnItem[];
  initialId?: string;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(
    initialId && items.some((i) => i.id === initialId) ? initialId : items[0]?.id
  );
  const [index, setIndex] = useState(FRONT_INDEX);
  const dragRef = useRef<{ startX: number } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? items[0],
    [items, selectedId]
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // preload every pose photo for the selected product up front, so dragging
  // fast through the turntable never hits a mid-load stutter/tear
  useEffect(() => {
    if (!selected) return;
    const imgs = Object.values(selected.wornImages).map((src) => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    return () => {
      imgs.forEach((img) => {
        img.src = "";
      });
    };
  }, [selected]);

  function clampIndex(next: number) {
    return Math.min(LAST_INDEX, Math.max(0, next));
  }

  // Drag handling is wired with plain DOM addEventListener (not React's
  // onPointerDown/onPointerMove JSX props). Going through React's synthetic
  // event system here made the browser stop delivering pointermove/pointerup
  // after the very first move of a gesture as soon as it triggered a state
  // update — confirmed by swapping in a plain non-React page with the
  // identical window-listener drag logic, where the same scripted drag
  // delivered every event correctly. Native listeners on the element
  // sidestep it.
  //
  // The pose only changes ONCE per gesture, on release, by exactly one
  // step in the swipe direction — never continuously while the finger/mouse
  // is still moving. On a touch screen a live per-pixel mapping reads as
  // "spinning on its own": normal finger jitter and the coarser touch
  // sampling rate turn into several unintended pose changes before the user
  // can react. One-step-per-swipe (like a carousel) is fully predictable —
  // wherever they release, they're exactly one pose over, in the direction
  // they dragged.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    function onDown(e: PointerEvent) {
      dragRef.current = { startX: e.clientX };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    }
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) >= SWIPE_THRESHOLD) {
        setIndex((i) => clampIndex(i + (dx > 0 ? 1 : -1)));
        teardown();
      }
    }
    function onUp() {
      teardown();
    }
    function onCancel() {
      teardown();
    }
    function teardown() {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    }

    stage.addEventListener("pointerdown", onDown);
    return () => {
      stage.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setIndex((i) => clampIndex(i - 1));
    if (e.key === "ArrowRight") setIndex((i) => clampIndex(i + 1));
    if (e.key === "Home") setIndex(FRONT_INDEX);
  }

  function handleAdd() {
    if (!selected?.variantId) return;
    startTransition(async () => {
      await addItem(selected.variantId!, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    });
  }

  if (!selected) return null;

  const pose = POSES[index];
  const wornSrc = selected.wornImages[pose.id];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Virtual try-on">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-base p-5 md:inset-0 md:m-auto md:h-fit md:max-h-[88vh] md:w-full md:max-w-3xl md:rounded-2xl md:p-8">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Virtual Try-On</p>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* turntable stage */}
        <div className="mt-4">
          <div className="relative mx-auto w-full max-w-70">
            <div
              ref={stageRef}
              role="slider"
              tabIndex={0}
              aria-label="Rotate model. Use left/right arrow keys, or swipe."
              aria-valuemin={0}
              aria-valuemax={LAST_INDEX}
              aria-valuenow={index}
              aria-valuetext={`${pose.name} · ${pose.angleDeg}°`}
              onKeyDown={onKeyDown}
              className="relative aspect-4/5 w-full touch-none select-none overflow-hidden rounded-xl bg-card outline-none focus-visible:ring-2"
            >
              {/* key stays fixed across pose changes (only the src swaps) so
                  the browser can paint the new frame over the same <img>
                  element instead of unmounting/remounting on every drag step */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={selected.id}
                src={wornSrc}
                alt={selected.title}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
            </div>

            {/* explicit tap targets — the most reliable way to turn on a
                touch screen; swipe on the photo also works as a shortcut */}
            <button
              type="button"
              aria-label="Rotate left"
              disabled={index === 0}
              onClick={() => setIndex((i) => clampIndex(i - 1))}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-base/80 text-fg shadow-sm backdrop-blur disabled:opacity-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Rotate right"
              disabled={index === LAST_INDEX}
              onClick={() => setIndex((i) => clampIndex(i + 1))}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-base/80 text-fg shadow-sm backdrop-blur disabled:opacity-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted">
            {pose.name} · {pose.angleDeg}° — tap the arrows or swipe to rotate
          </p>
        </div>

        {/* picker */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              aria-pressed={item.id === selected.id}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-card"
              style={
                item.id === selected.id
                  ? { outline: "2px solid var(--color-fg)", outlineOffset: "2px" }
                  : { opacity: 0.6 }
              }
            >
              <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>

        {/* selected info */}
        <div className="mt-5 flex flex-col gap-3 border-t border-token pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium">{selected.title}</p>
            {selected.price != null && (
              <p className="text-sm text-muted">
                {formatMoney(selected.price, selected.currency ?? "usd")}
              </p>
            )}
          </div>
          <div className="flex gap-2 sm:shrink-0">
            {selected.handle && (
              <a href={`/products/${selected.handle}`} className="btn btn-outline flex-1 sm:flex-none">
                View product
              </a>
            )}
            {selected.variantId && (
              <button className="btn btn-accent flex-1 sm:flex-none" onClick={handleAdd} disabled={pending}>
                {pending ? "Adding…" : added ? "Added ✓" : "Add to bag"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
