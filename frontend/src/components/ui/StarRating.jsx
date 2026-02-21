import React from "react";

const StarRating = React.memo(function StarRating({ rating = 0, numReviews = 0 }) {
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
  const filled = Math.round(normalized);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full border ${
              index < filled ? "border-amber-500 bg-amber-500" : "border-[var(--nm-border)] bg-transparent"
            }`}
          />
        ))}
      </div>

      <span className="text-sm text-[var(--nm-muted)]">
        {normalized.toFixed(1)} ({numReviews || 0})
      </span>
    </div>
  );
});

export default StarRating;
