import {
  SupplierClient,
  StockCheckItem,
  StockCheckResult,
  CreateOrderInput,
  CreateOrderResult,
  GetOrderResult,
  SupplierApiError,
} from "./types";

type Ctx = {
  token: string;
  shopId: string;
  /** when true, don't hit the network — deterministic fakes for dev/tests */
  sandbox?: boolean;
  onLog?: (e: {
    endpoint: string;
    method: string;
    request?: unknown;
    response?: unknown;
    status_code?: number;
    ok: boolean;
    duration_ms: number;
  }) => Promise<void> | void;
};

const BASE = "https://api.printify.com/v1";

function normaliseStatus(s?: string): string {
  const v = (s ?? "").toLowerCase();
  if (["fulfilled", "shipped", "partially_fulfilled"].includes(v)) return "shipped";
  if (["delivered"].includes(v)) return "delivered";
  if (["canceled", "cancelled"].includes(v)) return "cancelled";
  if (["on_hold", "pending", "in_production"].includes(v)) return "processing";
  return v || "unknown";
}

export class PrintifyClient implements SupplierClient {
  readonly type = "printify" as const;
  constructor(private ctx: Ctx) {}

  private async call<T>(
    path: string,
    init: RequestInit & { supplierOrderId?: string } = {}
  ): Promise<T> {
    const started = Date.now();
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.ctx.token}`,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      const text = await res.text();
      const body = text ? JSON.parse(text) : undefined;
      await this.ctx.onLog?.({
        endpoint: path,
        method: init.method ?? "GET",
        request: init.body ? JSON.parse(String(init.body)) : undefined,
        response: body,
        status_code: res.status,
        ok: res.ok,
        duration_ms: Date.now() - started,
      });
      if (res.status === 429) {
        throw new SupplierApiError("Printify rate limited", {
          retryable: true,
          statusCode: 429,
        });
      }
      if (!res.ok) {
        throw new SupplierApiError(
          `Printify ${res.status}: ${body?.message ?? text}`,
          { retryable: res.status >= 500, statusCode: res.status }
        );
      }
      return body as T;
    } catch (e) {
      if (e instanceof SupplierApiError) throw e;
      throw new SupplierApiError(`Printify request failed: ${(e as Error).message}`, {
        retryable: true,
      });
    }
  }

  async checkStock(items: StockCheckItem[]): Promise<StockCheckResult> {
    // Printify products are print-on-demand — effectively always in stock.
    if (this.ctx.sandbox) return { ok: true, unavailable: [] };
    return { ok: true, unavailable: [] };
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (this.ctx.sandbox) {
      return {
        supplierRef: `pfy_sbx_${input.idempotencyKey.replace(/[^a-z0-9]/gi, "")}`,
        shippingCost: 4.5,
        totalCost:
          4.5 + input.items.reduce((s, i) => s + i.quantity * 6, 0),
      };
    }
    const body = {
      external_id: input.idempotencyKey,
      label: `#${input.displayId}`,
      line_items: input.items.map((i) => ({
        product_id: i.supplier_product_id,
        variant_id: Number(i.supplier_variant_id),
        quantity: i.quantity,
      })),
      shipping_method: 1,
      send_shipping_notification: false,
      address_to: {
        first_name: input.address.first_name,
        last_name: input.address.last_name,
        email: input.address.email ?? "orders@example.com",
        phone: input.address.phone ?? "",
        country: input.address.country_code.toUpperCase(),
        region: input.address.province ?? "",
        address1: input.address.address_1,
        address2: input.address.address_2 ?? "",
        city: input.address.city,
        zip: input.address.postal_code,
      },
    };
    const created = await this.call<{ id: string }>(
      `/shops/${this.ctx.shopId}/orders.json`,
      { method: "POST", body: JSON.stringify(body) }
    );
    return { supplierRef: created.id };
  }

  async getOrder(supplierRef: string): Promise<GetOrderResult> {
    if (this.ctx.sandbox) {
      return {
        status: "shipped",
        shipments: [
          {
            tracking_number: `PFY${supplierRef.slice(-8).toUpperCase()}`,
            carrier: "USPS",
            url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=PFY${supplierRef.slice(-8).toUpperCase()}`,
            status: "shipped",
          },
        ],
      };
    }
    const o = await this.call<{
      status: string;
      shipments?: { carrier?: string; number?: string; url?: string }[];
    }>(`/shops/${this.ctx.shopId}/orders/${supplierRef}.json`);
    return {
      status: normaliseStatus(o.status),
      shipments: (o.shipments ?? []).map((s) => ({
        tracking_number: s.number,
        carrier: s.carrier,
        url: s.url,
        status: normaliseStatus(o.status),
      })),
    };
  }

  async cancelOrder(supplierRef: string): Promise<boolean> {
    if (this.ctx.sandbox) return true;
    try {
      await this.call(`/shops/${this.ctx.shopId}/orders/${supplierRef}/cancel.json`, {
        method: "POST",
      });
      return true;
    } catch {
      return false;
    }
  }
}
