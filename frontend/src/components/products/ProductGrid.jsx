import React from "react";
import ProductCard from "./ProductCard";
import SkeletonCard from "./SkeletonCard";

export default function ProductGrid({ loading, items }) {
  if (loading)
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  if (items.length === 0)
    return (
      <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-14 text-center text-sm text-[var(--nm-muted)]">
        No products found.
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
