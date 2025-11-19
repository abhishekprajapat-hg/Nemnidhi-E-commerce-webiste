import React from "react";

export default function Card({ children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      {children}
    </div>
  );
}

