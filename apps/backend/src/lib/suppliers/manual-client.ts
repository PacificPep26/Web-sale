import {
  SupplierClient,
  StockCheckItem,
  StockCheckResult,
  CreateOrderInput,
  CreateOrderResult,
  GetOrderResult,
  ManualFulfilmentRequired,
} from "./types";

/** No API. Orders are placed by a human via the Admin widget. */
export class ManualClient implements SupplierClient {
  readonly type = "manual" as const;

  async checkStock(_items: StockCheckItem[]): Promise<StockCheckResult> {
    return { ok: true, unavailable: [] };
  }
  async createOrder(_input: CreateOrderInput): Promise<CreateOrderResult> {
    throw new ManualFulfilmentRequired();
  }
  async getOrder(_ref: string): Promise<GetOrderResult> {
    return { status: "unknown", shipments: [] };
  }
  async cancelOrder(_ref: string): Promise<boolean> {
    return true;
  }
}
