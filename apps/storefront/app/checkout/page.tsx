import { redirect } from "next/navigation";
import { getCart, listShippingOptions } from "@/lib/data/cart";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCart();
  if (!cart || !cart.items?.length) redirect("/cart");

  const shippingOptions = await listShippingOptions();

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-2xl">Checkout</h1>
      <CheckoutClient cart={cart} shippingOptions={shippingOptions} />
    </div>
  );
}
