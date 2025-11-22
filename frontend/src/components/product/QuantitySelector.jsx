// src/components/product/QuantitySelector.jsx
import React from "react";

export default function QuantitySelector({ qty, setQty, currentStock, inStock }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-sm font-medium dark:text-white">Quantity</div>
      <div className="flex items-center border rounded-md dark:border-zinc-700">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 border-r dark:border-zinc-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-l-md">-</button>
        <input type="text" value={qty} readOnly className="w-12 text-center dark:bg-zinc-900 dark:text-white focus:outline-none" />
        <button onClick={() => setQty((q) => Math.min(Number(currentStock), q + 1))} disabled={qty >= currentStock} className="px-4 py-2 border-l dark:border-zinc-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-r-md disabled:cursor-not-allowed disabled:opacity-50">+</button>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{inStock ? `${currentStock} in stock` : "Unavailable"}</div>
    </div>
  );
}
