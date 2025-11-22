// src/components/ui/StarRating.jsx
import React from "react";

const StarRating = React.memo(({ rating, numReviews }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      <div className="flex text-yellow-500">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`}>★</span>
        ))}
        {halfStar && <span>☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 dark:text-zinc-600">
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({numReviews || 0})</span>
    </div>
  );
});

export default StarRating;
