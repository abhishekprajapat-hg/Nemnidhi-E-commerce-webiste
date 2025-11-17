import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AdminLayout from '../components/AdminLayout';
import { showToast } from '../utils/toast';
import { Link } from 'react-router-dom';
// import OrderFilterPanel from '../components/OrderFilterPanel'; // 👈 REMOVED

// Pagination Component (Unchanged)
function PaginationControls({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium border rounded-md bg-white disabled:opacity-50 dark:bg-zinc-700 dark:border-zinc-600 dark:text-gray-300"
      >
        Next
      </button>
    </div>
  );
}

// UI Helpers (Unchanged)
function Badge({ children, tone = "yellow" }) {
  const toneClasses =
    tone === "green"
      ? "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300"
      : tone === "red"
      ? "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${toneClasses}`}>
      {children}
    </span>
  );
}
function Th({ children, align = "left" }) {
  return (
    <th className={`px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-${align}`}>
      {children}
    </th>
  );
}
function Td({ children, align = "left", className = "" }) {
  return (
    <td className={`px-3 py-3 text-sm dark:text-gray-200 ${align === "right" ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}
function Skeleton({ w = "w-full", h = "h-4" }) {
  return <div className={`${w} ${h} rounded bg-gray-200 dark:bg-zinc-700 animate-pulse`} />;
}


export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState({});
  const [filters, setFilters] = useState({ q: '', status: '', page: 1, limit: 20, sort: '-createdAt' });
  const [pageInfo, setPageInfo] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState(''); // For controlled search input

  const loadOrders = async (query) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(query).toString();
      const { data } = await api.get(`/api/orders?${params}`);
      setOrders(data.orders || []);
      setFacets(data.facets || {});
      setPageInfo({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      console.error(err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(filters);
  }, [filters]); // 👈 Filters change hone par load ho

  // ⭐️ Simpler apply handler for text search and status select
  const onSearch = () => {
    const newFilters = { ...filters, q: searchQuery, page: 1 };
    setFilters(newFilters);
  };
  
  const onStatusChange = (newStatus) => {
    const newFilters = { ...filters, status: newStatus, page: 1 };
    setFilters(newFilters);
  };

  // Pagination handler remains the same, but uses filters dependency
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pageInfo.pages) return;
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          
          {/* ⭐️ 1. INLINE FILTER / SEARCH UI (Replaced Panel) */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Filter Orders</h3>
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Search Bar */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  placeholder="Search by ID, email, or product title"
                  className="w-full border border-gray-300 dark:border-zinc-700 dark:bg-zinc-700 dark:text-white px-3 py-2 rounded-lg"
                />
                <button
                    onClick={onSearch}
                    className="absolute right-0 top-0 h-full px-4 text-sm font-medium rounded-r-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                    Search
                </button>
              </div>

              {/* Status Selector */}
              <div className="w-full md:w-48 shrink-0">
                <select
                  value={filters.status}
                  onChange={(e) => onStatusChange(e.target.value)}
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

            {/* Facet Filters (Quick Status Buttons) */}
            {facets?.status?.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-700/50 flex-wrap">
                {facets.status.map((f) => (
                  <button
                    key={f.status}
                    onClick={() => onStatusChange(f.status)}
                    className={`px-3 py-1 text-sm rounded-full transition ${
                        filters.status === f.status
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {f.status} ({f.count})
                  </button>
                ))}
                {/* Reset button agar koi status select ho to */}
                {filters.status && (
                    <button onClick={() => onStatusChange('')} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300">
                        Clear Status
                    </button>
                )}
              </div>
            )}
          </div>
          
          {/* Main Content (Table) */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold dark:text-white">Orders</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {orders.length} of {pageInfo.total}
              </div>
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
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <Td><Skeleton w="w-16" /></Td>
                        <Td><Skeleton w="w-32" /></Td>
                        <Td align="right"><Skeleton w="w-12" /></Td>
                        <Td><Skeleton w="w-10" /></Td>
                        <Td><Skeleton w="w-20" /></Td>
                        <Td><Skeleton w="w-28" /></Td>
                        <Td><Skeleton w="w-10" /></Td>
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-10 text-gray-500 dark:text-gray-400">
                        No orders found for these filters.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                        <Td>
                          <Link to={`/admin/order/${o._id}`} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                            #{o._id.slice(-6)}
                          </Link>
                        </Td>
                        <Td className='dark:text-gray-200'>{o.user?.email || o.shippingAddress?.fullName || '—'}</Td>
                        <Td align="right" className='dark:text-gray-200'>₹{o.totalPrice.toFixed(2)}</Td>
                        <Td className='dark:text-gray-200'>{o.paymentMethod}</Td>
                        <Td>
                          <Badge
                            tone={
                              (o.status || "").toLowerCase() === "cancelled"
                                ? "red"
                                : o.isDelivered || (o.status || "").toLowerCase() === "delivered"
                                ? "green"
                                : "yellow"
                            }
                          >
                            {o.status || (o.isDelivered ? "Delivered" : "Created")}
                          </Badge>
                        </Td>
                        <Td className='dark:text-gray-200'>{new Date(o.createdAt).toLocaleString()}</Td>
                        <Td className="text-center">
                          <Link
                            to={`/admin/order/${o._id}`}
                            className="text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            View
                          </Link>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {!loading && pageInfo.pages > 1 && (
              <PaginationControls
                currentPage={pageInfo.page}
                totalPages={pageInfo.pages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}