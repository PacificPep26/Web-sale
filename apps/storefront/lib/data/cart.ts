"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sdk } from "@/lib/medusa";
import { CART_COOKIE, NICHE } from "@/lib/config";
import { getRegion } from "./regions";
import { getStorefrontChannel } from "./channel";
import { buildSafeStripePayload } from "@/lib/stripe-shield";
import type { HttpTypes } from "@medusajs/types";

const CART_FIELDS =
  "sales_channel_id,completed_at,*items,*items.variant,*items.variant.product,*items.thumbnail,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions,+region.*";

async function readCartId() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string) {
  try {
    (await cookies()).set(CART_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    // cookies can only be modified in Server Actions or Route Handlers
  }
}

async function clearCartId() {
  try {
    (await cookies()).delete(CART_COOKIE);
  } catch {
    // cookies can only be modified in Server Actions or Route Handlers
  }
}

export async function getCart(): Promise<HttpTypes.StoreCart | null> {
  const id = await readCartId();
  if (!id) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    const channel = await getStorefrontChannel()
    if (cart.sales_channel_id !== channel) throw new Error("Cart belongs to another storefront")
    return cart;
  } catch {
    await clearCartId();
    return null;
  }
}

export async function getOrCreateCart(): Promise<HttpTypes.StoreCart> {
  const existing = await getCart();
  if (existing && !existing.completed_at) return existing;
  const region = await getRegion();
  const sales_channel_id = await getStorefrontChannel()
  const { cart } = await sdk.store.cart.create({ region_id: region.id, sales_channel_id });
  await writeCartId(cart.id);
  return cart;
}

export async function addItem(variantId: string, quantity = 1) {
  const cart = await getOrCreateCart();
  assertCartEditable(cart)
  await sdk.store.cart.createLineItem(cart.id, {
    variant_id: variantId,
    quantity,
  });
  revalidatePath("/", "layout");
}

export async function updateItem(lineItemId: string, quantity: number) {
  const cart = await getCart()
  if (!cart) return
  assertCartEditable(cart)
  const id = cart.id;
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(id, lineItemId);
  } else {
    await sdk.store.cart.updateLineItem(id, lineItemId, { quantity });
  }
  revalidatePath("/", "layout");
}

export async function removeItem(lineItemId: string) {
  const cart = await getCart()
  if (!cart) return
  assertCartEditable(cart)
  const id = cart.id;
  await sdk.store.cart.deleteLineItem(id, lineItemId);
  revalidatePath("/", "layout");
}

export type CheckoutAddress = {
  email: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone?: string;
};

export async function setCheckoutDetails(addr: CheckoutAddress) {
  const cart = await getCart()
  if (!cart) throw new Error("No cart")
  assertCartEditable(cart)
  const id = cart.id;
  const { email, ...address } = addr;
  await sdk.store.cart.update(id, {
    email,
    shipping_address: address,
    billing_address: address,
  });
  revalidatePath("/checkout");
}

export async function listShippingOptions(): Promise<
  HttpTypes.StoreCartShippingOption[]
> {
  const id = await readCartId();
  if (!id) return [];
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: id,
  });
  return shipping_options;
}

export async function setShippingMethod(optionId: string) {
  const cart = await getCart()
  if (!cart) throw new Error("No cart")
  assertCartEditable(cart)
  const id = cart.id;
  await sdk.store.cart.addShippingMethod(id, { option_id: optionId });
  revalidatePath("/checkout");
}

export async function initPaymentSession(providerId: string) {
  const cart = await getCart();
  if (!cart) throw new Error("No cart");
  if (providerId !== "pp_stripe_stripe" && (NICHE === "toys" || process.env.NODE_ENV === "production")) throw new Error("Card payments are not configured")
  const safeData = buildSafeStripePayload(cart.id, NICHE);
  const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
    cart,
    { provider_id: providerId }
    { provider_id: providerId, data: safeData }
  );
  return payment_collection;
}

export async function placeOrder() {
  const id = await readCartId();
  if (!id) throw new Error("No cart");
  const res = await sdk.store.cart.complete(id);
  if (res.type === "order") {
    await clearCartId();
    revalidatePath("/", "layout");
    redirect(`/order/${res.order.id}`);
  }
  throw new Error(
    (res as { error?: { message?: string } }).error?.message ??
      "Could not place the order"
  );
}

function assertCartEditable(cart: HttpTypes.StoreCart) {
  const locked = cart.completed_at || cart.payment_collection?.payment_sessions?.some(s =>
    s.status === "authorized" || ["processing", "succeeded", "requires_capture"].includes(String(s.data?.status)))
  if (locked) throw new Error("This payment is being processed. Return to checkout to check your order.")
}
