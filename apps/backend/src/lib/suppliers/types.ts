export type SupplierType = "cj" | "printify" | "manual";

export type StockCheckItem = {
  supplier_sku?: string | null;
  supplier_variant_id?: string | null;
  supplier_product_id?: string | null;
  quantity: number;
};

export type StockCheckResult = {
  ok: boolean;
  /** identifiers (sku/vid) that are out of stock or unknown */
  unavailable: string[];
};

export type CreateOrderItem = {
  supplier_sku?: string | null;
  supplier_variant_id?: string | null;
  supplier_product_id?: string | null;
  quantity: number;
};

export type CreateOrderInput = {
  /** our idempotency key — MUST be passed to the supplier as external ref */
  idempotencyKey: string;
  displayId: string | number;
  items: CreateOrderItem[];
  address: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string | null;
    city: string;
    province?: string | null;
    postal_code: string;
    country_code: string;
    phone?: string | null;
    email?: string | null;
  };
};

export type CreateOrderResult = {
  supplierRef: string;
  shippingCost?: number;
  totalCost?: number;
};

export type SupplierShipmentInfo = {
  tracking_number?: string | null;
  carrier?: string | null;
  url?: string | null;
  status?: string | null;
};

export type GetOrderResult = {
  /** normalised: pending | processing | shipped | delivered | cancelled | unknown */
  status: string;
  shipments: SupplierShipmentInfo[];
};

export class SupplierApiError extends Error {
  retryable: boolean;
  statusCode?: number;
  constructor(message: string, opts?: { retryable?: boolean; statusCode?: number }) {
    super(message);
    this.name = "SupplierApiError";
    this.retryable = opts?.retryable ?? false;
    this.statusCode = opts?.statusCode;
  }
}

/** thrown by the manual client so the workflow leaves the order `ready` */
export class ManualFulfilmentRequired extends Error {
  constructor() {
    super("manual_fulfilment_required");
    this.name = "ManualFulfilmentRequired";
  }
}

export interface SupplierClient {
  readonly type: SupplierType;
  checkStock(items: StockCheckItem[]): Promise<StockCheckResult>;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  getOrder(supplierRef: string): Promise<GetOrderResult>;
  cancelOrder(supplierRef: string): Promise<boolean>;
}
