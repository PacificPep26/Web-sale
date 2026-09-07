import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleRefundReturnWorkflow } from "../../../../../workflows/handle-refund-return";

/**
 * Reconcile the dropship side of a refund/cancel that was done in the core Admin:
 * cancels supplier orders where possible, records losses where already shipped,
 * notifies the customer. Does not itself move money.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as { refunded_amount?: number };
  const { result } = await handleRefundReturnWorkflow(req.scope).run({
    input: { orderId: req.params.id, refundedAmount: body?.refunded_amount },
  });
  res.json(result);
};
