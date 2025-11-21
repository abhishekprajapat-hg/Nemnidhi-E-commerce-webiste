import React from "react";

export function Th({ children, align = "left" }) {
  return (
    <th className={`px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left" }) {
  return (
    <td className={`px-3 py-3 text-sm dark:text-gray-200 ${align === "right" ? "text-right font-medium" : ""}`}>
      {children}
    </td>
  );
}

export function Skeleton({ w = "w-full", h = "h-4", rounded = false }) {
  return <div className={`${w} ${h} ${rounded ? "rounded-md" : "rounded"} bg-gray-200 dark:bg-zinc-700 animate-pulse`} />;
}
