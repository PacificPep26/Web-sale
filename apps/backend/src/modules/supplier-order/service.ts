import { MedusaService } from "@medusajs/framework/utils";
import { SupplierOrder } from "./models/supplier-order";
import { SupplierOrderItem } from "./models/supplier-order-item";
import { SupplierShipment } from "./models/supplier-shipment";
import { SupplierApiLog } from "./models/supplier-api-log";

type Group = {
  supplierId: string;
  currency: string;
  items: {
    order_line_item_id: string;
    variant_id: string;
    supplier_sku?: string | null;
    quantity: number;
    unit_cost: number;
  }[];
};

class SupplierOrderModuleService extends MedusaService({
  SupplierOrder,
  SupplierOrderItem,
  SupplierShipment,
  SupplierApiLog,
}) {
  /**
   * Idempotently create one SupplierOrder per supplier group for an order.
   * Re-running with the same order returns the existing rows untouched.
   */
  async createFromOrder(orderId: string, groups: Group[]) {
    const existing = await this.listSupplierOrders({ order_id: orderId });
    const bySupplier = new Map(existing.map((o) => [o.supplier_id, o]));
    const created: Record<string, unknown>[] = [];

    for (const g of groups) {
      if (bySupplier.has(g.supplierId)) {
        created.push(bySupplier.get(g.supplierId)!);
        continue;
      }
      const subtotal = g.items.reduce((s, i) => {
        const line = Number(i.unit_cost ?? 0) * Number(i.quantity ?? 0);
        return s + (Number.isFinite(line) ? line : 0);
      }, 0);
      const [order] = await this.createSupplierOrders([
        {
          order_id: orderId,
          supplier_id: g.supplierId,
          status: "ready",
          idempotency_key: `${orderId}:${g.supplierId}`,
          currency: g.currency,
          subtotal_cost: Number(subtotal.toFixed(2)),
          total_cost: Number(subtotal.toFixed(2)),
        },
      ]);
      await this.createSupplierOrderItems(
        g.items.map((i) => ({
          supplier_order_id: order.id,
          order_line_item_id: i.order_line_item_id,
          variant_id: i.variant_id,
          supplier_sku: i.supplier_sku ?? null,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
        }))
      );
      created.push(order);
    }
    return created;
  }

  async markPlaced(
    id: string,
    supplierRef: string,
    costs?: { subtotal?: number; shipping?: number; total?: number }
  ) {
    return this.updateSupplierOrders({
      id,
      status: "placed",
      supplier_ref: supplierRef,
      placed_at: new Date(),
      last_error: null,
      ...(costs?.subtotal != null ? { subtotal_cost: costs.subtotal } : {}),
      ...(costs?.shipping != null ? { shipping_cost: costs.shipping } : {}),
      ...(costs?.total != null ? { total_cost: costs.total } : {}),
    });
  }

  async markFailed(id: string, error: string) {
    return this.updateSupplierOrders({ id, status: "failed", last_error: error });
  }

  async listStuck(thresholdMinutes: number) {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000);
    const placingCutoff = new Date(Date.now() - 15 * 60_000);
    const all = await this.listSupplierOrders({
      status: ["pending", "ready", "failed", "placing"],
    });
    return all.filter((o) => {
      const updated = new Date(
        (o as unknown as { updated_at: string }).updated_at
      );
      if (o.status === "placing") return updated < placingCutoff;
      return updated < cutoff;
    });
  }

  async logApiCall(entry: {
    supplier_id: string;
    supplier_order_id?: string | null;
    endpoint: string;
    method?: string;
    request?: unknown;
    response?: unknown;
    status_code?: number | null;
    ok: boolean;
    duration_ms: number;
  }) {
    return this.createSupplierApiLogs({
      supplier_id: entry.supplier_id,
      supplier_order_id: entry.supplier_order_id ?? null,
      endpoint: entry.endpoint,
      method: entry.method ?? "POST",
      request: (entry.request ?? null) as Record<string, unknown> | null,
      response: (entry.response ?? null) as Record<string, unknown> | null,
      status_code: entry.status_code ?? null,
      ok: entry.ok,
      duration_ms: entry.duration_ms,
    });
  }
}

export default SupplierOrderModuleService;
