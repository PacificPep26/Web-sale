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
import { WisePayment } from "./WisePayment";
import { STRIPE_PK } from "@/lib/config";

type Step = "address" | "delivery" | "payment";
type PaymentMethodType = "stripe" | "wise";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("stripe");
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

  function startStripePayment() {
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

  function handleWiseComplete() {
    start(async () => {
      setError(null);
      try {
        await placeOrder();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  // Calculate order summary totals
  const baseTotal = cart.total ?? 0;
  const wiseDiscountAmount = paymentMethod === "wise" ? 2000 : 0; // $20.00 off
  const displayTotal = Math.max(0, baseTotal - wiseDiscountAmount);

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        {/* address */}
        <section>
          <h2 className="text-lg font-semibold">
            1. Contact & shipping{" "}
            {step !== "address" && (
              <button className="ml-2 text-xs underline text-muted-foreground hover:text-foreground" onClick={() => setStep("address")}>
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
                <button className="ml-2 text-xs underline text-muted-foreground hover:text-foreground" onClick={() => setStep("delivery")}>
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
                    className="flex w-full items-center justify-between rounded-token border border-token p-3.5 text-left text-sm hover:surface transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Worldwide Flat Express Shipping</span>
                      <span className="text-xs text-muted-foreground">Direct door-to-door tracked delivery</span>
                    </div>
                    <span className="font-semibold">{formatMoney(o.amount ?? 0, currency)}</span>
                  </button>
                ))}
                {!shippingOptions.length && (
                  <button
                    disabled={pending}
                    onClick={() => setStep("payment")}
                    className="flex w-full items-center justify-between rounded-token border border-token p-3.5 text-left text-sm hover:surface"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">Worldwide Flat Express Shipping</span>
                      <span className="text-xs text-muted-foreground">Tracked global express</span>
                    </div>
                    <span className="font-semibold">Free</span>
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* payment */}
        {step === "payment" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">3. Payment Method</h2>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("stripe");
                  setStripeSecret(null);
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === "stripe"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 font-semibold"
                    : "border-token hover:border-foreground/30 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Credit / Debit Card</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">Stripe</span>
                </div>
                <span className="text-xs opacity-75">Visa, Mastercard, Amex</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("wise")}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                  paymentMethod === "wise"
                    ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30 font-semibold"
                    : "border-token hover:border-emerald-500/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-emerald-900 dark:text-emerald-200">Wise QR Transfer</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
                    Save $20
                  </span>
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">Wise App / US Bank Transfer</span>
              </button>
            </div>

            {/* Selected Method Details */}
            {paymentMethod === "stripe" && (
              <div className="mt-4 space-y-3">
                {!stripeSecret && (
                  <button className="btn btn-accent w-full py-3 text-sm font-semibold" disabled={pending} onClick={startStripePayment}>
                    {pending
                      ? "Preparing secure payment…"
                      : STRIPE_PK
                        ? "Continue to Card Details"
                        : "Place order (Test Mode)"}
                  </button>
                )}
                {stripeSecret && (
                  <div className="mt-2">
                    <StripePayment clientSecret={stripeSecret} onPaid={placeOrder} />
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "wise" && (
              <div className="mt-4">
                <WisePayment
                  totalAmount={baseTotal}
                  currencyCode={currency}
                  onComplete={handleWiseComplete}
                  pending={pending}
                />
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="text-sm p-3 rounded bg-red-50 text-red-600 border border-red-200">
            {error}
          </p>
        )}
      </div>

      {/* order summary */}
      <aside className="h-fit rounded-token border border-token p-5 text-sm sticky top-6">
        <h2 className="font-semibold text-base mb-3">Order summary</h2>
        <ul className="space-y-2.5">
          {cart.items?.map((it) => (
            <li key={it.id} className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {it.product_title} × {it.quantity}
              </span>
              <span className="font-medium">{formatMoney(it.total ?? 0, currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-token pt-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatMoney(cart.item_subtotal ?? 0, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{formatMoney(cart.shipping_total ?? 0, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{formatMoney(cart.tax_total ?? 0, currency)}</dd>
          </div>
          {paymentMethod === "wise" && (
            <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400">
              <dt>Wise QR Discount</dt>
              <dd>−{formatMoney(2000, currency)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-3 flex justify-between border-t border-token pt-3 font-semibold text-base">
          <span>Total</span>
          <span className={paymentMethod === "wise" ? "text-emerald-600 dark:text-emerald-400" : ""}>
            {formatMoney(displayTotal, currency)}
          </span>
        </div>
      </aside>
    </div>
  );
}
