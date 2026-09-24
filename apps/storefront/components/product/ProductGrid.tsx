import type { HttpTypes } from "@medusajs/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: HttpTypes.StoreProduct[];
  priorityCount?: number;
}) {
  if (!products.length) {
    return (
      <p className="text-muted py-24 text-center text-sm uppercase tracking-[0.14em]">
        Nothing here yet
      </p>
    );
  }
  return (
    <div className="product-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-9 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
