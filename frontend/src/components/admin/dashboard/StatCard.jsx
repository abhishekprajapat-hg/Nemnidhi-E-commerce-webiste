import React from "react";

export default function StatCard({ label, value, hint }) {
  return (
    <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--nm-muted)]">
        {label}
      </p>
      <p className="mt-2 text-4xl font-semibold leading-none tracking-tight sm:text-5xl">{value}</p>
      {hint ? <div className="mt-3 text-sm text-[var(--nm-muted)]">{hint}</div> : null}
    </article>
  );
}
