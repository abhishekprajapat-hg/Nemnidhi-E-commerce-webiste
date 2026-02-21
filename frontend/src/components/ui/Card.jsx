import React from "react";

export default function Card({ children }) {
  return (
    <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-6 shadow-lg shadow-black/5">
      {children}
    </div>
  );
}

