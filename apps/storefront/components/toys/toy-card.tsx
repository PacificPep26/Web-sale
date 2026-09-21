import Link from "next/link"
import Image from "next/image"
import type { HttpTypes } from "@medusajs/types"
import { ageLabel, toyPrice } from "@dtc/shared-types/playpuff"
import { formatMoney } from "@/lib/money"
import { ToyAddButton } from "./toy-cart"

export function ToyCard({ product }: { product: HttpTypes.StoreProduct }) {
  const price = toyPrice(product)
  const age = ageLabel(product.metadata)
  const src = product.thumbnail ?? product.images?.[0]?.url
  return <article className="pp-product-card"><Link href={`/products/${product.handle}`} className="pp-product-image">{src ? <Image src={src} alt={product.title} fill sizes="(max-width: 1023px) 45vw, 280px" /> : <span>Image coming soon</span>}{age && <span className="pp-age-badge">{age}</span>}</Link><div className="pp-product-copy"><h3><Link href={`/products/${product.handle}`}>{product.title}</Link></h3><p>{price === undefined ? "Price unavailable" : formatMoney(price, product.variants?.[0]?.calculated_price?.currency_code ?? "usd")}</p>{product.variants?.length === 1 ? <ToyAddButton variant={product.variants[0]} /> : <Link className="pp-card-link" href={`/products/${product.handle}`}>Choose options <span aria-hidden="true">↗</span></Link>}</div></article>
}
