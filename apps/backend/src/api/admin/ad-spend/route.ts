import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("adSpend") as any;
  const q = req.query as Record<string, string>;
  const filters: Record<string, unknown> = {};
  if (q.from && q.to) filters.date = { $gte: q.from, $lte: q.to };
  if (q.sales_channel_id) filters.sales_channel_id = q.sales_channel_id;
  const ad_spend = await service.listAdSpends(filters, {
    order: { date: "DESC" },
    take: 500,
  });
  res.json({ ad_spend });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const service = req.scope.resolve("adSpend") as any;
  const b = req.body as {
    date: string;
    channel?: string;
    amount: number;
    currency?: string;
    sales_channel_id?: string | null;
    note?: string;
  };
  if (!b?.date || b?.amount == null) {
    return res.status(400).json({ message: "date and amount are required" });
  }
  const [created] = await service.createAdSpends([
    {
      date: b.date,
      channel: b.channel ?? "other",
      amount: b.amount,
      currency: b.currency ?? "usd",
      sales_channel_id: b.sales_channel_id ?? null,
      note: b.note ?? null,
      source: "manual",
    },
  ]);
  res.status(201).json({ ad_spend: created });
};
