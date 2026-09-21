import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { storefrontContextWorkflow } from "../../../workflows/storefront-context"

export async function GET(req: MedusaRequest & { publishable_key_context?: { sales_channel_ids: string[] } }, res: MedusaResponse) {
  const { result } = await storefrontContextWorkflow(req.scope).run({ input: { channel_ids: req.publishable_key_context?.sales_channel_ids ?? [] } })
  res.json(result)
}
