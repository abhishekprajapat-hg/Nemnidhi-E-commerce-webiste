export default function deriveThumbnail(product) {
  if (product?.variants?.length) {
    for (const v of product.variants) {
      if (v.images?.length) return v.images[0];
    }
  }
  if (product?.images?.length) return product.images[0];
  if (product?.image) return product.image;
  return "/placeholder.png";
}
