// src/components/products/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import deriveThumbnail from "./helpers/deriveThumbnail";
import derivePrice from "./helpers/derivePrice";
import deriveTotalStock from "./helpers/deriveTotalStock";

export default function ProductCard({ product }) {
  const thumb = deriveThumbnail(product);
  const price = derivePrice(product);
  const totalStock = deriveTotalStock(product);

  return (
    <Link
      to={`/product/${product._id}`}
      className="group border rounded-xl overflow-hidden bg-white hover:shadow-md transition dark:border-zinc-700 dark:bg-zinc-800 dark:hover:shadow-lg"
    >
      <div className="relative">
        <div className="aspect-[4/5] bg-gray-100 dark:bg-zinc-700">
          <img
            src={thumb}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          />
        </div>

        {Number(totalStock) <= 0 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="font-medium line-clamp-1 dark:text-white">{product.title}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          ₹{price.toFixed(2)}
        </div>

        {product.rating ? (
          <div className="mt-1 text-xs text-yellow-600">
            ★ {Number(product.rating).toFixed(1)} ({product.numReviews || 0})
          </div>
        ) : null}
      </div>
    </Link>
  );
}
