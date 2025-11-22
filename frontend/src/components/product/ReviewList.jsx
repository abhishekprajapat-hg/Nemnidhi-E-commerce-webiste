// src/components/product/ReviewList.jsx
import React from "react";

// sample local image path is included (kept for reference if needed)
const PLACEHOLDER_IMAGE = "/mnt/data/acb9da27-2225-45bd-8890-d39621053a9e.png";

export default function ReviewList({ reviews, loading }) {
  if (loading) return <div className="text-gray-500 dark:text-gray-300">Loading reviews...</div>;
  if (!reviews || reviews.length === 0) return <div className="text-gray-500 dark:text-gray-400 mt-1">No reviews yet.</div>;

  return (
    <div className="mt-6 space-y-6">
      {reviews.map((r) => {
        // filter out falsy / empty image entries
        const validImages = Array.isArray(r.images) ? r.images.filter((img) => !!img && String(img).trim() !== "") : [];

        return (
          <div key={r._id} className="border-b pb-4 dark:border-zinc-700">
            <div className="flex items-center gap-2">
              <strong className="dark:text-white">{r.userName || r.name || "User"}</strong>
              <div className="text-yellow-500">{"★".repeat(r.rating)}</div>
              <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mt-2">{r.comment}</p>

            {/* Only show images if user actually uploaded valid ones — no placeholder when none */}
            {validImages.length > 0 && (
              <div className="flex gap-3 mt-2">
                {validImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`review-${r._id}-${i}`}
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      // hide broken images so user doesn't see an empty/broken box
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
