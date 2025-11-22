// src/components/product/ProductInfoPanel.jsx
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
  onSelectVariant,
  onSelectSize,
  qty,
  setQty,
  onAdd,
  onBuyNow,
}) {
  return (
    <aside className="md:col-span-1 lg:col-span-5 order-2">
      <div className="space-y-6">
        <ProductHeader
          title={product.title}
          category={product.category}
          price={currentPrice}
          rating={product.rating}
          numReviews={product.numReviews}
        />

        <div>
          <VariantSelector
            product={product}
            selectedVariantIndex={selectedVariantIndex}
            selectedSize={selectedSize}
            onSelectVariant={onSelectVariant}
            onSelectSize={onSelectSize}
          />
        </div>

        <QuantitySelector qty={qty} setQty={setQty} currentStock={currentStock} inStock={inStock} />

        <AddToCartButtons inStock={inStock} onAdd={onAdd} onBuyNow={onBuyNow} />

        <ProductAccordions description={product.description} />
      </div>
    </aside>
  );
}
