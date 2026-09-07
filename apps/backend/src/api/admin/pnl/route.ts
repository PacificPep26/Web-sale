import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Contribution profit, day by day:
 *   revenue − product cost − supplier shipping − payment fee − ad spend − refund loss
 * Payment fee is estimated at 2.9% + $0.30/order (Stripe card, no exact data yet).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");
  const soService = req.scope.resolve("supplierOrder") as any;
  const adService = req.scope.resolve("adSpend") as any;

  const q = req.query as Record<string, string>;
  const to = q.to ?? new Date().toISOString().slice(0, 10);
  const from =
    q.from ??
    new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
  const salesChannelId = q.sales_channel_id;

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "total",
      "item_subtotal",
      "shipping_total",
      "sales_channel_id",
    ],
    filters: {
      created_at: { $gte: `${from}T00:00:00.000Z`, $lte: `${to}T23:59:59.999Z` },
      ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
    },
    pagination: { take: 1000, skip: 0 },
  });

  const supplierOrders = await soService.listSupplierOrders({});
  const soByOrder = new Map<string, any[]>();
  for (const so of supplierOrders) {
    if (!soByOrder.has(so.order_id)) soByOrder.set(so.order_id, []);
    soByOrder.get(so.order_id)!.push(so);
  }

  const days = new Map<
    string,
    {
      date: string;
      orders: number;
      revenue: number;
      product_cost: number;
      supplier_shipping: number;
      payment_fee: number;
      refund_loss: number;
      ad_spend: number;
      contribution_profit: number;
    }
  >();

  const bucket = (d: string) => {
    if (!days.has(d))
      days.set(d, {
        date: d,
        orders: 0,
        revenue: 0,
        product_cost: 0,
        supplier_shipping: 0,
        payment_fee: 0,
        refund_loss: 0,
        ad_spend: 0,
        contribution_profit: 0,
      });
    return days.get(d)!;
  };

  for (const o of orders) {
    const d = new Date(o.created_at).toISOString().slice(0, 10);
    const b = bucket(d);
    b.orders += 1;
    b.revenue += o.total ?? 0;
    b.payment_fee += (o.total ?? 0) * 0.029 + 0.3;
    for (const so of soByOrder.get(o.id) ?? []) {
      b.product_cost += so.subtotal_cost ?? 0;
      b.supplier_shipping += so.shipping_cost ?? 0;
      b.refund_loss += so.loss_amount ?? 0;
    }
  }

  const adRows = await adService.listAdSpends({
    date: { $gte: from, $lte: to },
    ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
  });
  for (const a of adRows) bucket(a.date).ad_spend += a.amount ?? 0;

  const rows = [...days.values()]
    .map((r) => {
      r.contribution_profit =
        r.revenue -
        r.product_cost -
        r.supplier_shipping -
        r.payment_fee -
        r.ad_spend -
        r.refund_loss;
      for (const k of Object.keys(r) as (keyof typeof r)[]) {
        if (typeof r[k] === "number") (r[k] as number) = Number((r[k] as number).toFixed(2));
      }
      return r;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const totals = rows.reduce(
    (t, r) => {
      t.revenue += r.revenue;
      t.product_cost += r.product_cost;
      t.supplier_shipping += r.supplier_shipping;
      t.payment_fee += r.payment_fee;
      t.ad_spend += r.ad_spend;
      t.refund_loss += r.refund_loss;
      t.contribution_profit += r.contribution_profit;
      t.orders += r.orders;
      return t;
    },
    {
      revenue: 0,
      product_cost: 0,
      supplier_shipping: 0,
      payment_fee: 0,
      ad_spend: 0,
      refund_loss: 0,
      contribution_profit: 0,
      orders: 0,
    }
  );
  for (const k of Object.keys(totals) as (keyof typeof totals)[]) {
    totals[k] = Number(totals[k].toFixed(2));
  }

  res.json({ from, to, rows, totals });
};
