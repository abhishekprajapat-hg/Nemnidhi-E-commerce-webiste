// src/components/product/VariantSelector.jsx
import React from "react";
import ColorSwatch from "../ui/ColorSwatch";

export default function VariantSelector({
  product,
  selectedVariantIndex,
  selectedSize,
  onSelectVariant,
  onSelectSize,
}) {
  if (!product) return null;

  if (product?.variants && product.variants.length > 0) {
    return (
      <>
        <div>
          <div className="text-sm font-medium mb-2 dark:text-white">Color</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, idx) => (
              <ColorSwatch
                key={v.color + "-" + idx}
                color={v.color || `var-${idx}`}
                isSelected={selectedVariantIndex === idx}
                onClick={() => onSelectVariant(idx)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium mb-2 dark:text-white">Size</div>
          <div className="flex flex-wrap gap-2">
            {(product.variants[selectedVariantIndex]?.sizes || []).map((s) => {
              const disabled = Number(s.stock || 0) <= 0;
              return (
                <button
                  key={s.size}
                  onClick={() => !disabled && onSelectSize(s.size)}
                  className={`px-3 py-1.5 rounded border text-sm ${selectedSize === s.size ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:text-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={disabled}
                >
                  {s.size}
                  {disabled && <span className="ml-2 text-xs text-red-500">Out</span>}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Backwards compatibility
  return (
    <>
      {product.sizes?.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2 dark:text-white">Size</div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button key={s} onClick={() => onSelectSize(s)} className={`px-3 py-1.5 rounded border text-sm ${selectedSize === s ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 dark:text-gray-300"}`}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {product.colors?.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-2 dark:text-white">Color</div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => <ColorSwatch key={c} color={c} isSelected={c === product.selectedColor} onClick={() => onSelectVariant(c)} />)}
          </div>
        </div>
      )}
    </>
  );
}
