// src/utils/productHelpers.js
export const deriveImagesFromProduct = (product, selectedVariantIndex) => {
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant && Array.isArray(variant.images) && variant.images.length > 0) {
      return variant.images.filter(Boolean);
    }
  }

  const imgs = Array.isArray(product?.images) && product.images.length
    ? product.images
    : product?.image
      ? [product.image]
      : [];
  if (imgs.length === 0) return ["/placeholder.png"];
  return imgs.filter(Boolean);
};

export const derivePriceFromProduct = (product, selectedVariantIndex, selectedSize) => {
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant?.sizes && variant.sizes.length > 0) {
      const sObj = (selectedSize && variant.sizes.find((s) => s.size === selectedSize)) || variant.sizes[0];
      if (sObj && typeof sObj.price === "number") return Number(sObj.price);
    }
  }
  return Number(product?.price || 0);
};

export const deriveStockFromProduct = (product, selectedVariantIndex, selectedSize) => {
  if (product?.variants && product.variants.length > 0) {
    const variant = product.variants[selectedVariantIndex ?? 0] || product.variants[0];
    if (variant?.sizes && variant.sizes.length > 0) {
      const sObj = (selectedSize && variant.sizes.find((s) => s.size === selectedSize)) || variant.sizes[0];
      if (sObj && typeof sObj.stock === "number") return Number(sObj.stock);
    }
    const total = variant?.sizes?.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);
    if (typeof total === "number") return total;
  }
  return Number(product?.countInStock || 0);
};
