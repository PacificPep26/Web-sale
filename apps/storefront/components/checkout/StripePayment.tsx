"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { STRIPE_PK } from "@/lib/config";

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

function Inner({ onPaid }: { onPaid: () => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message ?? "Payment failed");
      setBusy(false);
      return;
    }
    try {
      await onPaid();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <PaymentElement />
      {err && <p className="mt-2 text-sm" style={{ color: "var(--color-danger)" }}>{err}</p>}
      <button className="btn btn-accent mt-4 w-full" disabled={busy || !stripe} onClick={pay}>
        {busy ? "Processing…" : "Pay & place order"}
      </button>
    </div>
  );
}

export function StripePayment({
  clientSecret,
  onPaid,
}: {
  clientSecret: string;
  onPaid: () => Promise<void>;
}) {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <Inner onPaid={onPaid} />
    </Elements>
  );
}
