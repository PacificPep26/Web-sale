import type { HttpTypes } from "@medusajs/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
}: {
  products: HttpTypes.StoreProduct[];
}) {
  if (!products.length) {
    return (
      <p className="text-muted py-16 text-center">Nothing here yet.</p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
