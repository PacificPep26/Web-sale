import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import SupplierOrderModule from "../modules/supplier-order";

export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: SupplierOrderModule.linkable.supplierOrder,
    isList: true,
  }
);
