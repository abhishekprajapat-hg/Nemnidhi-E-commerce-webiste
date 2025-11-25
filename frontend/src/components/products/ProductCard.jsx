import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import deriveThumbnail from "./helpers/deriveThumbnail";
import derivePrice from "./helpers/derivePrice";
import deriveTotalStock from "./helpers/deriveTotalStock";

export default function ProductCard({ product }) {
  const defaultThumb = deriveThumbnail(product);
  const price = derivePrice(product);
  const totalStock = deriveTotalStock(product);

  const availableColors = useMemo(() => {
    const seen = new Set();
    const out = [];

    if (Array.isArray(product.colors)) {
      product.colors.forEach((c) => {
        if (c && !seen.has(c)) {
          seen.add(c);
          out.push(c);
        }
      });
    }

    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        const c = v?.color;
        if (c && !seen.has(c)) {
          seen.add(c);
          out.push(c);
        }
      });
    }

    return out;
  }, [product]);

  const findVariantByColor = (color) => {
    if (!Array.isArray(product.variants)) return undefined;
    return product.variants.find((v) => v?.color === color);
  };

  const getThumbForColor = (color) => {
    const variant = findVariantByColor(color);
    if (!variant) return defaultThumb;
    if (Array.isArray(variant.images) && variant.images.length) return variant.images[0];
    return variant.image || variant.img || defaultThumb;
  };

  const computeVariantStock = (variant) => {
    if (!variant) return 0;
    if (Array.isArray(variant.sizes)) {
      return variant.sizes.reduce((acc, s) => acc + Number(s.stock || 0), 0);
    }
    return Number(variant.countInStock || 0);
  };

  const [selectedColor, setSelectedColor] = useState(() => {
    if (Array.isArray(product.variants) && product.variants[0]?.color) {
      return product.variants[0].color;
    }
    if (Array.isArray(product.colors) && product.colors.length) {
      return product.colors[0];
    }
    return "";
  });

  const effectiveThumb = selectedColor ? getThumbForColor(selectedColor) : defaultThumb;

  return (
    <div className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-lg">
      <Link to={`/product/${product._id}`} className="block" aria-label={`View ${product.title}`}>
        <div className="relative">
          {/* Slightly shorter aspect ratio to save vertical space */}
          <div className="aspect-[3/4] bg-gray-100 dark:bg-zinc-700">
            <img
              src={effectiveThumb}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition"
            />
          </div>

          {Number(totalStock) <= 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
              Out of stock
            </span>
          )}
        </div>

        <div className="p-2.5">
          <div className="font-medium text-sm line-clamp-1 dark:text-white">{product.title}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">₹{Number(price || 0).toFixed(2)}</div>

          {product.numReviews > 0 && product.rating && (
            <div className="mt-1 text-xs text-yellow-600">★ {Number(product.rating).toFixed(1)} ({product.numReviews})</div>
          )}
        </div>
      </Link>

      {availableColors.length > 0 && (
        <div className="px-2.5 pb-2">
          <div className="flex items-center gap-2">
            {availableColors.map((c) => {
              const variant = findVariantByColor(c);
              const vStock = computeVariantStock(variant);
              const disabled = vStock <= 0;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedColor((prev) => (prev === c ? "" : c));
                  }}
                  className={`flex items-center justify-center w-7 h-7 rounded-full border focus:outline-none ${
                    selectedColor === c ? "ring-2 ring-offset-1" : ""
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  aria-pressed={selectedColor === c}
                  aria-label={`${c}${disabled ? " — Out of stock" : ""}`}
                  title={c}
                  disabled={disabled}
                >
                  <span
                    aria-hidden
                    className="w-5 h-5 rounded-full"
                    style={{
                      backgroundColor: isCssColor(c) ? c : "transparent",
                      border: isCssColor(c) ? undefined : "1px solid currentColor",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function isCssColor(str) {
  if (!str || typeof str !== "string") return false;
  try {
    const s = document.createElement("span").style;
    s.color = str;
    return !!s.color;
  } catch {
    return false;
  }
}
