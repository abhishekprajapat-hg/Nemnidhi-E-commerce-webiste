import React from "react";

export default function Badge({ children, tone = "yellow" }) {
  const toneClasses =
    tone === "green"
      ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300"
      : tone === "red"
      ? "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${toneClasses}`}>
      {children}
    </span>
  );
}
