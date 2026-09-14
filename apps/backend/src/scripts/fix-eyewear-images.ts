import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

/**
 * Fixes eyewear products that were seeded with mismatched Unsplash photo ids
 * (showing shoes / headphones instead of glasses). Run:
 *   npm --workspace @dtc/backend exec medusa exec ./src/scripts/fix-eyewear-images.ts
 */

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=1400&q=80`;
const img2 = (a: string, b: string) => [{ url: U(a) }, { url: U(b) }];

// Only these 5 photo ids have been visually confirmed to actually show
// eyewear (several ids already in the codebase turned out to be wrong —
// e.g. 1546435770-a3e426bf472b is headphones, 1595950653106-6c9ebd614d3a
// is a sneaker). Do not add an id here without opening it and checking.
const AVIATOR_FACE = "1511499767150-a48a237f0083";
const CAT_EYE_PINK = "1508296695146-257a814070b4";
const TORTOISE_BOOK = "1574258495973-f010dfbb5371";
const BOAT = "1577803645773-f96470509666";
const BEACH = "1473496169904-658ba7c44d8a";

const FIXES: Record<string, { url: string }[]> = {
  "clubmaster-sunglasses": img2(TORTOISE_BOOK, AVIATOR_FACE),
  "cat-eye-sunglasses": img2(CAT_EYE_PINK, TORTOISE_BOOK),
  "blue-light-reading-glasses": img2(BOAT, TORTOISE_BOOK),
  "rimless-titanium-frames": img2(TORTOISE_BOOK, AVIATOR_FACE),
  "round-retro-sunglasses": img2(CAT_EYE_PINK, BEACH),
  "blue-light-filter-glasses": img2(TORTOISE_BOOK, BOAT),
};

export default async function fixEyewearImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: Object.keys(FIXES) },
  });

  if (!products.length) {
    logger.info("None of the target eyewear handles exist — nothing to fix.");
    return;
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: products.map((p: any) => ({
        id: p.id,
        images: FIXES[p.handle],
        thumbnail: FIXES[p.handle][0].url,
      })),
    },
  });

  logger.info(`Fixed images for: ${products.map((p: any) => p.handle).join(", ")}`);
}
