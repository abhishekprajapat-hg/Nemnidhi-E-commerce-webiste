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
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Color</p>
          <div className="flex flex-wrap gap-2">
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

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Size</p>
          <div className="flex flex-wrap gap-2">
            {(activeVariant?.sizes || []).map((entry) => {
              const disabled = Number(entry.stock || 0) <= 0;
              return (
                <button
                  key={entry.size}
                  type="button"
                  onClick={() => !disabled && onSelectSize(entry.size)}
                  disabled={disabled}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    selectedSize === entry.size
                      ? "border-[var(--nm-accent)] bg-[var(--nm-accent)] text-white"
                      : "border-[var(--nm-border)] bg-[var(--nm-surface)] hover:border-[var(--nm-accent)]"
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
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSelectSize(size)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  selectedSize === size
                    ? "border-[var(--nm-accent)] bg-[var(--nm-accent)] text-white"
                    : "border-[var(--nm-border)] bg-[var(--nm-surface)] hover:border-[var(--nm-accent)]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {Array.isArray(product.colors) && product.colors.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Color</p>
          <div className="flex flex-wrap gap-2">
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
