// src/components/admin/products/productHelpers.js

export function deriveThumbnail(product) {
  if (!product) return "/placeholder.png";
  if (Array.isArray(product.variants)) {
    for (const v of product.variants) {
      if (Array.isArray(v.images) && v.images.length) return v.images[0];
    }
  }
  if (Array.isArray(product.images) && product.images.length) return product.images[0];
  if (product.image) return product.image;
  return "/placeholder.png";
}

export function deriveTotalStock(product) {
  if (!product) return 0;
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.reduce((pv, v) => {
      const sizesSum = Array.isArray(v.sizes)
        ? v.sizes.reduce((sa, s) => sa + (Number(s.stock) || 0), 0)
        : 0;
      return pv + sizesSum;
    }, 0);
  }
  return Number(product.countInStock || 0);
}

export function derivePrice(product) {
  if (!product) return 0;
  if (Array.isArray(product.variants) && product.variants.length) {
    for (const v of product.variants) {
      if (Array.isArray(v.sizes) && v.sizes.length) {
        const s = v.sizes.find((x) => typeof x.price !== "undefined");
        if (s) return Number(s.price || 0);
      }
    }
  }
  return Number(product.price || 0);
}
