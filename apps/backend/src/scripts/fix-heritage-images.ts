import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Swaps the Heritage Square Sunglasses gallery to lead with the AI-generated
 * straight-on front shot (better for both the PDP gallery and the try-on
 * cutout), keeping the original artistic photos as secondary angles. Run:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/fix-heritage-images.ts
 */

const IMAGES = [
  { url: "/tryon/anh2-front-ai.jpg" },
  { url: "/tryon/frame-01-front.png" },
  { url: "/tryon/frame-01-angle.png" },
  { url: "/tryon/frame-01-side.png" },
];

export default async function fixHeritageImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: "heritage-square-sunglasses" },
  });

  if (!products.length) {
    logger.info("heritage-square-sunglasses not found — nothing to fix.");
    return;
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: products.map((p: any) => ({
        id: p.id,
        images: IMAGES,
        thumbnail: IMAGES[0].url,
      })),
    },
  });

  logger.info("Updated heritage-square-sunglasses gallery.");
}
