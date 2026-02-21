import React from "react";

export default function Input({ label, id, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
        {label}
      </span>
      <input
        id={id}
        name={id}
        {...props}
        className="block w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm text-[var(--nm-text)] focus:border-[var(--nm-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}
