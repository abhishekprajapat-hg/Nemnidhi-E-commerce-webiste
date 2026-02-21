import React from "react";
import ProductHeader from "./ProductHeader";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";
import AddToCartButtons from "./AddToCartButtons";
import ProductAccordions from "./ProductAccordions";

export default function ProductInfoPanel({
  product,
  currentPrice,
  currentStock,
  inStock,
  selectedVariantIndex,
  selectedSize,
  selectedColor,
  onSelectVariant,
  onSelectSize,
  onSelectColor,
  qty,
  setQty,
  onAdd,
  onBuyNow,
}) {
  const normalizedStock = Math.max(0, Number(currentStock || 0));
  const variantList = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariant =
    variantList.length > 0 && selectedVariantIndex >= 0 ? variantList[selectedVariantIndex] || null : null;
  const selectedColorLabel = String(activeVariant?.color || selectedColor || "Default");
  const selectedSizeLabel = selectedSize || "Select";

  return (
    <aside className="order-2 md:col-span-1 lg:col-span-5">
      <div className="pd-info-panel space-y-5 rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6 lg:sticky lg:top-24">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
            Curated Edit
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              inStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
            }`}
          >
            {inStock ? `${normalizedStock} In Stock` : "Unavailable"}
          </span>
        </div>

        <ProductHeader
          title={product.title}
          category={product.category}
          price={currentPrice}
          rating={product.rating}
          numReviews={product.numReviews}
        />

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Color</p>
            <p className="mt-1 truncate text-sm font-semibold">{selectedColorLabel}</p>
          </div>
          <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Size</p>
            <p className="mt-1 truncate text-sm font-semibold">{selectedSizeLabel}</p>
          </div>
          <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Price</p>
            <p className="mt-1 truncate text-sm font-semibold">Rs {Number(currentPrice || 0).toFixed(0)}</p>
          </div>
        </div>

        <VariantSelector
          product={product}
          selectedVariantIndex={selectedVariantIndex}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSelectVariant={onSelectVariant}
          onSelectSize={onSelectSize}
          onSelectColor={onSelectColor}
        />

        <QuantitySelector
          qty={qty}
          setQty={setQty}
          currentStock={currentStock}
          inStock={inStock}
        />

        <AddToCartButtons inStock={inStock} onAdd={onAdd} onBuyNow={onBuyNow} />

        <ProductAccordions sizeChart={product.sizeChart} />

        <div className="grid gap-2 text-xs text-[var(--nm-muted)] sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-2.5 py-2 text-center">
            7-day exchange
          </div>
          <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-2.5 py-2 text-center">
            Secure checkout
          </div>
          <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-2.5 py-2 text-center">
            Fast dispatch
          </div>
        </div>
      </div>
    </aside>
  );
}
