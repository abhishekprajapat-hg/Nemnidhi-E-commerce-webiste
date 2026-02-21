import React from "react";
import { Link } from "react-router-dom";

export default function Breadcrumb({ title }) {
  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--nm-muted)]">
      <Link to="/products" className="font-semibold transition hover:text-[var(--nm-accent)]">
        Products
      </Link>
      <span>/</span>
      <span className="truncate text-[var(--nm-text)]">{title}</span>
    </nav>
  );
}
