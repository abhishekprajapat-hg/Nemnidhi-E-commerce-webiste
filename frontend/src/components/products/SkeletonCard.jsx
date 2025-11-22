// src/components/products/SkeletonCard.jsx
import React from "react";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse border rounded-xl overflow-hidden bg-white dark:bg-zinc-800 dark:border-zinc-700">
      <div className="aspect-[4/5] bg-gray-200 dark:bg-zinc-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 w-2/3 rounded" />
        <div className="h-4 bg-gray-100 dark:bg-zinc-900 w-1/3 rounded" />
      </div>
    </div>
  );
}
