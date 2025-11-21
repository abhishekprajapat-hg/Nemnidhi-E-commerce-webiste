// /src/components/admin/OrdersTable.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Th, Td, Skeleton, PaginationControls } from '../ui/atoms';

// Small helper: safe slice for id display
const shortId = (id) => {
  try {
    return `#${String(id).slice(-6)}`;
  } catch {
    return '—';
  }
};

function OrdersTableInner({ orders = [], loading = false, pageInfo = {}, onPageChange }) {
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 2 }), []);

  const displayedCountText = useMemo(
    () => `Showing ${Array.isArray(orders) ? orders.length : 0} of ${pageInfo?.total || 0}`,
    [orders, pageInfo?.total]
  );

  const rows = useMemo(() => {
    if (loading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="animate-pulse">
          <Td><Skeleton w="w-16" /></Td>
          <Td><Skeleton w="w-32" /></Td>
          <Td align="right"><Skeleton w="w-12" /></Td>
          <Td><Skeleton w="w-10" /></Td>
          <Td><Skeleton w="w-20" /></Td>
          <Td><Skeleton w="w-28" /></Td>
          <Td><Skeleton w="w-10" /></Td>
        </tr>
      ));
    }

    if (!orders || orders.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="text-center p-10 text-gray-500 dark:text-gray-400">
            No orders found for these filters.
          </td>
        </tr>
      );
    }

    return orders.map((o) => {
      const id = o?._id || '';
      const created = o?.createdAt ? new Date(o.createdAt) : null;
      const total = Number(o?.totalPrice || 0);

      const tone =
        (o?.status || '').toLowerCase() === 'cancelled'
          ? 'red'
          : o?.isDelivered || (o?.status || '').toLowerCase() === 'delivered'
          ? 'green'
          : 'yellow';

      return (
        <tr key={id || Math.random()} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
          <Td>
            {id ? (
              <Link to={`/admin/order/${id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                {shortId(id)}
              </Link>
            ) : (
              '—'
            )}
          </Td>

          <Td className="dark:text-gray-200">{o?.user?.email || o?.shippingAddress?.fullName || '—'}</Td>

          <Td align="right" className="dark:text-gray-200">
            {currencyFormatter.format(total).replace(/\u00A0/, '') /* keep format consistent */}
          </Td>

          <Td className="dark:text-gray-200">{o?.paymentMethod || '—'}</Td>

          <Td>
            <Badge tone={tone}>
              {o?.status || (o?.isDelivered ? 'Delivered' : 'Created')}
            </Badge>
          </Td>

          <Td className="dark:text-gray-200">{created ? created.toLocaleString() : '—'}</Td>

          <Td className="text-center">
            {id ? <Link to={`/admin/order/${id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">View</Link> : '—'}
          </Td>
        </tr>
      );
    });
  }, [orders, loading, currencyFormatter]);

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold dark:text-white">Orders</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">{displayedCountText}</div>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm bg-white dark:bg-zinc-800 dark:border-zinc-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 dark:bg-zinc-700 dark:text-gray-400">
            <tr>
              <Th>Order ID</Th>
              <Th>Customer</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
            {rows}
          </tbody>
        </table>
      </div>

      {!loading && pageInfo?.pages > 1 && (
        <PaginationControls currentPage={pageInfo.page} totalPages={pageInfo.pages} onPageChange={onPageChange} />
      )}
    </div>
  );
}

// memoize component so it re-renders only when relevant props change
export default React.memo(OrdersTableInner);
