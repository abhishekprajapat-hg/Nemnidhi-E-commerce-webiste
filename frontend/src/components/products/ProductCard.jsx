import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import deriveThumbnail from "./helpers/deriveThumbnail";
import derivePrice from "./helpers/derivePrice";
import deriveTotalStock from "./helpers/deriveTotalStock";

const cssColorCache = new Map();

function getInitialSelectedColor(product) {
  if (Array.isArray(product?.variants) && product.variants[0]?.color) {
    return product.variants[0].color;
  }
  if (Array.isArray(product?.colors) && product.colors.length) {
    return product.colors[0];
  }
  return "";
}

function computeVariantStock(variant) {
  if (!variant) return 0;
  if (Array.isArray(variant.sizes)) {
    return variant.sizes.reduce((acc, sizeObj) => acc + Number(sizeObj.stock || 0), 0);
  }
  return Number(variant.countInStock || 0);
}

function isCssColor(value) {
  const color = String(value || "").trim().toLowerCase();
  if (!color) return false;
  if (cssColorCache.has(color)) return cssColorCache.get(color);

  let isValid = false;
  try {
    const style = document.createElement("span").style;
    style.color = color;
    isValid = Boolean(style.color);
  } catch {
    isValid = false;
  }

  cssColorCache.set(color, isValid);
  return isValid;
}

const ProductCard = memo(function ProductCard({ product }) {
  const defaultThumb = useMemo(() => deriveThumbnail(product), [product]);
  const price = useMemo(() => derivePrice(product), [product]);
  const totalStock = useMemo(() => deriveTotalStock(product), [product]);
  const [selectedColor, setSelectedColor] = useState(() => getInitialSelectedColor(product));

  const colorMeta = useMemo(() => {
    const seen = new Set();
    const variantsByColor = new Map();

    if (Array.isArray(product?.variants)) {
      product.variants.forEach((variant) => {
        const color = String(variant?.color || "").trim();
        if (!color) return;
        if (!variantsByColor.has(color)) {
          variantsByColor.set(color, variant);
        }
        seen.add(color);
      });
    }

    if (Array.isArray(product?.colors)) {
      product.colors.forEach((color) => {
        const normalized = String(color || "").trim();
        if (normalized) seen.add(normalized);
      });
    }

    return Array.from(seen).map((color) => {
      const variant = variantsByColor.get(color);
      const stock = computeVariantStock(variant);
      let thumb = defaultThumb;

      if (variant) {
        if (Array.isArray(variant.images) && variant.images.length > 0) {
          thumb = variant.images[0];
        } else {
          thumb = variant.image || variant.img || defaultThumb;
        }
      }

      return { color, stock, thumb };
    });
  }, [product, defaultThumb]);

  const selectedColorMeta = useMemo(
    () => colorMeta.find((entry) => entry.color === selectedColor),
    [colorMeta, selectedColor]
  );

  const effectiveThumb = selectedColorMeta?.thumb || defaultThumb;
  const outOfStock = Number(totalStock) <= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] shadow-lg shadow-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:shadow-black/20">
      <Link
        to={`/product/${product._id}`}
        className="block"
        aria-label={`View ${product.title}`}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--nm-bg-elevated)]">
          <img
            src={effectiveThumb}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-[center_22%] sm:object-center transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.png";
            }}
          />

          {outOfStock && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-[var(--nm-text)] sm:text-base">
            {product.title}
          </h3>
        </Link>

        <p className="mt-1 text-sm font-semibold text-[var(--nm-accent-strong)]">
          Rs {Number(price || 0).toFixed(2)}
        </p>

        {product.numReviews > 0 && product.rating ? (
          <p className="mt-1 text-xs uppercase tracking-[0.11em] text-[var(--nm-muted)]">
            Rating {Number(product.rating).toFixed(1)} ({product.numReviews})
          </p>
        ) : (
          <p className="mt-1 text-xs uppercase tracking-[0.11em] text-[var(--nm-muted)]">
            Newly Added
          </p>
        )}

        {colorMeta.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {colorMeta.map(({ color, stock }) => {
              const disabled = stock <= 0;
              const active = selectedColor === color;

              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${color}${disabled ? " - Out of stock" : ""}`}
                  title={color}
                  disabled={disabled}
                  onClick={(event) => {
                    event.preventDefault();
                    setSelectedColor((prev) => (prev === color ? "" : color));
                  }}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                    active
                      ? "border-[var(--nm-accent)] ring-2 ring-[var(--nm-accent-soft)]"
                      : "border-[var(--nm-border)]"
                  } ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-[var(--nm-accent)]"}`}
                >
                  <span
                    className="h-[1.125rem] w-[1.125rem] rounded-full border border-black/10"
                    style={{
                      backgroundColor: isCssColor(color) ? color : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
});

export default ProductCard;
