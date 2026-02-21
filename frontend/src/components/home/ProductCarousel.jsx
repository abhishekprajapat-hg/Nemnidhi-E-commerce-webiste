import React from "react";
import Section from "./Section";
import { ProductCard, SkeletonProductCard } from "./ProductCard";

export default function ProductCarousel({ title, products, loading, onAddToCart }) {
  return (
    <Section className="pb-6 sm:pb-8">
      <div className="nm-shell">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">{title}</h2>
          <p className="hidden text-sm text-[var(--nm-muted)] md:block">
            Fresh drops updated every week.
          </p>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonProductCard key={idx} className="min-w-[15.5rem] sm:min-w-[18rem]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-12 text-center text-[var(--nm-muted)]">
            No new arrivals found.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:gap-5">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                p={product}
                onAddToCart={onAddToCart}
                className="min-w-[15.5rem] sm:min-w-[18rem]"
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
