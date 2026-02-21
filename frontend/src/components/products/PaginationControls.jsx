// src/components/products/PaginationControls.jsx
import React from "react";

export default function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Previous
      </button>

      <span className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
        Page {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-45"
      >
        Next
      </button>
    </div>
  );
}
