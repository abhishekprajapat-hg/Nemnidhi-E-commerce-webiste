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
    <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--nm-muted)]">Product Filters</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="xl:col-span-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Search</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Title, slug..."
            className="mt-1 w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            aria-label="Search products"
          />
        </label>

        <label>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Category</span>
          <select
            value={category}
            onChange={(event) => {
              setPage(1);
              setCategory(event.target.value);
            }}
            className="mt-1 w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          >
            <option value="">All</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Min price</span>
            <input
              type="number"
              value={min}
              onChange={(event) => {
                setPage(1);
                setMin(event.target.value);
              }}
              className="mt-1 w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />
          </label>

          <label>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Max price</span>
            <input
              type="number"
              value={max}
              onChange={(event) => {
                setPage(1);
                setMax(event.target.value);
              }}
              className="mt-1 w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
            />
          </label>
        </div>

        <label className="flex items-end">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => {
                setPage(1);
                setInStockOnly(event.target.checked);
              }}
              className="h-4 w-4 accent-[var(--nm-accent)]"
            />
            In stock only
          </span>
        </label>
      </div>
    </section>
  );
}
