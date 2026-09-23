"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";

interface WisePaymentProps {
  totalAmount: number; // in dollars
  currencyCode: string;
  onComplete: () => Promise<void> | void;
  pending: boolean;
}

export function WisePayment({
  totalAmount,
  currencyCode,
  onComplete,
  pending,
}: WisePaymentProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Discounted total: subtract $20.00 USD
  const finalTotal = Math.max(0, totalAmount - 20);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const wiseDetails = {
    bankName: "Lead Bank (Wise USD)",
    accountName: "REGENXLABSBIO LLC",
    routingNumber: "101019628",
    accountNumber: "217275118061",
    bankAddress: "108 W 13th St, Wilmington, DE 19801",
  };

  return (
    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 p-5 dark:bg-emerald-950/20 text-foreground space-y-4">
      <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
            Wise
          </span>
          <div>
            <h3 className="font-semibold text-base text-emerald-900 dark:text-emerald-200">
              Wise Transfer / QR Payment
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Instant $20.00 USD discount applied
            </p>
          </div>
        </div>
        <span className="inline-block rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
          Save $20.00 USD
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-center">
        <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm text-center">
          <img
            src="/wise-qr-official.png"
            alt="Official Wise Payment QR Code"
            width={180}
            height={220}
            className="rounded border border-gray-200 p-1 object-contain max-h-[220px]"
          />
          <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            Scan with Wise App to Pay
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total Payable: <strong className="text-emerald-600 dark:text-emerald-400">{formatMoney(finalTotal, currencyCode)}</strong>
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Beneficiary Name
            </span>
            <span className="font-semibold text-sm">{wiseDetails.accountName}</span>
          </div>

          <div className="flex items-center justify-between rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                Routing Number (ACH/ABA)
              </span>
              <span className="font-mono text-sm font-semibold">{wiseDetails.routingNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(wiseDetails.routingNumber, "routing")}
              className="text-xs px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium transition-colors"
            >
              {copiedField === "routing" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                Account Number
              </span>
              <span className="font-mono text-sm font-semibold">{wiseDetails.accountNumber}</span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(wiseDetails.accountNumber, "account")}
              className="text-xs px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium transition-colors"
            >
              {copiedField === "account" ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
              Bank / Bank Address
            </span>
            <span className="font-medium text-xs">{wiseDetails.bankName}</span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={onComplete}
          className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pending ? (
            "Completing order..."
          ) : (
            <>
              <span>Complete Order with Wise Transfer</span>
              <span className="text-xs opacity-90">({formatMoney(finalTotal, currencyCode)})</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-emerald-700 dark:text-emerald-400 mt-2">
          After completing your Wise transfer, click the button above to finalize your order.
        </p>
      </div>
    </div>
  );
}
