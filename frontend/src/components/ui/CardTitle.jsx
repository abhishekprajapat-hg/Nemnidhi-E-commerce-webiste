import React from "react";

export default function CardTitle({ children }) {
  return (
    <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--nm-muted)]">
      {children}
    </h2>
  );
}

