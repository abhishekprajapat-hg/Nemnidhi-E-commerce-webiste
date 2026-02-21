import React from "react";
import StarRating from "../ui/StarRating";

export default function ProductHeader({ title, category, price, rating, numReviews }) {
  return (
    <header>
      <h1 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">{title}</h1>

      {category ? <p className="mt-2 text-sm text-[var(--nm-muted)]">{category}</p> : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-2xl font-semibold sm:text-3xl">Rs {Number(price || 0).toFixed(2)}</p>

        {Number(numReviews) > 0 ? (
          <StarRating rating={rating} numReviews={numReviews} />
        ) : (
          <p className="text-sm text-[var(--nm-muted)]">No reviews yet</p>
        )}
      </div>
    </header>
  );
}
