import React from "react";

export function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left" }) {
  return (
    <td
      className={`px-3 py-3 text-sm ${align === "right" ? "text-right font-medium" : "text-left"}`}
    >
      {children}
    </td>
  );
}

export function Skeleton({ w = "w-full", h = "h-4", rounded = false }) {
  return <div className={`${w} ${h} ${rounded ? "rounded-xl" : "rounded"} animate-pulse bg-[var(--nm-bg-elevated)]`} />;
}
