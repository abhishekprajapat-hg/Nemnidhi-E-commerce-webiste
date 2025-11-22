// src/components/product/ProductHeader.jsx
import React from "react";
import StarRating from "../ui/StarRating";

export default function ProductHeader({ title, category, price, rating, numReviews }) {
  const hasReviews = Number(numReviews) > 0 && Number(rating) > 0;

  return (
    <div>
      {/* Title */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight dark:text-white">
        {title}
      </h1>

      {/* Category */}
      {category && (
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {category}
        </div>
      )}

      {/* Price + Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-3">

        {/* Price */}
        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold dark:text-white">
          ₹{Number(price || 0).toFixed(2)}
        </div>

        {/* Rating summary (only if reviews exist) */}
        {hasReviews && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <StarRating rating={rating} numReviews={numReviews} />

            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {rating.toFixed(1)} / 5
            </span>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({numReviews} reviews)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
