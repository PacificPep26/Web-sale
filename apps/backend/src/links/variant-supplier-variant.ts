import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import SupplierModule from "../modules/supplier";

export default defineLink(
  ProductModule.linkable.productVariant,
  {
    linkable: SupplierModule.linkable.supplierVariant,
    isList: true,
  }
);
