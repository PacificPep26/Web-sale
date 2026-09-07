import { Module } from "@medusajs/framework/utils";
import SupplierOrderModuleService from "./service";

export const SUPPLIER_ORDER_MODULE = "supplierOrder";

export default Module(SUPPLIER_ORDER_MODULE, {
  service: SupplierOrderModuleService,
});
