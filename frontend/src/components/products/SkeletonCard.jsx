// src/components/products/SkeletonCard.jsx
import React from "react";

export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] animate-pulse">
      <div className="aspect-[3/4] bg-[var(--nm-bg-elevated)]" />
      <div className="space-y-2.5 p-3 sm:p-4">
        <div className="h-4 w-2/3 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-4 w-1/3 rounded bg-[var(--nm-bg-elevated)]" />
        <div className="h-7 w-20 rounded-full bg-[var(--nm-bg-elevated)]" />
      </div>
    </div>
  );
}
