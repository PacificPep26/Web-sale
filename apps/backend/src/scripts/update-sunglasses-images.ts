import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import sunglassesData from "./data/sunglasses-120.json";

type Row = { handle: string; image: string };

export default async function updateSunglassesImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const rows = sunglassesData as Row[];
  const imageByHandle = new Map(rows.map((r) => [r.handle, r.image]));

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail"],
  });

  const updates = existing
    .filter((p: any) => imageByHandle.has(p.handle))
    .map((p: any) => ({
      id: p.id,
      thumbnail: imageByHandle.get(p.handle),
      images: [{ url: imageByHandle.get(p.handle)! }],
    }));

  if (!updates.length) {
    logger.info("No matching sunglasses products found to update.");
    return;
  }

  await updateProductsWorkflow(container).run({
    input: {
      products: updates,
    },
  });

  logger.info(`Successfully updated images for ${updates.length} sunglasses products.`);
}
