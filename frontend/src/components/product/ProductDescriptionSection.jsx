import React from "react";

export default function ProductDescriptionSection({ description }) {
  if (!description || !String(description).trim()) return null;

  return (
    <section className="pd-section-card mt-12 rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Product Story</p>
        <h2 className="nm-display text-3xl font-semibold sm:text-4xl">Description</h2>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4 sm:p-5">
        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--nm-muted)] sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
