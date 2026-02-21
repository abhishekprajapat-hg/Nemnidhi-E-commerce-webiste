export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:flex-row sm:px-5">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="nm-btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Previous
      </button>

      <p className="text-sm text-[var(--nm-muted)]">
        Page {page} of {totalPages}
      </p>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="nm-btn-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Next
      </button>
    </div>
  );
}
