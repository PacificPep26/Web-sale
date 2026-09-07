"use client";

import { useState, useTransition } from "react";
import type { HttpTypes } from "@medusajs/types";
import {
  setCheckoutDetails,
  setShippingMethod,
  initPaymentSession,
  placeOrder,
  type CheckoutAddress,
} from "@/lib/data/cart";
import { formatMoney } from "@/lib/money";
import { StripePayment } from "./StripePayment";
import { STRIPE_PK } from "@/lib/config";

type Step = "address" | "delivery" | "payment";

export function CheckoutClient({
  cart,
  shippingOptions,
}: {
  cart: HttpTypes.StoreCart;
  shippingOptions: HttpTypes.StoreCartShippingOption[];
}) {
  const currency = cart.currency_code ?? "usd";
  const [step, setStep] = useState<Step>(
    cart.shipping_address ? (cart.shipping_methods?.length ? "payment" : "delivery") : "address"
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);

  function submitAddress(fd: FormData) {
    const addr = Object.fromEntries(fd) as unknown as CheckoutAddress;
    addr.country_code = "us";
    start(async () => {
      try {
        await setCheckoutDetails(addr);
        setStep("delivery");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function chooseShipping(optionId: string) {
    start(async () => {
      try {
        await setShippingMethod(optionId);
        setStep("payment");
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function startPayment() {
    start(async () => {
      setError(null);
      try {
        const providerId = STRIPE_PK ? "pp_stripe_stripe" : "pp_system_default";
        const pc = await initPaymentSession(providerId);
        if (STRIPE_PK) {
          const session = pc.payment_sessions?.find(
            (s) => s.provider_id === "pp_stripe_stripe"
          );
          const secret = (session?.data as { client_secret?: string } | undefined)
            ?.client_secret;
          if (!secret) throw new Error("Stripe session missing client secret");
          setStripeSecret(secret);
        } else {
          await placeOrder();
        }
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        {/* address */}
        <section>
          <h2 className="text-lg font-semibold">
            1. Contact & shipping{" "}
            {step !== "address" && (
              <button className="ml-2 text-xs underline" onClick={() => setStep("address")}>
                edit
              </button>
            )}
          </h2>
          {step === "address" && (
            <form action={submitAddress} className="mt-3 grid grid-cols-2 gap-3">
              <input name="email" type="email" required placeholder="Email" className="field col-span-2" defaultValue={cart.email ?? ""} />
              <input name="first_name" required placeholder="First name" className="field" defaultValue={cart.shipping_address?.first_name ?? ""} />
              <input name="last_name" required placeholder="Last name" className="field" defaultValue={cart.shipping_address?.last_name ?? ""} />
              <input name="address_1" required placeholder="Address" className="field col-span-2" defaultValue={cart.shipping_address?.address_1 ?? ""} />
              <input name="address_2" placeholder="Apt, suite (optional)" className="field col-span-2" defaultValue={cart.shipping_address?.address_2 ?? ""} />
              <input name="city" required placeholder="City" className="field" defaultValue={cart.shipping_address?.city ?? ""} />
              <input name="province" required placeholder="State" className="field" defaultValue={cart.shipping_address?.province ?? ""} />
              <input name="postal_code" required placeholder="ZIP" className="field" defaultValue={cart.shipping_address?.postal_code ?? ""} />
              <input name="phone" placeholder="Phone (optional)" className="field" defaultValue={cart.shipping_address?.phone ?? ""} />
              <button className="btn btn-accent col-span-2 mt-1" disabled={pending}>
                {pending ? "Saving…" : "Continue to delivery"}
              </button>
            </form>
          )}
        </section>

        {/* delivery */}
        {step !== "address" && (
          <section>
            <h2 className="text-lg font-semibold">
              2. Delivery{" "}
              {step === "payment" && (
                <button className="ml-2 text-xs underline" onClick={() => setStep("delivery")}>
                  edit
                </button>
              )}
            </h2>
            {step === "delivery" && (
              <div className="mt-3 space-y-2">
                {shippingOptions.map((o) => (
                  <button
                    key={o.id}
                    disabled={pending}
                    onClick={() => chooseShipping(o.id)}
                    className="flex w-full items-center justify-between rounded-token border border-token p-3 text-left text-sm hover:surface"
                  >
                    <span>{o.name}</span>
                    <span>{formatMoney(o.amount ?? 0, currency)}</span>
                  </button>
                ))}
                {!shippingOptions.length && (
                  <p className="text-sm text-muted">No shipping options for this address.</p>
                )}
              </div>
            )}
          </section>
        )}

        {/* payment */}
        {step === "payment" && (
          <section>
            <h2 className="text-lg font-semibold">3. Payment</h2>
            {!stripeSecret && (
              <button className="btn btn-accent mt-3 w-full" disabled={pending} onClick={startPayment}>
                {pending
                  ? "Preparing…"
                  : STRIPE_PK
                    ? "Continue to card"
                    : "Place order (test / no card)"}
              </button>
            )}
            {stripeSecret && (
              <div className="mt-4">
                <StripePayment clientSecret={stripeSecret} onPaid={placeOrder} />
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}
      </div>

      {/* summary */}
      <aside className="h-fit rounded-token border border-token p-5 text-sm">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="mt-3 space-y-2">
          {cart.items?.map((it) => (
            <li key={it.id} className="flex justify-between gap-2">
              <span className="text-muted">
                {it.product_title} × {it.quantity}
              </span>
              <span>{formatMoney(it.total ?? 0, currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-token pt-3">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatMoney(cart.item_subtotal ?? 0, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{formatMoney(cart.shipping_total ?? 0, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd>{formatMoney(cart.tax_total ?? 0, currency)}</dd>
          </div>
        </dl>
        <div className="mt-3 flex justify-between border-t border-token pt-3 font-semibold">
          <span>Total</span>
          <span>{formatMoney(cart.total ?? 0, currency)}</span>
        </div>
      </aside>
    </div>
  );
}
