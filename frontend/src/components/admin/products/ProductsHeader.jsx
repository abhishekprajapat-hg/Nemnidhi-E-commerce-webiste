import { useNavigate } from "react-router-dom";

export default function ProductsHeader({
  displayedCountText,
  checkedCount,
  onBulkDelete,
}) {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <p className="text-sm text-[var(--nm-muted)]">{displayedCountText}</p>

      <div className="flex flex-wrap items-center gap-2">
        {checkedCount > 0 ? (
          <button
            onClick={onBulkDelete}
            className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-50"
          >
            Delete selected ({checkedCount})
          </button>
        ) : null}

        <button
          onClick={() => navigate("/admin/create-product")}
          className="nm-btn-primary text-sm"
        >
          Create product
        </button>
      </div>
    </section>
  );
}
