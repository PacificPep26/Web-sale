import Link from "next/link";
import { notFound } from "next/navigation";
import { sdk } from "@/lib/medusa";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let order;
  try {
    const res = await sdk.store.order.retrieve(id, {
      fields:
        "id,display_id,email,currency_code,total,item_total,shipping_total,tax_total,*items,*shipping_address",
    });
    order = res.order;
  } catch {
    notFound();
  }
  const currency = order.currency_code ?? "usd";

  return (
    <div className="container-page max-w-2xl py-16">
      <p className="text-sm uppercase tracking-wide text-muted">
        Order #{order.display_id}
      </p>
      <h1 className="mt-2 text-3xl">Thanks — your order is in.</h1>
      <p className="mt-3 text-muted">
        We sent a confirmation to <strong>{order.email}</strong>. You&apos;ll get
        tracking by email once it ships.
      </p>

      <div className="mt-8 divide-y divide-[color:var(--color-border)] border-y border-token">
        {order.items?.map((it) => (
          <div key={it.id} className="flex justify-between gap-3 py-3 text-sm">
            <span>
              {it.product_title} — {it.variant_title} × {it.quantity}
            </span>
            <span>{formatMoney(it.total ?? 0, currency)}</span>
          </div>
        ))}
      </div>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd>{formatMoney(order.shipping_total ?? 0, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Tax</dt>
          <dd>{formatMoney(order.tax_total ?? 0, currency)}</dd>
        </div>
        <div className="flex justify-between border-t border-token pt-2 font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(order.total ?? 0, currency)}</dd>
        </div>
      </dl>

      <Link href="/" className="btn btn-outline mt-10">
        Continue shopping
      </Link>
    </div>
  );
}
