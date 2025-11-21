import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";

import StatCard from "../components/admin/dashboard/StatCard";
import RevenueChart from "../components/admin/dashboard/RevenueChart";
import RecentOrdersTable from "../components/admin/dashboard/RecentOrdersTable";

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

  const totals = useMemo(() => {
    const orderCount = orders.length;
    const productCount = products.length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const pending = orders.filter(o => (o.status || "").toLowerCase() === "created").length;
    const delivered = orders.filter(o => o.isDelivered || (o.status || "").toLowerCase() === "delivered").length;
    return { orderCount, productCount, revenue, pending, delivered };
  }, [orders, products]);

  const chartData = useMemo(() => {
    const dailyRevenue = orders.reduce((acc, order) => {
      if ((order.status || "").toLowerCase() === "cancelled") return acc;
      const date = new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      acc[date] = (acc[date] || 0) + Number(order.totalPrice || 0);
      return acc;
    }, {});
    return Object.keys(dailyRevenue)
      .map((date) => ({ name: date, Revenue: dailyRevenue[date] }))
      .sort((a,b) => new Date(a.name) - new Date(b.name))
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
    <AdminLayout>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Orders" value={loading ? "…" : totals.orderCount} hint={<Link to="/admin/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View orders</Link>} />
          <StatCard label="Revenue" value={loading ? "…" : `₹${totals.revenue.toFixed(2)}`} hint={<span className="text-xs text-gray-500 dark:text-gray-400">Last 50 orders</span>} />
          <StatCard label="Products" value={loading ? "…" : totals.productCount} hint={<Link to="/admin/products" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Manage products</Link>} />
          <StatCard label="Fulfillment" value={loading ? "…" : `${totals.delivered}/${totals.orderCount} delivered`} hint={<span className="text-xs text-yellow-700 dark:text-yellow-400">{totals.pending} pending</span>} />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Revenue Overview</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            {loading ? <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div> : <RevenueChart data={chartData} />}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold dark:text-white">Recent orders</h2>
              <Link to="/admin/orders" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</Link>
            </div>

            <RecentOrdersTable loading={loading} recentOrders={recentOrders} onView={(id) => navigate(`/admin/order/${id}`)} />
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="font-semibold mb-3 dark:text-white">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/create-product" className="px-4 py-2 rounded-lg bg-black text-white font-medium hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200">Create product</Link>
                <Link to="/admin/products" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">Manage products</Link>
                <Link to="/admin/orders" className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700">View orders</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
