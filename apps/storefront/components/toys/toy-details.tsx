"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { ageLabel, toyMetadata, variantAvailable } from "@dtc/shared-types/playpuff"
import { formatMoney } from "@/lib/money"
import { ToyAddButton } from "./toy-cart"

export function ToyDetails({ product }: { product: HttpTypes.StoreProduct }) {
  const [image, setImage] = useState(0)
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id)
  const [sticky, setSticky] = useState(false)
  const button = useRef<HTMLDivElement>(null)
  const variant = product.variants?.find(v => v.id === variantId)
  const toy = toyMetadata(product.metadata)
  const photos = product.images?.length ? product.images : product.thumbnail ? [{ url: product.thumbnail }] : []
  const amount = variant?.calculated_price?.calculated_amount
  const price = amount == null ? "Price unavailable" : formatMoney(amount, variant?.calculated_price?.currency_code ?? "usd")
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0))
    if (button.current) observer.observe(button.current)
    return () => observer.disconnect()
  }, [])
  return <div className="pp-wrap pp-section"><Link href="/collections/toys" className="pp-text-link">← Back to all toys</Link><div className="pp-detail"><div><div className="pp-detail-image">{photos[image] && <Image src={photos[image].url} alt={product.title} fill priority sizes="(max-width: 767px) 100vw, 700px" />}</div><div className="pp-thumbnails">{photos.map((p, i) => <button key={p.url} onClick={() => setImage(i)} aria-label={`View image ${i + 1}`} aria-pressed={i === image}><Image src={p.url} alt="" width={80} height={80} /></button>)}</div></div><div className="pp-detail-copy"><p className="pp-eyebrow">{toy?.audience === "collectors" ? "COLLECTOR’S CORNER · 14+" : "A LITTLE DISCOVERY"}</p><h1>{product.title}</h1>{ageLabel(product.metadata) && <span className="pp-age-badge">Ages {ageLabel(product.metadata)}</span>}<p className="pp-detail-price">{price}</p><p>{product.description}</p>{(product.variants?.length ?? 0) > 1 && <label>Choose your option<select value={variantId} onChange={e => setVariantId(e.target.value)}>{product.variants?.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></label>}<p className="pp-stock">{variant && variantAvailable(variant) ? variant.allow_backorder && !(variant.inventory_quantity! > 0) ? "Available to order" : "In stock" : "Currently unavailable"}</p><div ref={button}><ToyAddButton variant={variant} /></div><p className="pp-age-note">{toy?.delivery_estimate ?? "Available delivery options, shipping and taxes are shown at checkout."}</p>{toy?.audience === "collectors" && <p className="pp-warning">For collectors aged 14 and over. Not intended for younger children.</p>}{[["Materials", toy?.materials], ["Dimensions", toy?.dimensions], ["Inside the box", toy?.box_contents], ["Care & instructions", toy?.instructions], ["Age & safety", toy?.warnings]].filter(([, v]) => v).map(([title, value]) => <details className="pp-product-info" key={title}><summary>{title}</summary><p>{value}</p></details>)}<p><Link href="/pages/shipping">Shipping</Link> · <Link href="/pages/returns">Returns</Link></p></div></div>{sticky && <div className="pp-mobile-buy"><strong>{price}</strong><ToyAddButton variant={variant} /></div>}</div>
}
