"use client"

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import type { HttpTypes } from "@medusajs/types"
import { addItem, getCart, updateItem, removeItem } from "@/lib/data/cart"
import { formatMoney } from "@/lib/money"
import { variantAvailable, ageLabel } from "@dtc/shared-types/playpuff"

const CartContext = createContext<{ add: (id: string) => Promise<void>; busy: boolean }>({ add: async () => {}, busy: false })

export function ToyCartProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [error, setError] = useState("")
  async function add(id: string) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try { await addItem(id); setCart(await getCart()); setError(""); dialog.current?.showModal() }
    finally { lock.current = false; setBusy(false) }
  }
  async function change(id: string, quantity: number) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    try { await updateItem(id, quantity); setCart(await getCart()); setError("") }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update your bag") }
    finally { lock.current = false; setBusy(false) }
  }
  return <CartContext.Provider value={{ add, busy }}>{children}<dialog ref={dialog} className="pp-cart-drawer" aria-label="Your bag"><div className="pp-menu-top"><h2>Your happy little bag</h2><button aria-label="Close bag" onClick={() => dialog.current?.close()}>×</button></div>{cart?.items?.length ? <><ToyCartItems cart={cart} busy={busy} onChange={change} /><div className="pp-cart-total"><span>Subtotal</span><strong>{formatMoney(cart.item_subtotal ?? 0, cart.currency_code)}</strong></div><p>Shipping and tax calculated at checkout.</p><Link className="pp-button" href="/checkout" onClick={() => dialog.current?.close()}>Continue to checkout</Link><Link className="pp-text-link" href="/cart" onClick={() => dialog.current?.close()}>View your bag</Link></> : <p>Your bag is waiting for a little joy.</p>}{error && <p role="alert">{error}</p>}</dialog></CartContext.Provider>
}

export function ToyAddButton({ variant }: { variant?: HttpTypes.StoreProductVariant }) {
  const { add, busy } = useContext(CartContext)
  const [error, setError] = useState("")
  const available = variant && variantAvailable(variant) && variant.calculated_price?.calculated_amount != null
  return <><button className="pp-button" disabled={busy || !available} onClick={async () => { try { setError(""); await add(variant!.id) } catch (e) { setError(e instanceof Error ? e.message : "Please try again") } }}>{busy ? "Adding…" : available ? "Add to bag +" : "Unavailable"}</button>{error && <p className="pp-error" role="alert">{error}</p>}</>
}

function ToyCartItems({ cart, busy, onChange }: { cart: HttpTypes.StoreCart; busy: boolean; onChange: (id: string, quantity: number) => void }) {
  return <ul className="pp-cart-items">{cart.items?.map(item => <li key={item.id}><div className="pp-cart-image">{item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="88px" />}</div><div><Link href={`/products/${item.product_handle}`}>{item.product_title}</Link><p>{item.variant_title}</p><small>{ageLabel(item.variant?.product?.metadata)}</small><div className="pp-quantity"><button aria-label={`Decrease ${item.product_title}`} disabled={busy} onClick={() => onChange(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={`Increase ${item.product_title}`} disabled={busy} onClick={() => onChange(item.id, item.quantity + 1)}>+</button><button disabled={busy} onClick={() => onChange(item.id, 0)}>Remove</button></div></div><strong>{formatMoney(item.total ?? 0, cart.currency_code)}</strong></li>)}</ul>
}

export function ToyCartPage({ cart }: { cart: HttpTypes.StoreCart | null }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState("")
  const lock = useRef(false)
  if (!cart?.items?.length) return <div className="pp-wrap pp-empty pp-section"><h1>A little room for joy.</h1><p>Your bag is empty. Let’s find something you’ll love.</p><Link href="/collections/toys" className="pp-button">Explore all toys</Link></div>
  return <div className="pp-wrap pp-section"><p className="pp-eyebrow">GOOD FINDS, ALL TOGETHER</p><h1>Your bag</h1><div className="pp-cart-layout"><ToyCartItems cart={cart} busy={pending} onChange={(id, quantity) => {
    if (lock.current) return
    lock.current = true
    start(async () => { try { setError(""); if (quantity <= 0) await removeItem(id); else await updateItem(id, quantity) } catch (e) { setError((e as Error).message) } finally { lock.current = false } })
  }} /><aside className="pp-summary"><h2>Your order</h2><div className="pp-cart-total"><span>Subtotal</span><strong>{formatMoney(cart.item_subtotal ?? 0, cart.currency_code)}</strong></div><p>Shipping and tax calculated at checkout.</p><Link className="pp-button" href="/checkout">Continue to checkout</Link><Link href="/collections/toys" className="pp-text-link">Keep exploring</Link></aside></div>{error && <p role="alert" className="pp-error">{error}</p>}</div>
}
