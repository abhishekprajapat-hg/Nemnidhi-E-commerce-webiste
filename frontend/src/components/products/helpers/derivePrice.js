export default function derivePrice(product) {
  if (product?.variants?.length) {
    for (const v of product.variants) {
      if (v.sizes?.length) {
        return Number(v.sizes[0].price || 0);
      }
    }
  }
  return Number(product.price || 0);
}
