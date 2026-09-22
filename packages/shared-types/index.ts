/**
 * Contracts shared between the Medusa backend (custom admin API) and the
 * storefront. Keep this dependency-free.
 */

export type NicheKey = "cases" | "eyewear" | "toys" | "watches";

export type SupplierType = "cj" | "printify" | "manual";

export type SupplierOrderStatus =
  | "pending"
  | "ready"
  | "placing"
  | "placed"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export type PnlRow = {
  date: string;
  orders: number;
  revenue: number;
  product_cost: number;
  supplier_shipping: number;
  payment_fee: number;
  ad_spend: number;
  refund_loss: number;
  contribution_profit: number;
};

export type PnlResponse = {
  from: string;
  to: string;
  rows: PnlRow[];
  totals: Omit<PnlRow, "date">;
};

export * from "./playpuff";

