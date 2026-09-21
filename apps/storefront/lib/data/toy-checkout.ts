"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { sdk } from "@/lib/medusa"
import { NICHE, STRIPE_PK, CART_COOKIE } from "@/lib/config"
import { buildSafeStripePayload } from "@/lib/stripe-shield"
import { getCart, listShippingOptions, setShippingMethod, type CheckoutAddress } from "./cart"

function requireToys() { if (NICHE !== "toys") throw new Error("Invalid storefront") }

export async function saveToyAddress(shipping: CheckoutAddress, billing?: Omit<CheckoutAddress, "email">) {
  requireToys()
  const cart = await getCart()
  if (!cart) throw new Error("Your bag is empty")
  if (cart.payment_collection?.payment_sessions?.some(s => s.status === "authorized" || ["succeeded", "processing", "requires_capture"].includes(String(s.data?.status)))) throw new Error("Payment is being processed. Please check your order before making changes.")
  for (const address of [shipping, billing].filter(Boolean)) {
    if (address!.country_code !== "us" || !address!.first_name?.trim() || !address!.last_name?.trim() || !address!.address_1?.trim() || !address!.city?.trim() || !/^[A-Z]{2}$/.test(address!.province) || !/^\d{5}(-\d{4})?$/.test(address!.postal_code)) throw new Error("Please enter a complete US address with a two-letter state and valid ZIP code")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) throw new Error("Please enter a valid email")
  const { email, ...address } = shipping
  await sdk.store.cart.update(cart.id, { email, shipping_address: address, billing_address: billing ?? address })
  revalidatePath("/checkout")
  return { cart: (await getCart())!, shippingOptions: await listShippingOptions() }
}

export async function chooseToyShipping(id: string) {
  requireToys()
  const options = await listShippingOptions()
  if (!options.some(o => o.id === id)) throw new Error("This delivery option is no longer available")
  await setShippingMethod(id)
  return (await getCart())!
}

export async function prepareToyPayment() {
  requireToys()
  if (!STRIPE_PK) throw new Error("Payments are not available yet. Card payments are being configured.")
  const cart = await getCart()
  if (!cart?.items?.length || !cart.shipping_address || !cart.shipping_methods?.length) throw new Error("Complete your contact and delivery details first")
  const active = cart.payment_collection?.payment_sessions?.find(s => s.provider_id === "pp_stripe_stripe" && !["canceled", "error"].includes(s.status))
  if (active?.status === "authorized" || ["succeeded", "processing", "requires_capture"].includes(String(active?.data?.status))) return { processing: true, clientSecret: null, cart }
  const safeData = buildSafeStripePayload(cart.id, "toys")
  const { payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_stripe_stripe",
    data: safeData,
  })
  const session = payment_collection.payment_sessions?.find(s => s.provider_id === "pp_stripe_stripe" && s.status !== "canceled")
  const secret = session?.data?.client_secret
  if (typeof secret !== "string") throw new Error("Unable to prepare payment. Please try again.")
  return { processing: false, clientSecret: secret, cart: (await getCart())! }
}

export async function completeToyOrder(): Promise<{ orderId: string }> {
  requireToys()
  const cart = await getCart()
  if (!cart) {
    const last = (await cookies()).get("_playpuff_last_order")?.value
    if (last) return { orderId: last }
    throw new Error("We couldn’t locate your bag. Please contact support before paying again.")
  }
  // Completion is idempotent in Medusa and authorizes the existing payment session.
  const result = await sdk.store.cart.complete(cart.id)
  if (result.type !== "order") throw new Error("Your payment is being checked. Use Check order status to retry confirmation without paying again.")
  const jar = await cookies()
  jar.set("_playpuff_last_order", result.order.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 86400, secure: process.env.NODE_ENV === "production" })
  jar.delete(CART_COOKIE)
  revalidatePath("/", "layout")
  return { orderId: result.order.id }
}
