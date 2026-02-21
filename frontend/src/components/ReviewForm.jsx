import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { showToast } from "../utils/toast";

function StarInput({ rating, setRating }) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setRating(value)}
          className={`h-9 min-w-9 rounded-full border px-3 text-sm font-semibold transition ${
            value <= rating
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-[var(--nm-border)] bg-[var(--nm-surface)] hover:border-amber-500"
          }`}
          aria-label={`Rate ${value}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ productId, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      preview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [preview]);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 3);
    preview.forEach((url) => URL.revokeObjectURL(url));
    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }

    if (!comment.trim()) {
      setError("Please write a comment.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("comment", comment);
      images.forEach((image) => formData.append("images", image));

      await api.post(`/api/reviews/${productId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Review submitted successfully");
      if (onClose) onClose(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to submit review. You may have already reviewed this product.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute right-4 top-4 rounded-full border border-[var(--nm-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
          aria-label="Close review form"
        >
          Close
        </button>

        <h2 className="nm-display text-3xl font-semibold sm:text-4xl">Write a Review</h2>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Rating</span>
            <StarInput rating={rating} setRating={setRating} />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Add photos (max 3)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />

            {preview.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {preview.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`preview-${index}`}
                    className="h-16 w-16 rounded-xl border border-[var(--nm-border)] object-cover"
                  />
                ))}
              </div>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Review</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us what you thought..."
              rows={4}
              className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="nm-btn-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
