import React from "react";
import ColorSwatch from "../ui/ColorSwatch";

export default function VariantSelector({
  product,
  selectedVariantIndex,
  selectedSize,
  selectedColor,
  onSelectVariant,
  onSelectSize,
  onSelectColor,
}) {
  if (!product) return null;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const activeVariant = product.variants[selectedVariantIndex] || product.variants[0];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Color</p>
            <span className="text-xs font-semibold text-[var(--nm-text)]">{activeVariant?.color || selectedColor || "-"}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((variant, index) => (
              <ColorSwatch
                key={`${variant.color || "variant"}-${index}`}
                color={variant.color || `var-${index}`}
                isSelected={selectedVariantIndex === index}
                onClick={() => onSelectVariant(index)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Size</p>
            <span className="text-xs font-semibold text-[var(--nm-text)]">{selectedSize || "Select"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(activeVariant?.sizes || []).map((entry) => {
              const disabled = Number(entry.stock || 0) <= 0;
              return (
                <button
                  key={entry.size}
                  type="button"
                  onClick={() => !disabled && onSelectSize(entry.size)}
                  disabled={disabled}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    selectedSize === entry.size
                      ? "border-[var(--nm-accent)] bg-[var(--nm-accent)] text-white shadow-[0_12px_24px_-18px_var(--nm-accent)]"
                      : "border-[var(--nm-border)] bg-[var(--nm-card)] hover:border-[var(--nm-accent)]"
                  } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {entry.size}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.isArray(product.sizes) && product.sizes.length > 0 ? (
        <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Size</p>
            <span className="text-xs font-semibold text-[var(--nm-text)]">{selectedSize || "Select"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  selectedSize === size
                    ? "border-[var(--nm-accent)] bg-[var(--nm-accent)] text-white shadow-[0_12px_24px_-18px_var(--nm-accent)]"
                    : "border-[var(--nm-border)] bg-[var(--nm-card)] hover:border-[var(--nm-accent)]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {Array.isArray(product.colors) && product.colors.length > 0 ? (
        <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Color</p>
            <span className="text-xs font-semibold text-[var(--nm-text)]">{selectedColor || "-"}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                isSelected={selectedColor === color}
                onClick={() => {
                  if (typeof onSelectColor === "function") onSelectColor(color);
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
