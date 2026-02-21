import React from "react";

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
      />
      <circle cx="12" cy="12" r="2.8" strokeWidth="1.8" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.1 2.1 0 013 3L9 17l-4 1 1-4L16.5 3.5z"
      />
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5l4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12"
      />
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M10 11v5m4-5v5" />
    </svg>
  );
}

const ProductRow = React.memo(function ProductRow({
  p,
  thumb,
  price,
  totalStock,
  checked,
  onToggle,
  onView,
  onEdit,
  onDelete,
}) {
  const stockCount = Number(totalStock || 0);
  const stockTone = stockCount > 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100";

  return (
    <article className="border-b border-[var(--nm-border)] px-4 py-4 last:border-b-0">
      <div className="md:flex md:items-center md:gap-3">
        <div className="mb-3 flex items-start gap-3 md:mb-0 md:flex-none md:items-center md:gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onToggle(p._id, event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--nm-accent)] md:mt-0"
            aria-label={`Select product ${p.title || p._id}`}
          />

          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]">
            {thumb ? (
              <img
                src={thumb}
                alt={p.title || "product"}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/placeholder.png";
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-[11px] text-[var(--nm-muted)]">No image</div>
            )}
          </div>
        </div>

        <div className="min-w-0 md:flex-1">
          <p className="line-clamp-2 break-words text-sm font-semibold leading-5">{p.title || "Untitled"}</p>
          <p className="mt-0.5 line-clamp-1 break-words text-xs text-[var(--nm-muted)]">{p.slug || "-"}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 md:mt-0 md:w-28 md:justify-end">
          <span className="rounded-full bg-[var(--nm-bg-elevated)] px-3 py-1 text-xs font-semibold md:bg-transparent md:px-0 md:py-0 md:text-sm md:font-medium">
            Rs {Number(price || 0).toFixed(2)}
          </span>
        </div>

        <div className="mt-3 md:mt-0 md:w-20 md:text-right">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stockTone}`}>
            {stockCount}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:w-[148px] md:justify-end">
          <button
            onClick={() => onView(p._id)}
            title="View product"
            aria-label={`View ${p.title || "product"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--nm-border)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
          >
            <EyeIcon />
          </button>

          <button
            onClick={() => onEdit(p._id)}
            title="Edit product"
            aria-label={`Edit ${p.title || "product"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
          >
            <EditIcon />
          </button>

          <button
            onClick={() => onDelete(p._id)}
            title="Delete product"
            aria-label={`Delete ${p.title || "product"}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-300 text-red-700 transition hover:bg-red-50"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </article>
  );
});

export default ProductRow;
