import { toAbsoluteAssetUrl } from "../api/client";

export const deriveImagesFromProduct = (product, selectedVariantIndex = 0) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    const variant =
      product.variants[selectedVariantIndex] || product.variants[0] || null;

    if (Array.isArray(variant?.images) && variant.images.length > 0) {
      return variant.images.map(toAbsoluteAssetUrl).filter(Boolean);
    }
  }

  if (Array.isArray(product?.previewImages) && product.previewImages.length > 0) {
    return product.previewImages.map(toAbsoluteAssetUrl).filter(Boolean);
  }

  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images.map(toAbsoluteAssetUrl).filter(Boolean);
  }

  const fallback = toAbsoluteAssetUrl(product?.image);
  return fallback ? [fallback] : [];
};

export const derivePriceFromProduct = (
  product,
  selectedVariantIndex = 0,
  selectedSize = ""
) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    const variant =
      product.variants[selectedVariantIndex] || product.variants[0] || null;

    if (Array.isArray(variant?.sizes) && variant.sizes.length > 0) {
      const chosenSize =
        variant.sizes.find((entry) => entry.size === selectedSize) ||
        variant.sizes[0];

      return Number(chosenSize?.price || 0);
    }
  }

  return Number(product?.minVariantPrice || product?.minPrice || product?.price || 0);
};

export const deriveStockFromProduct = (
  product,
  selectedVariantIndex = 0,
  selectedSize = ""
) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    const variant =
      product.variants[selectedVariantIndex] || product.variants[0] || null;

    if (Array.isArray(variant?.sizes) && variant.sizes.length > 0) {
      const chosenSize =
        variant.sizes.find((entry) => entry.size === selectedSize) ||
        variant.sizes[0];

      return Number(chosenSize?.stock || 0);
    }
  }

  return Number(product?.totalStock || product?.countInStock || 0);
};

export const getDefaultVariantSelection = (product) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    const firstVariant = product.variants[0];
    return {
      selectedVariantIndex: 0,
      selectedColor: String(firstVariant?.color || ""),
      selectedSize: String(firstVariant?.sizes?.[0]?.size || ""),
    };
  }

  return {
    selectedVariantIndex: -1,
    selectedColor: String(product?.aggColors?.[0] || product?.colors?.[0] || ""),
    selectedSize: String(product?.aggSizes?.[0] || product?.sizes?.[0] || ""),
  };
};

export const getProductPreviewImage = (product) => {
  const variantImage = product?.variants?.find(
    (entry) => Array.isArray(entry?.images) && entry.images[0]
  )?.images?.[0];

  const preview =
    product?.previewImages?.[0] ||
    variantImage ||
    product?.images?.[0] ||
    product?.image ||
    "";

  return toAbsoluteAssetUrl(preview);
};

export const getProductCardPrice = (product) =>
  Number(
    product?.minVariantPrice ||
      product?.minPrice ||
      derivePriceFromProduct(product, 0, "") ||
      0
  );

export const buildCartItem = ({
  product,
  selectedVariantIndex = 0,
  selectedSize = "",
  qty = 1,
  imageIndex = 0,
}) => {
  if (!product?._id) return null;

  const images = deriveImagesFromProduct(product, selectedVariantIndex);

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variant =
      product.variants[selectedVariantIndex] || product.variants[0] || null;
    const sizeEntry =
      variant?.sizes?.find((entry) => entry.size === selectedSize) ||
      variant?.sizes?.[0];

    if (!variant || !sizeEntry) return null;

    return {
      product: product._id,
      title: product.title,
      price: Number(sizeEntry.price || 0),
      qty: Number(qty || 1),
      image: images[imageIndex] || images[0] || "",
      size: String(sizeEntry.size || ""),
      color: String(variant.color || ""),
      countInStock: Number(sizeEntry.stock || 0),
    };
  }

  return {
    product: product._id,
    title: product.title,
    price: derivePriceFromProduct(product, 0, selectedSize),
    qty: Number(qty || 1),
    image: images[imageIndex] || images[0] || "",
    size: String(selectedSize || product?.sizes?.[0] || ""),
    color: String(product?.aggColors?.[0] || product?.colors?.[0] || ""),
    countInStock: deriveStockFromProduct(product, 0, selectedSize),
  };
};

export const buildQuickAddPayload = (product) => {
  const defaults = getDefaultVariantSelection(product);
  return buildCartItem({
    product,
    selectedVariantIndex: defaults.selectedVariantIndex,
    selectedSize: defaults.selectedSize,
    qty: 1,
    imageIndex: 0,
  });
};
