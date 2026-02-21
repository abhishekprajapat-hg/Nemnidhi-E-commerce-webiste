import RowSkeleton from "./RowSkeleton";
import ProductRow from "./ProductRow";

export default function ProductsTable({
  loading,
  list,
  productsWithMeta,
  selectedMap,
  allChecked,
  toggleAll,
  toggleOne,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)]">
      <div className="hidden border-b border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]/70 px-4 py-3 md:flex md:items-center md:gap-3">
        <input
          type="checkbox"
          checked={Boolean(allChecked)}
          onChange={toggleAll}
          className="h-4 w-4 accent-[var(--nm-accent)]"
          aria-label="Select all products"
        />
        <div className="w-16 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Image</div>
        <div className="flex-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Product</div>
        <div className="w-28 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Price</div>
        <div className="w-20 text-right text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Stock</div>
        <div className="w-[220px] text-right text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Actions</div>
      </div>

      {loading ? (
        Array.from({ length: 6 }).map((_, index) => <RowSkeleton key={index} />)
      ) : list.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-[var(--nm-muted)]">No products found.</div>
      ) : (
        productsWithMeta.map(({ p, thumb, price, totalStock }) => (
          <ProductRow
            key={p._id}
            p={p}
            thumb={thumb}
            price={price}
            totalStock={totalStock}
            checked={Boolean(selectedMap[p._id])}
            onToggle={toggleOne}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </section>
  );
}
