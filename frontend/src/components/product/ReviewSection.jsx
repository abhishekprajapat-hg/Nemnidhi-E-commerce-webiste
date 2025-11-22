// src/components/product/ReviewSection.jsx
import React from "react";
import ReviewList from "./ReviewList";

export default function ReviewSection({ reviews, reviewsLoading, onOpenReviewForm }) {
  return (
    <section className="mt-16 pt-10 border-t border-gray-200 dark:border-zinc-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        
        {/* Left Heading */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-tight dark:text-white">
            Customer Reviews
          </h2>

          {/* Summary */}
          {!reviewsLoading && reviews?.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {reviews.length} review{reviews.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Write Review Button */}
        <button
          onClick={onOpenReviewForm}
          className="
            border border-gray-300 dark:border-zinc-600 
            rounded-lg px-5 py-2 
            font-medium 
            bg-white dark:bg-zinc-800 
            hover:bg-gray-100 dark:hover:bg-zinc-700
            transition-all duration-200
            w-full sm:w-auto
          "
        >
          ✍️ Write a Review
        </button>
      </div>

      {/* Review List */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 shadow-sm dark:shadow-none">
        <ReviewList reviews={reviews} loading={reviewsLoading} />
      </div>
    </section>
  );
}
