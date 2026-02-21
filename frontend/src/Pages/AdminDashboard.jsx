import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";
import StatCard from "../components/admin/dashboard/StatCard";
import RevenueChart from "../components/admin/dashboard/RevenueChart";
import RecentOrdersTable from "../components/admin/dashboard/RecentOrdersTable";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    async function fetchDashboard() {
      setLoading(true);
      setError("");
      try {
        const [ordersRes, productsRes] = await Promise.all([
          api.get("/api/orders", { params: { limit: 50 }, signal: controller.signal }),
          api.get("/api/products", { params: { limit: 100 }, signal: controller.signal }),
        ]);

        if (!mountedRef.current) return;

        const nextOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.orders || [];
        const nextProducts = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.products || [];

        setOrders(nextOrders);
        setProducts(nextProducts);
        setUpdatedAt(new Date());
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setError(err.response?.data?.message || err.message || "Failed to load dashboard.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, []);

  const totals = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    let delivered = 0;

    orders.forEach((order) => {
      revenue += Number(order.totalPrice || 0);
      const status = String(order.status || "").toLowerCase();
      if (status === "created" || status === "pending") pending += 1;
      if (order.isDelivered || status === "delivered") delivered += 1;
    });

    return {
      orderCount: orders.length,
      productCount: products.length,
      revenue,
      pending,
      delivered,
    };
  }, [orders, products]);

  const chartData = useMemo(() => {
    if (orders.length === 0) return [];
    const daily = Object.create(null);

    orders.forEach((order) => {
      if (String(order.status || "").toLowerCase() === "cancelled") return;
      const label = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      daily[label] = (daily[label] || 0) + Number(order.totalPrice || 0);
    });

    return Object.keys(daily)
      .map((name) => ({ name, Revenue: daily[name] }))
      .slice(-15);
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Overview</h1>
          <p className="mt-2 text-sm text-[var(--nm-muted)]">Key metrics and recent activity.</p>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Orders"
            value={loading ? "..." : totals.orderCount}
            hint={<Link to="/admin/orders" className="text-xs text-[var(--nm-accent-strong)] hover:underline">View orders</Link>}
          />
          <StatCard
            label="Revenue"
            value={loading ? "..." : `Rs ${totals.revenue.toFixed(2)}`}
            hint={<span className="text-xs text-[var(--nm-muted)]">Last {orders.length} orders</span>}
          />
          <StatCard
            label="Products"
            value={loading ? "..." : totals.productCount}
            hint={<Link to="/admin/products" className="text-xs text-[var(--nm-accent-strong)] hover:underline">Manage products</Link>}
          />
          <StatCard
            label="Fulfillment"
            value={loading ? "..." : `${totals.delivered}/${Math.max(1, totals.orderCount)} delivered`}
            hint={<span className="text-xs text-[var(--nm-muted)]">{totals.pending} pending</span>}
          />
        </div>

        <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
          <h2 className="text-xl font-semibold">Revenue Overview</h2>
          <div className="mt-4">
            {loading ? (
              <div className="flex h-80 items-center justify-center text-sm text-[var(--nm-muted)]">Loading chart...</div>
            ) : (
              <RevenueChart data={chartData} />
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm font-semibold text-[var(--nm-accent-strong)] hover:underline">
                View all
              </Link>
            </div>
            <RecentOrdersTable
              loading={loading}
              recentOrders={recentOrders}
              onView={(id) => navigate(`/admin/order/${id}`)}
            />
          </section>

          <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/create-product" className="nm-btn-primary text-sm">Create product</Link>
              <Link to="/admin/products" className="nm-btn-secondary text-sm">Manage products</Link>
              <Link to="/admin/orders" className="nm-btn-secondary text-sm">View orders</Link>
            </div>
          </section>
        </div>

        {updatedAt && <p className="text-xs text-[var(--nm-muted)]">Updated: {updatedAt.toLocaleTimeString()}</p>}
      </div>
    </AdminLayout>
  );
}
