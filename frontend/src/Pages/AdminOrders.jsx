// /src/Pages/AdminOrders.jsx
import React, { useCallback, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import useOrders from '../hooks/useOrders';
import OrdersFilters from '../components/admin/OrdersFilters';
import OrdersTable from '../components/admin/OrdersTable';

export default function AdminOrders() {
  const [filters, setFilters] = useState({ q: '', status: '', page: 1, limit: 20, sort: '-createdAt' });

  const { orders, loading, facets, pageInfo, refresh } = useOrders(filters);

  const onFiltersChange = useCallback((next) => {
    setFilters((f) => ({ ...f, ...next }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setFilters((f) => ({ ...f, page: newPage }));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <OrdersFilters value={filters} onChange={onFiltersChange} facets={facets} />
          <div className="flex-1">
            <div className="flex justify-end mb-2">
              <button onClick={refresh} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Refresh</button>
            </div>
            <OrdersTable orders={orders} loading={loading} pageInfo={pageInfo} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
