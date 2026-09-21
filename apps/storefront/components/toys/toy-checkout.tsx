"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { saveToyAddress, chooseToyShipping, prepareToyPayment, completeToyOrder } from "@/lib/data/toy-checkout"
import type { CheckoutAddress } from "@/lib/data/cart"
import { formatMoney } from "@/lib/money"
import { ToyPayment } from "./toy-payment"

const addressFields = [["first_name", "First name"], ["last_name", "Last name"], ["address_1", "Street address"], ["address_2", "Apartment / suite (optional)"], ["city", "City"], ["province", "State (e.g. CA)"], ["postal_code", "ZIP code"], ["phone", "Phone (optional)"]] as const

export function ToyCheckout({ cart: initialCart, shippingOptions: initialOptions, paymentsEnabled }: { cart: HttpTypes.StoreCart; shippingOptions: HttpTypes.StoreCartShippingOption[]; paymentsEnabled: boolean }) {
  const [cart, setCart] = useState(initialCart)
  const [options, setOptions] = useState(initialOptions)
  const [step, setStep] = useState(initialCart.shipping_methods?.length ? "payment" : initialCart.shipping_address ? "delivery" : "address")
  const [separate, setSeparate] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [pending, start] = useTransition()
  const lock = useRef(false)
  const summary = useRef<HTMLDetailsElement>(null)
  const router = useRouter()
  const paid = useCallback(async () => { const result = await completeToyOrder(); router.replace(`/order/${result.orderId}`) }, [router])
  useEffect(() => { if (summary.current) summary.current.open = matchMedia("(min-width: 768px)").matches }, [])
  useEffect(() => {
    const session = initialCart.payment_collection?.payment_sessions?.find(s => s.provider_id === "pp_stripe_stripe" && !["canceled", "error"].includes(s.status))
    if (session?.status === "authorized" || ["succeeded", "processing", "requires_capture"].includes(String(session?.data?.status))) setProcessing(true)
    else if (new URLSearchParams(location.search).has("payment_return") && typeof session?.data?.client_secret === "string") setSecret(session.data.client_secret)
  }, [initialCart])
  function run(action: () => Promise<void>) {
    if (lock.current) return
    lock.current = true
    start(async () => { setError(""); try { await action() } catch (e) { setError(e instanceof Error ? e.message : "Please try again") } finally { lock.current = false } })
  }
  const money = (amount: number) => formatMoney(amount, cart.currency_code)
  function address(prefix: string, existing?: HttpTypes.StoreCartAddress | null) {
    return addressFields.map(([key, label]) => <label key={prefix + key} className={key.startsWith("address") ? "pp-full" : ""}>{label}<input name={prefix + key} defaultValue={existing?.[key] ?? ""} required={!["address_2", "phone"].includes(key)} autoComplete={`${prefix ? "billing" : "shipping"} ${{ first_name: "given-name", last_name: "family-name", address_1: "address-line1", address_2: "address-line2", city: "address-level2", province: "address-level1", postal_code: "postal-code", phone: "tel" }[key]}`} pattern={key === "province" ? "[A-Za-z]{2}" : key === "postal_code" ? "[0-9]{5}(-[0-9]{4})?" : undefined} /></label>)
  }
  return <div className="pp-wrap pp-section"><p className="pp-eyebrow">ONE STEP CLOSER TO HAPPY</p><h1 style={{ marginBottom: 28 }}>Checkout</h1><div className="pp-checkout"><div className="pp-checkout-steps">
    <section className="pp-checkout-step"><h2>1. Contact & shipping {step !== "address" && !processing && <button disabled={pending} onClick={() => { setStep("address"); setSecret(null) }}>Edit</button>}</h2>{step === "address" ? <form action={fd => run(async () => {
      const parse = (prefix: string) => Object.fromEntries(addressFields.map(([key]) => [key, String(fd.get(prefix + key) ?? "").trim()])) as Omit<CheckoutAddress, "email" | "country_code">
      const shipping = { ...parse(""), country_code: "us", email: String(fd.get("email") ?? "").trim() }
      shipping.province = shipping.province.toUpperCase()
      const billing = separate ? { ...parse("billing_"), country_code: "us" } : undefined
      if (billing) billing.province = billing.province.toUpperCase()
      const result = await saveToyAddress(shipping, billing)
      setCart(result.cart); setOptions(result.shippingOptions); setSecret(null); setStep("delivery")
    })} className="pp-address-grid"><label className="pp-full">Email<input name="email" type="email" autoComplete="email" required defaultValue={cart.email ?? ""} /></label>{address("", cart.shipping_address)}<p className="pp-full">Country: United States</p><label className="pp-full"><span><input type="checkbox" checked={separate} onChange={e => setSeparate(e.target.checked)} /> Use a different billing address</span></label>{separate && address("billing_", cart.billing_address)}<button className="pp-button pp-full" disabled={pending}>{pending ? "Saving…" : "Continue to delivery"}</button></form> : <p>{cart.email}<br />{cart.shipping_address?.address_1}, {cart.shipping_address?.city}, {cart.shipping_address?.province} {cart.shipping_address?.postal_code}</p>}</section>
    {step !== "address" && <section className="pp-checkout-step"><h2>2. Delivery {step === "payment" && !processing && <button disabled={pending} onClick={() => { setStep("delivery"); setSecret(null) }}>Edit</button>}</h2>{step === "delivery" ? <>{options.map(o => <button key={o.id} className="pp-delivery-option" disabled={pending} onClick={() => run(async () => { setCart(await chooseToyShipping(o.id)); setSecret(null); setStep("payment") })}><span>{o.name}</span><strong>{o.amount == null ? "Calculated at checkout" : money(o.amount)}</strong></button>)}{!options.length && <p>No delivery options are available for this address. Please edit your address or try again later.</p>}</> : <p>{cart.shipping_methods?.map(s => s.name).join(", ")}</p>}</section>}
    {step === "payment" && <section className="pp-checkout-step"><h2>3. Payment</h2>{processing ? <><p>Your payment is being checked. Confirm your order without paying again.</p><button className="pp-button" disabled={pending} onClick={() => run(paid)}>Check order status</button></> : !paymentsEnabled ? <p>Payments are not available yet. Your bag is saved; please check back soon.</p> : secret ? <ToyPayment key={secret} clientSecret={secret} label={`Pay ${money(cart.total ?? 0)}`} onPaid={paid} /> : <button className="pp-button" disabled={pending} onClick={() => run(async () => { const result = await prepareToyPayment(); setCart(result.cart); setSecret(result.clientSecret); setProcessing(result.processing) })}>{pending ? "Preparing…" : "Continue to secure payment"}</button>}</section>}
    {error && <p className="pp-error" role="alert">{error}</p>}
  </div><details className="pp-checkout-summary" ref={summary} open><summary><span>Your order</span><strong>{money(cart.total ?? 0)}</strong></summary><ul className="pp-cart-items">{cart.items?.map(i => <li key={i.id}><div className="pp-cart-image">{i.thumbnail && <Image src={i.thumbnail} alt="" fill sizes="50px" />}</div><div>{i.product_title}<p>{i.variant_title} × {i.quantity}</p></div><strong>{money(i.total ?? 0)}</strong></li>)}</ul><dl><div><dt>Subtotal</dt><dd>{money(cart.item_subtotal ?? 0)}</dd></div>{!!cart.discount_total && <div><dt>Discount</dt><dd>−{money(cart.discount_total)}</dd></div>}<div><dt>Shipping</dt><dd>{cart.shipping_methods?.length ? money(cart.shipping_total ?? 0) : "Calculated at delivery"}</dd></div><div><dt>Tax</dt><dd>{cart.shipping_address ? money(cart.tax_total ?? 0) : "Calculated after address"}</dd></div><div><dt><strong>{cart.shipping_methods?.length ? "Total" : "Estimated total"}</strong></dt><dd><strong>{money(cart.total ?? 0)}</strong></dd></div></dl></details></div></div>
}
