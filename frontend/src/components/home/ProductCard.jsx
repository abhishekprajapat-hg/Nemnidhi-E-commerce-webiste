import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function getSlides(product) {
  const fromVariants = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) => (Array.isArray(variant.images) ? variant.images : []))
    : [];

  if (fromVariants.length > 0) return fromVariants;
  if (Array.isArray(product?.images) && product.images.length > 0) return product.images;
  if (product?.image) return [product.image];
  return ["/placeholder.png"];
}

function getPrice(product) {
  const variantPrices = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) =>
        Array.isArray(variant?.sizes)
          ? variant.sizes.map((size) => Number(size?.price || 0))
          : []
      )
    : [];

  if (variantPrices.length > 0) return Math.min(...variantPrices);
  return Number(product?.price || 0);
}

export function ProductCard({ p, onAddToCart, className = "" }) {
  const slides = useMemo(() => getSlides(p), [p]);
  const price = useMemo(() => getPrice(p), [p]);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <article
      className={`group overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:shadow-black/20 ${className}`}
    >
      <Link to={`/product/${p?._id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--nm-bg-elevated)]">
          <img
            src={slides[activeIndex]}
            alt={p?.title || p?.name || "Product image"}
            className="h-full w-full object-cover object-[center_22%] sm:object-center transition duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />

          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur">
              {slides.slice(0, 5).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Select image ${idx + 1}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition ${
                    idx === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/55"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/product/${p?._id}`}>
          <h3
            className="line-clamp-1 text-sm font-semibold text-[var(--nm-text)] sm:text-base"
            title={p?.title || p?.name}
          >
            {p?.title || p?.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--nm-accent-strong)]">Rs {price.toFixed(2)}</p>
          <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--nm-muted)]">
            Ready to Ship
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddToCart?.(p)}
          className="mt-4 w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
        >
          Add to Cart
        </button>
      </div>
    </article>
  );
}

export function SkeletonProductCard({ className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] animate-pulse ${className}`}
    >
      <div className="aspect-[4/5] bg-[var(--nm-bg-elevated)]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-4 w-1/3 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-9 w-full rounded-full bg-[var(--nm-bg-elevated)]" />
      </div>
    </div>
  );
}
