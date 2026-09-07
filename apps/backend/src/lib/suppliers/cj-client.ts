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
  email: string;
  apiKey: string;
  sandbox?: boolean;
  /** cache hooks so the access token survives across calls */
  getToken?: () => Promise<string | null>;
  setToken?: (token: string, ttlSeconds: number) => Promise<void>;
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

const BASE = "https://developers.cjdropshipping.com/api2.0/v1";

function normaliseStatus(s?: string): string {
  const v = (s ?? "").toLowerCase();
  if (v.includes("cancel")) return "cancelled";
  if (v.includes("deliver")) return "delivered";
  if (v.includes("ship") || v.includes("fulfil")) return "shipped";
  if (v.includes("pend") || v.includes("process") || v.includes("creat")) return "processing";
  return v || "unknown";
}

export class CjClient implements SupplierClient {
  readonly type = "cj" as const;
  constructor(private ctx: Ctx) {}

  private async authToken(): Promise<string> {
    const cached = await this.ctx.getToken?.();
    if (cached) return cached;
    const started = Date.now();
    const res = await fetch(`${BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.ctx.email, password: this.ctx.apiKey }),
    });
    const body = await res.json().catch(() => ({}));
    await this.ctx.onLog?.({
      endpoint: "/authentication/getAccessToken",
      method: "POST",
      response: { code: body?.code, message: body?.message },
      status_code: res.status,
      ok: res.ok && body?.result === true,
      duration_ms: Date.now() - started,
    });
    const token = body?.data?.accessToken as string | undefined;
    if (!token) {
      throw new SupplierApiError(`CJ auth failed: ${body?.message ?? res.status}`, {
        retryable: res.status >= 500,
        statusCode: res.status,
      });
    }
    await this.ctx.setToken?.(token, 60 * 60 * 24); // CJ tokens last ~15 days; refresh daily
    return token;
  }

  private async call<T>(
    path: string,
    init: RequestInit = {},
    retryOn401 = true
  ): Promise<T> {
    const token = await this.authToken();
    const started = Date.now();
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    await this.ctx.onLog?.({
      endpoint: path,
      method: init.method ?? "GET",
      request: init.body ? JSON.parse(String(init.body)) : undefined,
      response: { code: body?.code, message: body?.message, result: body?.result },
      status_code: res.status,
      ok: res.ok && body?.result === true,
      duration_ms: Date.now() - started,
    });
    if (res.status === 401 && retryOn401) {
      await this.ctx.setToken?.("", 0);
      return this.call<T>(path, init, false);
    }
    if (!res.ok || body?.result === false) {
      throw new SupplierApiError(`CJ ${path}: ${body?.message ?? res.status}`, {
        retryable: res.status === 429 || res.status >= 500,
        statusCode: res.status,
      });
    }
    return body.data as T;
  }

  async checkStock(items: StockCheckItem[]): Promise<StockCheckResult> {
    if (this.ctx.sandbox) {
      const unavailable = items
        .filter((i) => (i.supplier_variant_id ?? "").includes("OOS"))
        .map((i) => i.supplier_variant_id!);
      return { ok: unavailable.length === 0, unavailable };
    }
    const unavailable: string[] = [];
    for (const it of items) {
      if (!it.supplier_variant_id) continue;
      try {
        const data = await this.call<{ variantStandardList?: { storageNum?: number }[] }>(
          `/product/stock/queryByVid?vid=${encodeURIComponent(it.supplier_variant_id)}`
        );
        const total = (data.variantStandardList ?? []).reduce(
          (s, v) => s + (v.storageNum ?? 0),
          0
        );
        if (total < it.quantity) unavailable.push(it.supplier_variant_id);
      } catch {
        unavailable.push(it.supplier_variant_id);
      }
    }
    return { ok: unavailable.length === 0, unavailable };
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (this.ctx.sandbox) {
      return {
        supplierRef: `CJ_SBX_${String(input.displayId)}`,
        shippingCost: 3.2,
        totalCost: 3.2 + input.items.reduce((s, i) => s + i.quantity * 4.5, 0),
      };
    }
    const data = await this.call<{ orderId: string; orderNum: string }>(
      `/shopping/order/createOrderV2`,
      {
        method: "POST",
        body: JSON.stringify({
          orderNumber: input.idempotencyKey,
          shippingZip: input.address.postal_code,
          shippingCountryCode: input.address.country_code.toUpperCase(),
          shippingProvince: input.address.province ?? "",
          shippingCity: input.address.city,
          shippingAddress: [input.address.address_1, input.address.address_2]
            .filter(Boolean)
            .join(", "),
          shippingCustomerName: `${input.address.first_name} ${input.address.last_name}`,
          shippingPhone: input.address.phone ?? "",
          fromCountryCode: "US",
          logisticName: "USPS+",
          products: input.items.map((i) => ({
            vid: i.supplier_variant_id,
            quantity: i.quantity,
          })),
        }),
      }
    );
    return { supplierRef: data.orderId ?? data.orderNum };
  }

  async getOrder(supplierRef: string): Promise<GetOrderResult> {
    if (this.ctx.sandbox) {
      return {
        status: "shipped",
        shipments: [
          {
            tracking_number: `CJ${supplierRef.slice(-9)}`,
            carrier: "USPS+",
            status: "shipped",
          },
        ],
      };
    }
    const data = await this.call<{
      orderStatus?: string;
      trackNumber?: string;
      logisticName?: string;
    }>(`/shopping/order/getOrderDetail?orderId=${encodeURIComponent(supplierRef)}`);
    return {
      status: normaliseStatus(data.orderStatus),
      shipments: data.trackNumber
        ? [
            {
              tracking_number: data.trackNumber,
              carrier: data.logisticName,
              status: normaliseStatus(data.orderStatus),
            },
          ]
        : [],
    };
  }

  async cancelOrder(supplierRef: string): Promise<boolean> {
    if (this.ctx.sandbox) return true;
    try {
      await this.call(`/shopping/order/deleteOrder?orderId=${encodeURIComponent(supplierRef)}`, {
        method: "DELETE",
      });
      return true;
    } catch {
      return false;
    }
  }
}
