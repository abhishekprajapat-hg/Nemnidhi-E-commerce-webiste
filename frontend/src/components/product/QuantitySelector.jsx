import React from "react";

export default function QuantitySelector({ qty, setQty, currentStock, inStock }) {
  const stock = Math.max(0, Number(currentStock || 0));

  return (
    <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Quantity</p>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-full border border-[var(--nm-border)]">
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
            className="h-10 w-12 border-x border-[var(--nm-border)] bg-[var(--nm-card)] text-center text-sm font-semibold focus:outline-none"
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

        <p className="text-sm text-[var(--nm-muted)]">{inStock ? `${stock} in stock` : "Unavailable"}</p>
      </div>
    </div>
  );
}
