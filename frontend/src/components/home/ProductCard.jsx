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
        Array.isArray(variant?.sizes) ? variant.sizes.map((size) => Number(size?.price || 0)) : []
      )
    : [];

  if (variantPrices.length > 0) return Math.min(...variantPrices);
  return Number(product?.price || 0);
}

function getStock(product) {
  const variantStocks = Array.isArray(product?.variants)
    ? product.variants.flatMap((variant) =>
        Array.isArray(variant?.sizes) ? variant.sizes.map((size) => Number(size?.stock || 0)) : []
      )
    : [];

  if (variantStocks.length > 0) return variantStocks.reduce((sum, stock) => sum + stock, 0);
  return Number(product?.countInStock || 0);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function ProductCard({ p, onAddToCart, className = "" }) {
  const slides = useMemo(() => getSlides(p), [p]);
  const price = useMemo(() => getPrice(p), [p]);
  const totalStock = useMemo(() => getStock(p), [p]);
  const [activeIndex, setActiveIndex] = useState(0);

  const productId = p?._id || p?.slug || "";
  const isInStock = totalStock > 0;

  return (
    <article
      className={`group overflow-hidden rounded-[1.5rem] border border-[var(--nm-border)] bg-[var(--nm-card)] shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}
    >
      <Link to={`/product/${productId}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--nm-bg-elevated)]">
          <img
            src={slides[activeIndex]}
            alt={p?.title || p?.name || "Product image"}
            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

          <span className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
            {isInStock ? "Ready to Ship" : "Out of Stock"}
          </span>

          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-2 py-1 backdrop-blur">
              {slides.slice(0, 5).map((_, idx) => (
                <button
                  key={`${productId}-dot-${idx}`}
                  type="button"
                  aria-label={`Select image ${idx + 1}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition ${
                    idx === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <Link to={`/product/${productId}`} className="block">
          <h3
            className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-[var(--nm-text)] sm:text-base"
            title={p?.title || p?.name}
          >
            {p?.title || p?.name || "Product"}
          </h3>
        </Link>

        <div className="flex items-end justify-between gap-3">
          <p className="text-base font-semibold text-[var(--nm-accent-strong)]">Rs {formatPrice(price)}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--nm-muted)]">
            {isInStock ? "Available" : "Sold Out"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddToCart?.(p)}
          disabled={!isInStock}
          className="w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-text)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isInStock ? "Add to Cart" : "Notify Me"}
        </button>
      </div>
    </article>
  );
}

export function SkeletonProductCard({ className = "" }) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border border-[var(--nm-border)] bg-[var(--nm-card)] animate-pulse ${className}`}>
      <div className="aspect-[3/4] bg-[var(--nm-bg-elevated)]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-4 w-1/3 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-10 w-full rounded-full bg-[var(--nm-bg-elevated)]" />
      </div>
    </div>
  );
}
