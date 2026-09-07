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
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
