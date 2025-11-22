// src/components/product/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ p }) => {
  const thumb = (p?.variants && p.variants.length > 0 && p.variants[0].images?.[0]) ||
    (Array.isArray(p.images) && p.images[0]) ||
    p.image ||
    "/placeholder.png";

  const price = (p?.variants && p.variants.length > 0 && p.variants[0].sizes?.[0]?.price) ||
    Number(p?.price || 0);

  return (
    <div className="group border rounded-lg overflow-hidden bg-white hover:shadow-md transition dark:bg-zinc-800 dark:border-zinc-700 flex flex-col">
      <div className="aspect-[4/5] sm:aspect-[3/4] bg-gray-100 dark:bg-zinc-700 relative">
        <Link to={`/product/${p._id}`} className="block h-full w-full">
          <img
            src={thumb}
            alt={p.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        </Link>
      </div>
      <div className="p-3">
        <Link to={`/product/${p._id}`}>
          <div className="font-medium line-clamp-1 dark:text-white hover:underline">
            {p.title}
          </div>
        </Link>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          ₹{Number(price || 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
