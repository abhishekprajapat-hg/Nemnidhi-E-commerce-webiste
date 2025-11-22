export default function deriveTotalStock(product) {
  if (product?.variants?.length) {
    return product.variants.reduce((acc, v) => {
      return (
        acc +
        (v.sizes?.reduce((sAcc, s) => sAcc + (Number(s.stock) || 0), 0) || 0)
      );
    }, 0);
  }
  return Number(product.countInStock || 0);
}
