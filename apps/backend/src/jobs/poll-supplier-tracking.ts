import type { MedusaContainer } from "@medusajs/framework/types";
import { syncSupplierTrackingWorkflow } from "../workflows/sync-supplier-tracking";

export default async function pollSupplierTracking(container: MedusaContainer) {
  const logger = container.resolve("logger");
  const { result } = await syncSupplierTrackingWorkflow(container).run({});
  logger.info(
    `[job:poll-tracking] checked ${(result as any).checked}, updated ${(result as any).updated}`
  );
}

export const config = {
  name: "poll-supplier-tracking",
  schedule: "*/30 * * * *",
};
