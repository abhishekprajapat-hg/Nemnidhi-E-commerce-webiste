import React from "react";
import { Link } from "react-router-dom";
import Section from "./Section";
import { ProductCard, SkeletonProductCard } from "./ProductCard";

export default function ProductCarousel({
  title,
  subtitle = "Handpicked styles selected by our editors.",
  products = [],
  loading = false,
  onAddToCart,
  viewAllTo = "/products",
}) {
  return (
    <Section className="pt-8 sm:pt-10">
      <div className="nm-shell">
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
              Fresh Picks
            </p>
            <h2 className="nm-display mt-2 text-[clamp(1.9rem,8vw,3.2rem)] font-semibold leading-[1.02]">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--nm-muted)] sm:text-base">{subtitle}</p>
          </div>

          <Link to={viewAllTo} className="hidden text-sm font-semibold text-[var(--nm-accent-strong)] sm:block">
            View all
          </Link>
        </div>

        {loading ? (
          <>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar sm:hidden">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonProductCard key={`m-skeleton-${idx}`} className="min-w-[74%] snap-start" />
              ))}
            </div>

            <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonProductCard key={`d-skeleton-${idx}`} />
              ))}
            </div>
          </>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-6 py-12 text-center text-[var(--nm-muted)]">
            No products available right now.
          </div>
        ) : (
          <>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 no-scrollbar sm:hidden">
              {products.map((product) => (
                <ProductCard
                  key={`mobile-${product?._id || product?.slug}`}
                  p={product}
                  onAddToCart={onAddToCart}
                  className="min-w-[74%] snap-start"
                />
              ))}
            </div>

            <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={`desktop-${product?._id || product?.slug}`}
                  p={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
