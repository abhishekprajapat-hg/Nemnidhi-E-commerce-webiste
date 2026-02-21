import React from "react";

export function Badge({ children, tone = "amber" }) {
  const toneClasses =
    tone === "green"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "red"
        ? "bg-red-100 text-red-800"
        : tone === "blue"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${toneClasses}`}>
      {children}
    </span>
  );
}

export function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "" }) {
  return (
    <td
      className={`px-3 py-3 text-sm ${align === "right" ? "text-right" : ""} ${className}`.trim()}
    >
      {children}
    </td>
  );
}

export function Skeleton({ w = "w-full", h = "h-4" }) {
  return <div className={`${w} ${h} animate-pulse rounded bg-[var(--nm-bg-elevated)]`} />;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:flex-row sm:px-5">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="nm-btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Previous
      </button>

      <span className="text-sm text-[var(--nm-muted)]">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="nm-btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Next
      </button>
    </div>
  );
}
