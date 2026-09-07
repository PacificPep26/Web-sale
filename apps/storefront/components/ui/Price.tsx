import { formatMoney } from "@/lib/money";

export function Price({
  amount,
  currency = "usd",
  className,
  from,
}: {
  amount: number | undefined | null;
  currency?: string;
  className?: string;
  from?: boolean;
}) {
  if (amount == null) return null;
  return (
    <span className={className}>
      {from ? "from " : ""}
      {formatMoney(amount, currency)}
    </span>
  );
}
