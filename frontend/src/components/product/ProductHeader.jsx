import React from "react";
import StarRating from "../ui/StarRating";

export default function ProductHeader({ title, category, price, rating, numReviews }) {
  return (
    <header className="space-y-4">
      {category ? (
        <p className="inline-flex rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">
          {category}
        </p>
      ) : null}

      <h1 className="nm-display text-[clamp(2.1rem,4.2vw,3.65rem)] font-semibold leading-[0.92]">{title}</h1>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Current Price</p>
          <p className="text-2xl font-semibold sm:text-3xl">Rs {Number(price || 0).toFixed(2)}</p>
        </div>

        {Number(numReviews) > 0 ? (
          <div className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-1.5">
            <StarRating rating={rating} numReviews={numReviews} />
          </div>
        ) : (
          <p className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-1.5 text-sm text-[var(--nm-muted)]">
            No reviews yet
          </p>
        )}
      </div>
    </header>
  );
}
