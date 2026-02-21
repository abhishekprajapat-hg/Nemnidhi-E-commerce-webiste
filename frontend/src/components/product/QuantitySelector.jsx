import React from "react";

export default function QuantitySelector({ qty, setQty, currentStock, inStock }) {
  const stock = Math.max(0, Number(currentStock || 0));

  return (
    <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Quantity</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
            inStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
          }`}
        >
          {inStock ? `${stock} Left` : "Sold Out"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-xl border border-[var(--nm-border)] bg-[var(--nm-card)]">
          <button
            type="button"
            onClick={() => setQty((count) => Math.max(1, count - 1))}
            className="h-10 w-10 text-lg font-semibold transition hover:bg-[var(--nm-accent-soft)]"
            aria-label="Decrease quantity"
          >
            -
          </button>

          <input
            type="text"
            readOnly
            value={qty}
            className="h-10 w-12 border-x border-[var(--nm-border)] bg-transparent text-center text-sm font-semibold focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setQty((count) => Math.min(stock || 1, count + 1))}
            disabled={qty >= stock}
            className="h-10 w-10 text-lg font-semibold transition hover:bg-[var(--nm-accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <p className="text-sm text-[var(--nm-muted)]">{inStock ? "Ready to ship" : "Unavailable"}</p>
      </div>
    </div>
  );
}
