import React from "react";
import { Link, useParams } from "react-router-dom";

export default function OrderSuccess() {
  const { id } = useParams();

  return (
    <div className="nm-shell py-14 sm:py-20">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-7 text-center shadow-2xl shadow-black/10 sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor">
            <path strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="nm-display mt-5 text-5xl font-semibold leading-none">Order Confirmed</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--nm-muted)] sm:text-base">
          Thank you for shopping with Nemnidhi. Your order is being processed.
        </p>

        <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--nm-muted)]">
          Order ID
        </p>
        <p className="mt-1 rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2 font-mono text-sm">
          {id}
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link to="/products" className="nm-btn-primary text-sm">
            Continue Shopping
          </Link>
          <Link to="/profile?tab=orders" className="nm-btn-secondary text-sm">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
