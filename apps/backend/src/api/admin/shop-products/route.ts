import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { resolveAdminProductThumbnail } from "./utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "description"],
  });

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "status",
      "sales_channels.id",
      "sales_channels.name",
    ],
  });

  res.json({
    sales_channels: salesChannels ?? [],
    products: (products ?? []).map((product) => ({
      ...product,
      thumbnail: resolveAdminProductThumbnail(product.thumbnail),
    })),
  });
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const body = req.body as {
    product_ids?: string[];
    sales_channel_id?: string;
    action?: "add" | "remove";
  };

  const { product_ids, sales_channel_id, action } = body;

  if (!product_ids?.length || !sales_channel_id || !action) {
    res.status(400).json({
      message: "Missing required fields: product_ids, sales_channel_id, and action ('add' | 'remove')",
    });
    return;
  }

  const links = product_ids.map((productId) => ({
    [Modules.PRODUCT]: { product_id: productId },
    [Modules.SALES_CHANNEL]: { sales_channel_id: sales_channel_id },
  }));

  if (action === "add") {
    await link.create(links);
  } else if (action === "remove") {
    await link.dismiss(links);
  } else {
    res.status(400).json({ message: "Invalid action. Must be 'add' or 'remove'" });
    return;
  }

  res.json({ success: true, count: product_ids.length });
};
