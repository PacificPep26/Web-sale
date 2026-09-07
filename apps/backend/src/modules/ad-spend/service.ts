import { MedusaService } from "@medusajs/framework/utils";
import { AdSpend } from "./models/ad-spend";

class AdSpendModuleService extends MedusaService({ AdSpend }) {
  async sumByRange(from: string, to: string, salesChannelId?: string) {
    const rows = await this.listAdSpends({
      date: { $gte: from, $lte: to },
      ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
    });
    return rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  }
}

export default AdSpendModuleService;
