import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Container, Heading, Badge, Button, Table, Text, toast } from "@medusajs/ui";
import { useEffect, useState, useCallback } from "react";

type SupplierOrder = {
  id: string;
  supplier_id: string;
  status: string;
  supplier_ref?: string;
  last_error?: string;
  total_cost?: number;
  currency?: string;
  loss_amount?: number;
  shipments?: { tracking_number?: string; carrier?: string; tracking_url?: string }[];
};

const STATUS_COLOR: Record<string, "green" | "red" | "orange" | "grey" | "blue"> = {
  placed: "blue",
  shipped: "green",
  delivered: "green",
  failed: "red",
  cancelled: "grey",
  ready: "orange",
  pending: "orange",
  placing: "orange",
};

const OrderSupplierStatusWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [rows, setRows] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/admin/supplier-orders?order_id=${order.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.supplier_orders ?? []))
      .finally(() => setLoading(false));
  }, [order.id]);

  useEffect(load, [load]);

  const act = async (id: string, action: "retry" | "cancel") => {
    setBusy(id + action);
    try {
      const r = await fetch(`/admin/supplier-orders/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error((await r.json()).message ?? "failed");
      toast.success(`Supplier order ${action} done`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Dropship</Heading>
        <Button size="small" variant="secondary" onClick={load}>
          Refresh
        </Button>
      </div>
      <div className="px-6 py-4">
        {loading ? (
          <Text size="small">Loading…</Text>
        ) : rows.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No supplier orders yet.
          </Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Ref</Table.HeaderCell>
                <Table.HeaderCell>Tracking</Table.HeaderCell>
                <Table.HeaderCell>Cost</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((so) => (
                <Table.Row key={so.id}>
                  <Table.Cell>
                    <Badge size="2xsmall" color={STATUS_COLOR[so.status] ?? "grey"}>
                      {so.status}
                    </Badge>
                    {so.last_error && (
                      <Text size="xsmall" className="text-ui-fg-error">
                        {so.last_error}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>{so.supplier_ref ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {so.shipments?.length
                      ? so.shipments
                          .map((s) => s.tracking_number)
                          .filter(Boolean)
                          .join(", ")
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {so.total_cost != null
                      ? `${(so.currency ?? "usd").toUpperCase()} ${so.total_cost}`
                      : "—"}
                    {so.loss_amount ? (
                      <Text size="xsmall" className="text-ui-fg-error">
                        loss {so.loss_amount}
                      </Text>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      {["failed", "ready"].includes(so.status) && (
                        <Button
                          size="small"
                          variant="secondary"
                          disabled={busy === so.id + "retry"}
                          onClick={() => act(so.id, "retry")}
                        >
                          Retry
                        </Button>
                      )}
                      {!["cancelled", "delivered"].includes(so.status) && (
                        <Button
                          size="small"
                          variant="danger"
                          disabled={busy === so.id + "cancel"}
                          onClick={() => act(so.id, "cancel")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderSupplierStatusWidget;
