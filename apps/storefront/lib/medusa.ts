import Medusa from "@medusajs/js-sdk";
import { MEDUSA_BACKEND_URL, PUBLISHABLE_KEY } from "./config";

/**
 * Server-side Medusa client. One publishable key per deploy (= per niche), so
 * every Store API call is automatically scoped to this niche's sales channel.
 */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  publishableKey: PUBLISHABLE_KEY,
  // storefront is trusted server-side; auth for customer sessions added later
});
