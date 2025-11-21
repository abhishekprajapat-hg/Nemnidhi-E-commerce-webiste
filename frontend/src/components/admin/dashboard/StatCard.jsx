import React from "react";

export default function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-extrabold dark:text-white">{value}</div>
      <div className="mt-1">{hint}</div>
    </div>
  );
}
