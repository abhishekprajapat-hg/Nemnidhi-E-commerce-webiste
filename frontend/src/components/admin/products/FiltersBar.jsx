// src/components/admin/products/FiltersBar.jsx

export default function FiltersBar({
  searchInput,
  setSearchInput,
  category,
  setCategory,
  categories,
  min,
  max,
  setMin,
  setMax,
  inStockOnly,
  setInStockOnly,
  setPage,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6 dark:bg-zinc-800 dark:border-zinc-700">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Search
          </label>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Title, slug..."
            className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
            aria-label="Search products"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Min / Max */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Min ₹
            </label>
            <input
              value={min}
              type="number"
              onChange={(e) => {
                setPage(1);
                setMin(e.target.value);
              }}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Max ₹
            </label>
            <input
              value={max}
              type="number"
              onChange={(e) => {
                setPage(1);
                setMax(e.target.value);
              }}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-100"
            />
          </div>
        </div>

        {/* In Stock */}
        <div className="flex items-end gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setPage(1);
                setInStockOnly(e.target.checked);
              }}
              className="accent-indigo-600"
            />
            In stock only
          </label>
        </div>
      </div>
    </div>
  );
}
