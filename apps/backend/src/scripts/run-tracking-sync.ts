import { ExecArgs } from "@medusajs/framework/types";
import { syncSupplierTrackingWorkflow } from "../workflows/sync-supplier-tracking";

/** Manually run the tracking-sync workflow (normally a 30-min cron). */
export default async function runTrackingSync({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const { result } = await syncSupplierTrackingWorkflow(container).run({});
  logger.info(`tracking sync: ${JSON.stringify(result)}`);
}
