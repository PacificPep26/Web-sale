import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Inspects all regions and ensures pp_stripe_stripe is added to their payment_providers.
 *
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/enable-stripe-region.ts
 */
export default async function enableStripeRegion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const regionModule = container.resolve(Modules.REGION);

  const regions = await regionModule.listRegions({}, { relations: ["payment_providers"] });
  logger.info(`Found ${regions.length} region(s).`);

  for (const r of regions) {
    const currentProviders = (r.payment_providers || []).map((p: { id: string }) => p.id);
    logger.info(`Region: ${r.name} (${r.id}) - Current providers: ${currentProviders.join(", ")}`);

    if (!currentProviders.includes("pp_stripe_stripe")) {
      logger.info(`Adding pp_stripe_stripe to region ${r.name}...`);
      const newProviders = [...currentProviders, "pp_stripe_stripe"];
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: r.id },
          update: {
            payment_providers: newProviders,
          },
        },
      });
      logger.info(`Successfully added pp_stripe_stripe to ${r.name}!`);
    } else {
      logger.info(`Region ${r.name} already has pp_stripe_stripe.`);
    }
  }
}

