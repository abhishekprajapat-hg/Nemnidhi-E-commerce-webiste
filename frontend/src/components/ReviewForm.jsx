// Updated ReviewForm.jsx with photo upload support
import React, { useState } from 'react';
import api from '../api/axios';
import { showToast } from '../utils/toast';

// Reusable StarInput component for selecting a rating
const StarInput = ({ rating, setRating }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setRating(star)}
          onClick={() => setRating(star)}
          className={`text-3xl transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default function ReviewForm({ productId, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      images.forEach((img) => formData.append('images', img));

      await api.post(`/api/reviews/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Review submitted successfully!');
      if (onClose) onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message ||
        'Failed to submit review. You may have already reviewed this product.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
        <button
          onClick={() => onClose()}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-700"
          aria-label="Close review form"
        >
          <span className="font-bold text-lg dark:text-gray-300">X</span>
        </button>

        <h2 className="text-xl font-semibold mb-4 dark:text-white">Write a Review</h2>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Rating
            </label>
            <StarInput rating={rating} setRating={setRating} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Photos (max 3)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="w-full text-sm text-gray-600"
            />

            {preview.length > 0 && (
              <div className="flex gap-2 mt-2">
                {preview.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt="preview"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you thought..."
              rows="4"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-yellow-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-semibold transition ${
              loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-black text-white hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
