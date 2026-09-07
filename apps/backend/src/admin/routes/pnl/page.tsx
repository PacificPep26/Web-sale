import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CurrencyDollar } from "@medusajs/icons";
import {
  Container,
  Heading,
  Table,
  Input,
  Button,
  Label,
  Select,
  toast,
  Text,
} from "@medusajs/ui";
import { useEffect, useState } from "react";

type Row = {
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

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const PnlPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Partial<Row>>({});
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [channel, setChannel] = useState("all");
  const [spend, setSpend] = useState({ date: today, channel: "meta", amount: "", sales_channel_id: "" });

  const load = () => {
    const qs = new URLSearchParams({ from, to });
    if (channel !== "all") qs.set("sales_channel_id", channel);
    fetch(`/admin/pnl?${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        setTotals(d.totals ?? {});
      });
  };

  useEffect(() => {
    fetch(`/admin/sales-channels?limit=100`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setChannels(d.sales_channels ?? []))
      .catch(() => void 0);
  }, []);

  useEffect(load, [from, to, channel]);

  const addSpend = async () => {
    if (!spend.amount) return;
    const r = await fetch(`/admin/ad-spend`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: spend.date,
        channel: spend.channel,
        amount: Number(spend.amount),
        sales_channel_id: spend.sales_channel_id || null,
      }),
    });
    if (r.ok) {
      toast.success("Ad spend recorded");
      setSpend({ ...spend, amount: "" });
      load();
    } else {
      toast.error("Failed");
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-end justify-between gap-3 px-6 py-4">
        <Heading>Contribution profit</Heading>
        <div className="flex items-end gap-2">
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="w-40">
            <Label>Channel</Label>
            <Select value={channel} onValueChange={setChannel}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All</Select.Item>
                {channels.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Revenue", totals.revenue],
            ["Product + shipping cost", (totals.product_cost ?? 0) + (totals.supplier_shipping ?? 0)],
            ["Ad spend", totals.ad_spend],
            ["Contribution profit", totals.contribution_profit],
          ].map(([label, val]) => (
            <div key={label as string} className="rounded-lg border p-3">
              <Text size="xsmall" className="text-ui-fg-subtle">
                {label as string}
              </Text>
              <Text className="text-lg font-semibold">{money(Number(val ?? 0))}</Text>
            </div>
          ))}
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Orders</Table.HeaderCell>
              <Table.HeaderCell>Revenue</Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Ship</Table.HeaderCell>
              <Table.HeaderCell>Fees</Table.HeaderCell>
              <Table.HeaderCell>Ads</Table.HeaderCell>
              <Table.HeaderCell>Loss</Table.HeaderCell>
              <Table.HeaderCell>Contribution</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.date}>
                <Table.Cell>{r.date}</Table.Cell>
                <Table.Cell>{r.orders}</Table.Cell>
                <Table.Cell>{money(r.revenue)}</Table.Cell>
                <Table.Cell>{money(r.product_cost)}</Table.Cell>
                <Table.Cell>{money(r.supplier_shipping)}</Table.Cell>
                <Table.Cell>{money(r.payment_fee)}</Table.Cell>
                <Table.Cell>{money(r.ad_spend)}</Table.Cell>
                <Table.Cell>{money(r.refund_loss)}</Table.Cell>
                <Table.Cell
                  className={
                    r.contribution_profit >= 0 ? "text-ui-fg-base" : "text-ui-fg-error"
                  }
                >
                  {money(r.contribution_profit)}
                </Table.Cell>
              </Table.Row>
            ))}
            {rows.length === 0 && (
              <Table.Row>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    No data in range.
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      <div className="px-6 py-4">
        <Heading level="h3" className="mb-2">
          Record ad spend
        </Heading>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label>Date</Label>
            <Input type="date" value={spend.date} onChange={(e) => setSpend({ ...spend, date: e.target.value })} />
          </div>
          <div className="w-32">
            <Label>Channel</Label>
            <Select value={spend.channel} onValueChange={(v) => setSpend({ ...spend, channel: v })}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {["meta", "tiktok", "pinterest", "google", "other"].map((c) => (
                  <Select.Item key={c} value={c}>
                    {c}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="w-40">
            <Label>Store</Label>
            <Select
              value={spend.sales_channel_id || "none"}
              onValueChange={(v) => setSpend({ ...spend, sales_channel_id: v === "none" ? "" : v })}
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="none">(all)</Select.Item>
                {channels.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <div className="w-28">
            <Label>Amount</Label>
            <Input
              type="number"
              value={spend.amount}
              onChange={(e) => setSpend({ ...spend, amount: e.target.value })}
            />
          </div>
          <Button onClick={addSpend} disabled={!spend.amount}>
            Add
          </Button>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "P&L",
  icon: CurrencyDollar,
});

export default PnlPage;
