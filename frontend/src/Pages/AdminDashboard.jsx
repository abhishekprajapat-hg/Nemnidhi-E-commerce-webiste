import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/AdminLayout"; // 👈 AdminLayout import
// ⭐️ 1. Chart ke liye imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext"; // ⭐️ Dark mode hook

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const oRes = await api.get("/api/orders", { params: { limit: 50 } });
        if (!on) return;
        setOrders(Array.isArray(oRes.data) ? oRes.data : (oRes.data.orders || []));

        let p = [];
        try {
          const p1 = await api.get("/api/products", { params: { limit: 100 } });
          p = Array.isArray(p1.data) ? p1.data : (p1.data.products || []);
        } catch {
          const p2 = await api.get("/api/products/product");
          p = Array.isArray(p2.data) ? p2.data : (p2.data.products || []);
        }
        if (!on) return;
        setProducts(p);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load dashboard.");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  // KPIs
  const totals = useMemo(() => {
    const orderCount = orders.length;
    const productCount = products.length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const pending = orders.filter(o => (o.status || "").toLowerCase() === "created").length;
    const delivered = orders.filter(o => o.isDelivered || (o.status || "").toLowerCase() === "delivered").length;
    return { orderCount, productCount, revenue, pending, delivered };
  }, [orders, products]);

  // Chart data
  const chartData = useMemo(() => {
    const dailyRevenue = orders.reduce((acc, order) => {
      if (order.status !== "Cancelled") {
        const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += order.totalPrice;
      }
      return acc;
    }, {});

    return Object.keys(dailyRevenue)
      .map((date) => ({
        name: date,
        Revenue: dailyRevenue[date],
      }))
      .sort((a, b) => new Date(a.name) - new Date(b.name))
      .slice(-15);
  }, [orders]);


  const recentOrders = useMemo(
    () => [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [orders]
  );

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (Number(b.rating || 0) - Number(a.rating || 0)) || (Number(a.countInStock || 0) - Number(b.countInStock || 0)))
      .slice(0, 6);
  }, [products]);

  return (
    // ⭐️ 2. AdminLayout wrapper
    <AdminLayout>
      {/* ⭐️ 3. Redundant header hata diya hai, kyunki AdminLayout mein already hai */}
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Key metrics and recent activity.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Orders"
            value={loading ? "…" : totals.orderCount}
            hint={<Link to="/admin/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View orders</Link>}
          />
          <StatCard
            label="Revenue"
            value={loading ? "…" : `₹${totals.revenue.toFixed(2)}`}
            hint={<span className="text-xs text-gray-500 dark:text-gray-400">Last 50 orders</span>}
          />
          <StatCard
            label="Products"
            value={loading ? "…" : totals.productCount}
            hint={<Link to="/admin/products" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Manage products</Link>}
          />
          <StatCard
            label="Fulfillment"
            value={loading ? "…" : `${totals.delivered}/${totals.orderCount} delivered`}
            hint={<span className="text-xs text-yellow-700 dark:text-yellow-400">{totals.pending} pending</span>}
          />
        </div>

        {/* Revenue Chart Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Revenue Overview</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            {loading ? (
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
            ) : (
              <RevenueChart data={chartData} />
            )}
          </div>
        </div>

        {/* Recent Orders + Quick Actions */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold dark:text-white">Recent orders</h2>
              <Link to="/admin/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 dark:bg-zinc-700 dark:text-gray-400">
                  <tr>
                    <Th>ID</Th>
                    <Th>Date</Th>
                    <Th align="right">Total</Th>
                    <Th>Status</Th>
                    <Th>Customer</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                  {(loading ? Array.from({ length: 6 }) : recentOrders).map((o, idx) => (
                    <tr key={o?._id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                      <Td>{loading ? <Skeleton w="w-24" /> : `#${String(o._id).slice(-6)}`}</Td>
                      <Td>{loading ? <Skeleton w="w-28" /> : new Date(o.createdAt).toLocaleString()}</Td>
                      <Td align="right">{loading ? <Skeleton w="w-16" /> : `₹${Number(o.totalPrice || 0).toFixed(2)}`}</Td>
                      <Td>
                        {loading ? (
                          <Skeleton w="w-16" />
                        ) : (
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
                        )}
                      </Td>
                      <Td>{loading ? <Skeleton w="w-24" /> : (o.shippingAddress?.fullName || o.user?.name || "—")}</Td>
                      <Td align="right">
                        {loading ? (
                          <Skeleton w="w-14" />
                        ) : (
                          <button
                            onClick={() => navigate(`/admin/order/${o._id}`)}
                            className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700 hover:bg-gray-100"
                          >
                            View
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="font-semibold mb-3 dark:text-white">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/admin/create-product"
                  className="px-4 py-2 rounded-lg bg-black text-white font-medium hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                  Create product
                </Link>
                <Link
                  to="/admin/products"
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  Manage products
                </Link>
                <Link
                  to="/admin/orders"
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  View orders
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold dark:text-white">Top products</h2>
                <Link to="/admin/products" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">All products</Link>
              </div>

              <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
                {(loading ? Array.from({ length: 6 }) : topProducts).map((p, idx) => (
                  <li key={p?._id || idx} className="py-3 flex items-center gap-3">
                    {loading ? (
                      <>
                        <Skeleton h="h-12" w="w-12" rounded />
                        <div className="flex-1">
                          <Skeleton w="w-40" />
                          <Skeleton w="w-24" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden shrink-0">
                          {p.images?.[0] ? (
                            <img
                              alt={p.title}
                              src={p.images[0]}
                              className="object-cover w-full h-full"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }}
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium dark:text-white">{p.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">₹{Number(p.price || 0).toFixed(2)} • Stock {p.countInStock ?? 0}</div>
                        </div>
                        <button
                          onClick={() => navigate(`/admin/product/${p._id}`)}
                          className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

/* ————— Small UI helpers (Light/Dark theme) ————— */

function RevenueChart({ data }) {
  const { theme } = useTheme(); // ⭐️ Hook to get current theme
  const isDark = theme === 'dark';

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#3f3f46" : "#e0e0e0"} vertical={false} />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke={isDark ? "#a1a1aa" : "#6b7280"} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} stroke={isDark ? "#a1a1aa" : "#6b7280"} tickFormatter={(val) => `₹${val/1000}k`} />
          <Tooltip 
            cursor={{ fill: isDark ? '#3f3f46' : '#fafafa' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: `1px solid ${isDark ? '#3f3f46' : '#e0e0e0'}`,
              backgroundColor: isDark ? '#27272a' : '#ffffff'
            }}
            formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']} 
          />
          <Bar dataKey="Revenue" fill={isDark ? "#f4f4f5" : "#111827"} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
      <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-extrabold dark:text-white">{value}</div>
      <div className="mt-1">{hint}</div>
    </div>
  );
}

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
    <th className={`px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-${align}`}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }) {
  return (
    <td className={`px-3 py-3 text-sm dark:text-gray-200 ${align === "right" ? "text-right font-medium" : ""}`}>
      {children}
    </td>
  );
}

function Skeleton({ w = "w-full", h = "h-4", rounded = false }) {
  return <div className={`${w} ${h} ${rounded ? "rounded-md" : "rounded"} bg-gray-200 dark:bg-zinc-700 animate-pulse`} />;
}