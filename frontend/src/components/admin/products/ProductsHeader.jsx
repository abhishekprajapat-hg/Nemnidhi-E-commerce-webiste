// src/components/admin/products/ProductsHeader.jsx
import { useNavigate } from "react-router-dom";

export default function ProductsHeader({
  displayedCountText,
  checkedCount,
  onBulkDelete,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">{displayedCountText}</div>

      <div className="flex gap-2">
        {!!checkedCount && (
          <button onClick={onBulkDelete}>
            Delete selected ({checkedCount})
          </button>
        )}

        <button onClick={() => navigate("/admin/create-product")}>
          Create product
        </button>
      </div>
    </div>
  );
}
