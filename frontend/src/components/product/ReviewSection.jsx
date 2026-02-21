import React from "react";
import ReviewList from "./ReviewList";

export default function ReviewSection({ reviews, reviewsLoading, onOpenReviewForm }) {
  return (
    <section className="mt-14 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          {!reviewsLoading && reviews?.length > 0 ? (
            <p className="mt-1 text-sm text-[var(--nm-muted)]">
              {reviews.length} review{reviews.length > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpenReviewForm}
          className="nm-btn-secondary w-full text-sm sm:w-auto"
        >
          Write a Review
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4 sm:p-5">
        <ReviewList reviews={reviews} loading={reviewsLoading} />
      </div>
    </section>
  );
}
