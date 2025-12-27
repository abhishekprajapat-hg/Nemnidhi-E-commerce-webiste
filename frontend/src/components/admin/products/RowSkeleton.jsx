// src/components/admin/products/RowSkeleton.jsx

export default function RowSkeleton() {
  return (
    <div className="px-4 py-3 flex items-center gap-3 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-700 rounded-md" />
      <div className="flex-1">
        <div className="w-48 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      </div>
      <div className="w-20 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      <div className="w-16 h-4 bg-gray-200 dark:bg-zinc-700 rounded" />
      <div className="w-32 h-8 bg-gray-200 dark:bg-zinc-700 rounded" />
    </div>
  );
}
