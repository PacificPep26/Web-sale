import Link from "next/link";
import { getCart } from "@/lib/data/cart";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await getCart();
  const currency = cart?.currency_code ?? "usd";
  const items = cart?.items ?? [];

  if (!items.length) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl">Your cart is empty</h1>
        <Link href="/" className="btn btn-accent mt-6">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-10 py-10 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl">Cart</h1>
        <div className="mt-4 divide-y divide-[color:var(--color-border)] border-y border-token">
          {items.map((it) => (
            <CartLineItem key={it.id} item={it} currency={currency} />
          ))}
        </div>
      </div>
      <aside className="h-fit rounded-token border border-token p-5">
        <h2 className="font-semibold">Summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatMoney(cart?.item_subtotal ?? cart?.subtotal ?? 0, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd className="text-muted">calculated at checkout</dd>
          </div>
        </dl>
        <div className="mt-3 flex justify-between border-t border-token pt-3 font-semibold">
          <span>Total</span>
          <span>{formatMoney(cart?.total ?? 0, currency)}</span>
        </div>
        <Link href="/checkout" className="btn btn-accent mt-5 w-full">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
