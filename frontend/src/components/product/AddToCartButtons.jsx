// src/components/product/AddToCartButtons.jsx
import React from "react";

export default function AddToCartButtons({ inStock, onAdd, onBuyNow }) {
  // helper function for GTM
  const pushEvent = (buttonName) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "button_click",
      button_name: buttonName,
      page: window.location.pathname,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        disabled={!inStock}
        onClick={() => {
          pushEvent("add_to_cart");
          onAdd();
        }}
        className={`w-full px-5 py-3 rounded-md font-semibold transition border ${
          !inStock
            ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed dark:bg-zinc-700 dark:text-gray-400 dark:border-zinc-700"
            : "bg-white text-black border-black hover:bg-gray-100 dark:bg-zinc-800 dark:text-white dark:border-white dark:hover:bg-zinc-700"
        }`}
      >
        Add to Cart
      </button>

      <button
        disabled={!inStock}
        onClick={() => {
          pushEvent("buy_now");
          onBuyNow();
        }}
        className={`w-full px-5 py-3 rounded-md font-semibold transition ${
          !inStock
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        }`}
      >
        Buy Now
      </button>
    </div>
  );
}
