import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModule = req.scope.resolve(Modules.PRICING)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "variants.id",
      "variants.price_set.id",
      "variants.price_set.prices.id",
      "variants.price_set.prices.currency_code",
      "variants.price_set.prices.amount"
    ],
  })

  const chromeHeartsProducts = products.filter(
    (p: any) =>
      p.handle.toLowerCase().includes("chrome-hearts") ||
      p.title.toLowerCase().includes("chrome hearts")
  )

  let updatedCount = 0

  for (const product of chromeHeartsProducts) {
    for (const variant of product.variants || []) {
      const priceSet = variant.price_set
      if (priceSet?.id) {
        const usdPrice = priceSet.prices?.find((p: any) => p.currency_code === "usd")
        if (usdPrice) {
          await pricingModule.updatePrices([
            {
              id: usdPrice.id,
              amount: 450,
            },
          ])
          updatedCount++
        } else {
          await pricingModule.addPrices([
            {
              price_set_id: priceSet.id,
              prices: [{ amount: 450, currency_code: "usd" }],
            },
          ])
          updatedCount++
        }
      }
    }
  }

  res.json({
    success: true,
    message: `Updated ${updatedCount} Chrome Hearts variant prices to $450 USD`,
    productsCount: chromeHeartsProducts.length,
  })
}
