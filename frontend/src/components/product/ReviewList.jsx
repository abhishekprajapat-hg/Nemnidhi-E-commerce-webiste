import React from "react";

export default function ReviewList({ reviews, loading }) {
  if (loading) return <p className="text-sm text-[var(--nm-muted)]">Loading reviews...</p>;
  if (!reviews || reviews.length === 0) return <p className="text-sm text-[var(--nm-muted)]">No reviews yet.</p>;

  return (
    <div className="space-y-5">
      {reviews.map((review) => {
        const validImages = Array.isArray(review.images)
          ? review.images.filter((img) => Boolean(img) && String(img).trim() !== "")
          : [];

        return (
          <article key={review._id} className="border-b border-[var(--nm-border)] pb-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{review.userName || review.name || "User"}</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {Number(review.rating || 0)}/5
              </span>
              <span className="text-xs text-[var(--nm-muted)]">
                {new Date(review.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 text-sm text-[var(--nm-muted)]">{review.comment}</p>

            {validImages.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {validImages.map((image, index) => (
                  <img
                    key={`${review._id}-${index}`}
                    src={image}
                    alt={`review-${review._id}-${index}`}
                    className="h-20 w-20 rounded-xl border border-[var(--nm-border)] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
