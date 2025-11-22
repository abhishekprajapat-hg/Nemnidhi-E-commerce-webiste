// src/components/products/PaginationControls.jsx
import React from "react";

export default function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 dark:bg-zinc-800 dark:text-white"
      >
        ← Previous
      </button>

      <span className="text-gray-700 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-lg bg-white disabled:opacity-50 dark:bg-zinc-800 dark:text-white"
      >
        Next →
      </button>
    </div>
  );
}
