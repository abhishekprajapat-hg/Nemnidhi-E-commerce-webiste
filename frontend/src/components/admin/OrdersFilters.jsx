// /src/components/admin/OrdersFilters.jsx
import React, { useEffect, useState } from 'react';

export default function OrdersFilters({ value = {}, onChange = () => {}, facets = {} }) {
  const [search, setSearch] = useState(value.q || '');

  // small debounce (280ms)
  useEffect(() => {
    const t = setTimeout(() => {
      onChange({ ...value, q: search.trim(), page: 1 });
    }, 280);
    return () => clearTimeout(t);
  }, [search]);

  function changeStatus(s) {
    onChange({ ...value, status: s, page: 1 });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <h3 className="text-lg font-semibold mb-3 dark:text-white">Filter Orders</h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, email, or product title"
            className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-700 dark:text-white px-3 py-2 rounded-lg"
          />
          <button
            onClick={() => onChange({ ...value, q: search.trim(), page: 1 })}
            aria-label="Search orders"
            className="absolute right-0 top-0 h-full px-4 text-sm font-medium rounded-r-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Search
          </button>
        </div>

        <div className="w-full md:w-48 shrink-0">
          <select
            value={value.status || ''}
            onChange={(e) => changeStatus(e.target.value)}
            className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-700 dark:text-white px-3 py-2 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="Created">Created</option>
            <option value="Paid">Paid/Processing</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {facets?.status?.length > 0 && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-700/50 flex-wrap">
          {facets.status.map((f) => (
            <button
              key={f.status}
              onClick={() => changeStatus(f.status)}
              className={`px-3 py-1 text-sm rounded-full transition ${value.status === f.status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600'}`}
            >
              {f.status} ({f.count})
            </button>
          ))}
          {value.status && (
            <button onClick={() => changeStatus('')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300">
              Clear Status
            </button>
          )}
        </div>
      )}
    </div>
  );
}
