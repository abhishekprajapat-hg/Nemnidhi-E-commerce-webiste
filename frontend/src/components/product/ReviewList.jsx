import React from "react";

export default function ReviewList({ reviews, loading }) {
  if (loading) return <p className="text-sm text-[var(--nm-muted)]">Loading reviews...</p>;
  if (!reviews || reviews.length === 0) return <p className="text-sm text-[var(--nm-muted)]">No reviews yet.</p>;

  return (
    <div className="space-y-5">
      {reviews.map((review) => {
        const filled = Math.round(Math.max(0, Math.min(5, Number(review.rating || 0))));
        const validImages = Array.isArray(review.images)
          ? review.images.filter((img) => Boolean(img) && String(img).trim() !== "")
          : [];

        return (
          <article
            key={review._id}
            className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 transition hover:border-[var(--nm-accent)]/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{review.userName || review.name || "User"}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={`${review._id}-dot-${index}`}
                      className={`h-1.5 w-1.5 rounded-full ${
                        index < filled ? "bg-amber-500" : "bg-[var(--nm-border)]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--nm-muted)]">
                  {new Date(review.createdAt || Date.now()).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
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
