import React, { useEffect, useMemo, useState } from "react";

const STATUS_ORDER = [
  "created",
  "paid",
  "processing",
  "shipped",
  "out for delivery",
  "delivered",
  "cancelled",
  "refunded",
];

export default function OrdersFilters({
  value = {},
  onChange = () => {},
  facets = {},
}) {
  const [search, setSearch] = useState(value.q || "");

  const orderedStatusFacets = useMemo(() => {
    const list = Array.isArray(facets?.status) ? facets.status : [];
    return [...list].sort((left, right) => {
      const leftStatus = String(left?.status || "").toLowerCase();
      const rightStatus = String(right?.status || "").toLowerCase();

      const leftIndex = STATUS_ORDER.indexOf(leftStatus);
      const rightIndex = STATUS_ORDER.indexOf(rightStatus);

      if (leftIndex === -1 && rightIndex === -1) {
        return leftStatus.localeCompare(rightStatus);
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
  }, [facets?.status]);

  useEffect(() => {
    setSearch(value.q || "");
  }, [value.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...value, q: search.trim(), page: 1 });
    }, 280);
    return () => clearTimeout(timer);
  }, [search, onChange, value]);

  const changeStatus = (status) => {
    onChange({ ...value, status, page: 1 });
  };

  return (
    <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
      <h3 className="mb-3 text-lg font-semibold">Filter Orders</h3>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, email, or product title"
            className="w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2.5 pr-24 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          />
          <button
            onClick={() => onChange({ ...value, q: search.trim(), page: 1 })}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-[var(--nm-accent)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
          >
            Search
          </button>
        </div>

        <div className="w-full md:w-52">
          <select
            value={value.status || ""}
            onChange={(event) => changeStatus(event.target.value)}
            className="w-full rounded-full border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-2.5 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Created">Created</option>
            <option value="Paid">Paid/Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {orderedStatusFacets.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--nm-border)] pt-4">
          {orderedStatusFacets.map((facet) => (
            <button
              key={facet.status}
              onClick={() => changeStatus(facet.status)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                value.status === facet.status
                  ? "bg-[var(--nm-accent)] text-white"
                  : "border border-[var(--nm-border)] bg-[var(--nm-surface)] text-[var(--nm-text)] hover:border-[var(--nm-accent)]"
              }`}
            >
              {facet.status} ({facet.count})
            </button>
          ))}
          {value.status && (
            <button
              onClick={() => changeStatus("")}
              className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-red-600 hover:bg-red-50"
            >
              Clear Status
            </button>
          )}
        </div>
      )}
    </section>
  );
}
