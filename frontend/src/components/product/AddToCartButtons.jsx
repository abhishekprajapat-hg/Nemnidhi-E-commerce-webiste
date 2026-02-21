import React from "react";

export default function AddToCartButtons({ inStock, onAdd, onBuyNow }) {
  const pushEvent = (buttonName) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "button_click",
      button_name: buttonName,
      page: window.location.pathname,
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!inStock}
          onClick={() => {
            pushEvent("add_to_cart");
            onAdd();
          }}
          className="nm-btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          Add to Cart
        </button>

        <button
          type="button"
          disabled={!inStock}
          onClick={() => {
            pushEvent("buy_now");
            onBuyNow();
          }}
          className="nm-btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-55"
        >
          Buy Now
        </button>
      </div>

      <p className="text-center text-xs text-[var(--nm-muted)]">
        Free delivery above Rs 999 and easy size exchange.
      </p>
    </div>
  );
}
