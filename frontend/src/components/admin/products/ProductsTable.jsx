// src/components/admin/products/ProductsTable.jsx
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
    <div className="rounded-xl border bg-white divide-y">
      <div className="px-4 py-3 flex gap-3 text-xs uppercase bg-gray-50">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} />
        <div className="w-16">Image</div>
        <div className="flex-1">Product</div>
        <div className="w-28 text-right">Price</div>
        <div className="w-24 text-right">Stock</div>
        <div className="w-44 text-right">Actions</div>
      </div>

      {loading ? (
        Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
      ) : list.length === 0 ? (
        <div className="p-8 text-center">No products found.</div>
      ) : (
        productsWithMeta.map(({ p, thumb, price, totalStock }) => (
          <ProductRow
            key={p._id}
            p={p}
            thumb={thumb}
            price={price}
            totalStock={totalStock}
            checked={!!selectedMap[p._id]}
            onToggle={toggleOne}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
