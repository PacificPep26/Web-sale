import { Module } from "@medusajs/framework/utils";
import AdSpendModuleService from "./service";

export const AD_SPEND_MODULE = "adSpend";

export default Module(AD_SPEND_MODULE, {
  service: AdSpendModuleService,
});
