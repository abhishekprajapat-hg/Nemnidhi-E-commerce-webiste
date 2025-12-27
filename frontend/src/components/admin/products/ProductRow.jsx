import React from "react";

/* ProductRow is memoized so it only re-renders when its props change */
const ProductRow = React.memo(function ProductRow({
  p,
  thumb,
  price,
  totalStock,
  checked,
  onToggle,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition dark:hover:bg-zinc-700/50">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onToggle(p._id, e.target.checked)}
        className="accent-indigo-600"
        aria-label={`Select product ${p.title || p._id}`}
      />

      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0">
        {thumb ? (
          <img
            src={thumb}
            alt={p.title || "product"}
            className="object-cover w-full h-full"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="font-medium dark:text-white">{p.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {p.slug}
        </div>
      </div>

      <div className="w-28 text-right dark:text-white">
        ₹{Number(price || 0).toFixed(2)}
      </div>

      <div className="w-24 text-right">
        {Number(totalStock) > 0 ? (
          <span className="text-green-700 dark:text-green-400">
            {totalStock}
          </span>
        ) : (
          <span className="text-red-700 dark:text-red-400">0</span>
        )}
      </div>

      <div className="w-44 text-right flex justify-end gap-2 text-sm">
        <button
          onClick={() => onView(p._id)}
          className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
        >
          View
        </button>

        <button
          onClick={() => onEdit(p._id)}
          className="px-3 py-1 bg-yellow-400 text-black rounded-md hover:opacity-80 dark:bg-yellow-500 dark:hover:bg-yellow-400"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(p._id)}
          className="px-3 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

export default ProductRow;
