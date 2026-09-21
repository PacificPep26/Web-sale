import "server-only"
import { unstable_cache } from "next/cache"
import { sdk } from "@/lib/medusa"
import { NICHE } from "@/lib/config"

export const getStorefrontChannel = unstable_cache(async () => {
  const context = await sdk.client.fetch<{ sales_channel_id: string; name: string }>("/store/channel-context", { cache: "no-store" })
  if (context.name.toLowerCase() !== NICHE) throw new Error("Storefront sales channel is not configured correctly")
  return context.sales_channel_id
}, ["storefront-channel", NICHE], { revalidate: 60 })
