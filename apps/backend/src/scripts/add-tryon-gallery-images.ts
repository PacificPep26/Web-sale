import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import sunglassesData from "./data/sunglasses-120.json";

/**
 * Appends the Gemini-composited "model wearing these glasses" front-pose
 * photo (see apps/storefront/scripts/generate-victor-tryon.mjs, output in
 * apps/storefront/public/tryon/worn-victor/) as an extra gallery image on
 * each of the 120 sunglasses products — alongside the existing product
 * photo, not replacing it. Idempotent: skips a product whose images already
 * include the composite. Run:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/add-tryon-gallery-images.ts
 */

type Row = { handle: string };

export default async function addTryonGalleryImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const handles = new Set((sunglassesData as Row[]).map((r) => r.handle));

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "images.url"],
  });

  const updates = existing
    .filter((p: any) => handles.has(p.handle))
    .map((p: any) => {
      const tryOnUrl = `/tryon/worn-victor/${p.handle}-front.jpg`;
      const currentUrls: string[] = (p.images ?? []).map((i: any) => i.url);
      if (currentUrls.includes(tryOnUrl)) return null;
      return {
        id: p.id,
        images: [...currentUrls.map((url) => ({ url })), { url: tryOnUrl }],
      };
    })
    .filter((u: any): u is { id: string; images: { url: string }[] } => u !== null);

  if (!updates.length) {
    logger.info("No products need a try-on gallery image added (already applied or no matching handles).");
    return;
  }

  await updateProductsWorkflow(container).run({
    input: { products: updates },
  });

  logger.info(`Added try-on gallery image for ${updates.length} sunglasses products.`);
}
