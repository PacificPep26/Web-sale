"use client"

import { useEffect, useRef, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { STRIPE_PK } from "@/lib/config"

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null

function PaymentForm({ label, onPaid }: { label: string; onPaid: () => Promise<void> }) {
  const stripe = useStripe()
  const elements = useElements()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [paid, setPaid] = useState(false)
  const checked = useRef(false)
  useEffect(() => {
    if (!stripe || checked.current) return
    const secret = new URLSearchParams(location.search).get("payment_intent_client_secret")
    if (!secret) return
    checked.current = true
    void stripe.retrievePaymentIntent(secret).then(async ({ paymentIntent }) => {
      if (paymentIntent && ["succeeded", "processing", "requires_capture"].includes(paymentIntent.status)) { setPaid(true); try { await onPaid() } catch { setError("Your payment is being checked. Retry order confirmation below without paying again.") } }
    }).catch(() => setError("Unable to check payment status. Please retry."))
  }, [stripe, onPaid])
  async function pay() {
    if (!stripe || !elements || lock.current) return
    lock.current = true
    setBusy(true)
    setError("")
    try {
      const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/checkout?payment_return=1` }, redirect: "if_required" })
      if (result.error) { setError(result.error.message ?? "Payment failed. Please check your details."); return }
      setPaid(true)
      await onPaid()
    } catch { setError("We couldn’t confirm your order yet. Check order status before making another payment."); setPaid(true) }
    finally { lock.current = false; setBusy(false) }
  }
  return <>{!paid && <PaymentElement options={{ paymentMethodOrder: ["card"], wallets: { applePay: "never", googlePay: "never" } }} />}{error && <p className="pp-error" role="alert">{error}</p>}{paid ? <button className="pp-button" disabled={busy} onClick={async () => { if (lock.current) return; lock.current = true; setBusy(true); try { await onPaid() } catch { setError("Still checking your order. Please retry shortly; you won’t be charged again.") } finally { lock.current = false; setBusy(false) } }}>Check order status</button> : <button className="pp-button" disabled={busy || !stripe || !elements} onClick={pay}>{busy ? "Processing…" : label}</button>}</>
}

export function ToyPayment({ clientSecret, label, onPaid }: { clientSecret: string; label: string; onPaid: () => Promise<void> }) {
  if (!stripePromise) return <p>Payments are not available yet.</p>
  return <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#6331d8", borderRadius: "12px", fontFamily: "Nunito Sans, sans-serif" } } }}><PaymentForm label={label} onPaid={onPaid} /></Elements>
}
