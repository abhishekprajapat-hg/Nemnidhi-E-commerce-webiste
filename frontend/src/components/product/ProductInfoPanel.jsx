import React from "react";
import ProductHeader from "./ProductHeader";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";
import AddToCartButtons from "./AddToCartButtons";
import ProductAccordions from "./ProductAccordions";

export default function ProductInfoPanel({
  product,
  currentPrice,
  currentStock,
  inStock,
  selectedVariantIndex,
  selectedSize,
  selectedColor,
  onSelectVariant,
  onSelectSize,
  onSelectColor,
  qty,
  setQty,
  onAdd,
  onBuyNow,
}) {
  return (
    <aside className="order-2 md:col-span-1 lg:col-span-5">
      <div className="space-y-5 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6 lg:sticky lg:top-24">
        <ProductHeader
          title={product.title}
          category={product.category}
          price={currentPrice}
          rating={product.rating}
          numReviews={product.numReviews}
        />

        <VariantSelector
          product={product}
          selectedVariantIndex={selectedVariantIndex}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSelectVariant={onSelectVariant}
          onSelectSize={onSelectSize}
          onSelectColor={onSelectColor}
        />

        <QuantitySelector
          qty={qty}
          setQty={setQty}
          currentStock={currentStock}
          inStock={inStock}
        />

        <AddToCartButtons inStock={inStock} onAdd={onAdd} onBuyNow={onBuyNow} />

        <ProductAccordions description={product.description} />
      </div>
    </aside>
  );
}
