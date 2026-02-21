import React from "react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ title }) {
  return (
    <nav aria-label="Breadcrumb" className="pd-breadcrumb mb-6 flex items-center gap-2.5 text-xs sm:text-sm">
      <Link
        to="/products"
        className="rounded-full border border-[var(--nm-border)] bg-[color-mix(in_srgb,var(--nm-card)_70%,transparent)] px-3 py-1 font-semibold tracking-[0.08em] uppercase text-[var(--nm-muted)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
      >
        All Products
      </Link>
      <span aria-hidden className="text-[var(--nm-muted)]">
        *
      </span>
      <span className="truncate font-semibold text-[var(--nm-text)]">{title}</span>
    </nav>
  );
}
