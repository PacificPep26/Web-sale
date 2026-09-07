"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sdk } from "@/lib/medusa";
import { CART_COOKIE } from "@/lib/config";
import { getRegion } from "./regions";
import type { HttpTypes } from "@medusajs/types";

const CART_FIELDS =
  "*items,*items.variant,*items.variant.product,*items.thumbnail,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions,+region.*";

async function readCartId() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

async function writeCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function clearCartId() {
  (await cookies()).delete(CART_COOKIE);
}

export async function getCart(): Promise<HttpTypes.StoreCart | null> {
  const id = await readCartId();
  if (!id) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    return cart;
  } catch {
    await clearCartId();
    return null;
  }
}

export async function getOrCreateCart(): Promise<HttpTypes.StoreCart> {
  const existing = await getCart();
  if (existing) return existing;
  const region = await getRegion();
  const { cart } = await sdk.store.cart.create({ region_id: region.id });
  await writeCartId(cart.id);
  return cart;
}

export async function addItem(variantId: string, quantity = 1) {
  const cart = await getOrCreateCart();
  await sdk.store.cart.createLineItem(cart.id, {
    variant_id: variantId,
    quantity,
  });
  revalidatePath("/", "layout");
}

export async function updateItem(lineItemId: string, quantity: number) {
  const id = await readCartId();
  if (!id) return;
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(id, lineItemId);
  } else {
    await sdk.store.cart.updateLineItem(id, lineItemId, { quantity });
  }
  revalidatePath("/", "layout");
}

export async function removeItem(lineItemId: string) {
  const id = await readCartId();
  if (!id) return;
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
  const id = await readCartId();
  if (!id) throw new Error("No cart");
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
  const id = await readCartId();
  if (!id) throw new Error("No cart");
  await sdk.store.cart.addShippingMethod(id, { option_id: optionId });
  revalidatePath("/checkout");
}

export async function initPaymentSession(providerId: string) {
  const cart = await getCart();
  if (!cart) throw new Error("No cart");
  const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
    cart,
    { provider_id: providerId }
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
