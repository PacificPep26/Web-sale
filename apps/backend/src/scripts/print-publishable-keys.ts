import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Prints each sales channel and its publishable API key(s), in .env format.
 *
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/print-publishable-keys.ts
 */
export default async function printPublishableKeys({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type", "sales_channels.id", "sales_channels.name"],
  });

  const publishable = apiKeys.filter((k: { type: string }) => k.type === "publishable");

  logger.info("──────────────────────────────────────────────────────────────");
  for (const k of publishable) {
    const channel = k.sales_channels?.[0]?.name ?? "unlinked";
    const envName = channel.toLowerCase().replace(/[^a-z0-9]+/g, "_").toUpperCase();
    logger.info(`# ${k.title}  →  sales channel: ${channel}`);
    logger.info(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY_${envName}=${k.token}`);
  }
  logger.info("──────────────────────────────────────────────────────────────");
}
