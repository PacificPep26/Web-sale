import { defineRouteConfig } from "@medusajs/admin-sdk";
import { TruckFast } from "@medusajs/icons";
import { Container, Heading, Table, Badge, Button, Select, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";

type SO = {
  id: string;
  order_id: string;
  supplier_id: string;
  status: string;
  supplier_ref?: string;
  last_error?: string;
  total_cost?: number;
  attempt_count?: number;
  updated_at: string;
  shipments?: { tracking_number?: string }[];
};

const COLORS: Record<string, "green" | "red" | "orange" | "grey" | "blue"> = {
  placed: "blue",
  shipped: "green",
  delivered: "green",
  failed: "red",
  cancelled: "grey",
};

const SupplierOrdersPage = () => {
  const [rows, setRows] = useState<SO[]>([]);
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    const qs = status === "all" ? "" : `?status=${status}`;
    fetch(`/admin/supplier-orders${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.supplier_orders ?? []));
  };

  useEffect(load, [status]);

  const retry = async (id: string) => {
    setBusy(id);
    try {
      const r = await fetch(`/admin/supplier-orders/${id}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error("retry failed");
      toast.success("Re-queued");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const stuck = rows.filter(
    (r) =>
      ["pending", "ready", "failed", "placing"].includes(r.status) &&
      Date.now() - new Date(r.updated_at).getTime() > 2 * 3600_000
  );

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Supplier orders</Heading>
        <div className="flex items-center gap-3">
          {stuck.length > 0 && (
            <Badge color="red" size="2xsmall">
              {stuck.length} stuck
            </Badge>
          )}
          <div className="w-40">
            <Select value={status} onValueChange={setStatus}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {["all", "ready", "placing", "placed", "shipped", "failed", "cancelled"].map(
                  (s) => (
                    <Select.Item key={s} value={s}>
                      {s}
                    </Select.Item>
                  )
                )}
              </Select.Content>
            </Select>
          </div>
          <Button size="small" variant="secondary" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Supplier ref</Table.HeaderCell>
              <Table.HeaderCell>Tracking</Table.HeaderCell>
              <Table.HeaderCell>Cost</Table.HeaderCell>
              <Table.HeaderCell>Att.</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((so) => (
              <Table.Row key={so.id}>
                <Table.Cell>
                  <Badge size="2xsmall" color={COLORS[so.status] ?? "orange"}>
                    {so.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <a
                    className="text-ui-fg-interactive"
                    href={`/app/orders/${so.order_id}`}
                  >
                    {so.order_id.slice(-8)}
                  </a>
                </Table.Cell>
                <Table.Cell>{so.supplier_ref ?? "—"}</Table.Cell>
                <Table.Cell>
                  {so.shipments?.map((s) => s.tracking_number).filter(Boolean).join(", ") || "—"}
                </Table.Cell>
                <Table.Cell>{so.total_cost ?? "—"}</Table.Cell>
                <Table.Cell>{so.attempt_count ?? 0}</Table.Cell>
                <Table.Cell>
                  {["failed", "ready"].includes(so.status) && (
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={busy === so.id}
                      onClick={() => retry(so.id)}
                    >
                      Retry
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Supplier orders",
  icon: TruckFast,
});

export default SupplierOrdersPage;
