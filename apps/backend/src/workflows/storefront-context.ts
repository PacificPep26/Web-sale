import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

const contextStep = createStep("storefront-channel-context", async (input: { channel_ids: string[] }, { container }) => {
  if (input.channel_ids.length !== 1) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "A storefront key must belong to exactly one sales channel")
  const query = container.resolve("query")
  const { data } = await query.graph({ entity: "sales_channel", fields: ["id", "name", "is_disabled"], filters: { id: input.channel_ids[0] } })
  if (!data[0] || data[0].is_disabled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Storefront unavailable")
  return new StepResponse({ sales_channel_id: data[0].id, name: data[0].name })
})

export const storefrontContextWorkflow = createWorkflow("storefront-context", (input: { channel_ids: string[] }) => new WorkflowResponse(contextStep(input)))
