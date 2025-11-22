// /src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";

import StatCard from "../components/admin/dashboard/StatCard";
import RevenueChart from "../components/admin/dashboard/RevenueChart";
import RecentOrdersTable from "../components/admin/dashboard/RecentOrdersTable";

const CACHE_KEY = "admin:dashboard";
const CACHE_TTL = 30 * 1000; // 30s cache for fast repeat views
const BACKGROUND_REFRESH_MS = 60 * 1000; // optional background refresh interval

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - (parsed._cachedAt || 0) > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ _cachedAt: Date.now(), data }));
  } catch {}
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);
  const bgRefreshRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    // try cached data for instant render
    const cached = readCache();
    if (cached) {
      if (cached.orders) setOrders(cached.orders);
      if (cached.products) setProducts(cached.products);
      if (mountedRef.current) setLoading(false);
      setLastUpdatedAt(cached._cachedAt ? new Date(cached._cachedAt) : new Date());
    }

    // fetch fresh
    const controller = new AbortController();
    controllerRef.current = controller;

    async function fetchAll() {
      setLoading((s) => (s ? s : true)); // keep loading true only if we didn't have cache, otherwise UI already shown
      setError("");
      try {
        // parallel requests with best-effort fallback
        const ordersPromise = api.get("/api/orders", { params: { limit: 50 }, signal: controller.signal });
        const productsPromise = api.get("/api/products", { params: { limit: 100 }, signal: controller.signal });

        const results = await Promise.allSettled([ordersPromise, productsPromise]);

        if (!mountedRef.current) return;

        // orders result
        let newOrders = [];
        if (results[0].status === "fulfilled") {
          const oRes = results[0].value;
          newOrders = Array.isArray(oRes.data) ? oRes.data : (oRes.data?.orders || []);
        } else {
          // fallback try alternate endpoint silently
          try {
            const fallback = await api.get("/api/orders?limit=50", { signal: controller.signal });
            newOrders = Array.isArray(fallback.data) ? fallback.data : (fallback.data?.orders || []);
          } catch {
            // ignore - leave newOrders empty
          }
        }

        // products result
        let newProducts = [];
        if (results[1].status === "fulfilled") {
          const pRes = results[1].value;
          newProducts = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.products || []);
        } else {
          // fallback endpoint
          try {
            const fallback = await api.get("/api/products/product", { signal: controller.signal });
            newProducts = Array.isArray(fallback.data) ? fallback.data : (fallback.data?.products || []);
          } catch {
            // ignore
          }
        }

        // commit state
        setOrders(newOrders);
        setProducts(newProducts);
        writeCache({ orders: newOrders, products: newProducts });
        setLastUpdatedAt(new Date());
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
          // aborted — ignore
        } else {
          console.error("AdminDashboard fetch error:", err);
          setError(err.response?.data?.message || err.message || "Failed to load dashboard.");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
        controllerRef.current = null;
      }
    }

    fetchAll();

    // set up optional background refresh to keep dashboard fresh without blocking UI
    bgRefreshRef.current = setInterval(() => {
      // fire & forget, don't update loading to avoid UI flicker
      (async () => {
        const ctl = new AbortController();
        try {
          const [oRes, pRes] = await Promise.allSettled([
            api.get("/api/orders", { params: { limit: 50 }, signal: ctl.signal }),
            api.get("/api/products", { params: { limit: 100 }, signal: ctl.signal }),
          ]);
          if (!mountedRef.current) return;
          const freshOrders = oRes.status === "fulfilled" ? (Array.isArray(oRes.value.data) ? oRes.value.data : (oRes.value.data?.orders || [])) : null;
          const freshProducts = pRes.status === "fulfilled" ? (Array.isArray(pRes.value.data) ? pRes.value.data : (pRes.value.data?.products || [])) : null;

          // apply if new data available (simple shallow compare length - cheap)
          if (Array.isArray(freshOrders) && freshOrders.length !== orders.length) setOrders(freshOrders);
          if (Array.isArray(freshProducts) && freshProducts.length !== products.length) setProducts(freshProducts);
          if (freshOrders || freshProducts) writeCache({ orders: freshOrders || orders, products: freshProducts || products });
          setLastUpdatedAt(new Date());
        } catch {
          // ignore background errors
        }
      })();
    }, BACKGROUND_REFRESH_MS);

    return () => {
      mountedRef.current = false;
      try { controller.abort(); } catch {}
      if (bgRefreshRef.current) clearInterval(bgRefreshRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // lightweight derivations (memoized)
  const totals = useMemo(() => {
    const orderCount = orders.length;
    const productCount = products.length;
    let revenue = 0;
    let pending = 0;
    let delivered = 0;
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const price = Number(o.totalPrice || 0);
      revenue += Number.isFinite(price) ? price : 0;
      const status = String(o.status || "").toLowerCase();
      if (status === "created" || status === "pending") pending++;
      if (o.isDelivered || status === "delivered") delivered++;
    }
    return { orderCount, productCount, revenue, pending, delivered };
  }, [orders, products]);

  // Pre-parse timestamps once, then compute daily revenue using plain strings
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const daily = Object.create(null); // plain map
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const status = String(o.status || "").toLowerCase();
      if (status === "cancelled") continue;
      const created = o.createdAt ? new Date(o.createdAt) : new Date();
      // local date label (short)
      const label = created.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      daily[label] = (daily[label] || 0) + Number(o.totalPrice || 0);
    }
    // convert to array and sort by parsing back to Date for stable order; small array so ok
    const arr = Object.keys(daily).map((k) => ({ name: k, Revenue: daily[k] }));
    arr.sort((a, b) => new Date(a.name) - new Date(b.name));
    return arr.slice(-15);
  }, [orders]);

  const recentOrders = useMemo(() => {
    if (!orders) return [];
    // easiest and cheap: copy top N using reduce to avoid a full sort of large arrays if unnecessary
    const N = 6;
    const top = [];
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const time = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      top.push({ o, time });
    }
    top.sort((a, b) => b.time - a.time);
    return top.slice(0, N).map((x) => x.o);
  }, [orders]);

  const topProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    // pick top by rating then by stock without cloning entire array repeatedly
    const copy = products.slice(0); // shallow copy
    copy.sort((a, b) => {
      const ra = Number(a.rating || 0);
      const rb = Number(b.rating || 0);
      if (rb !== ra) return rb - ra;
      const sa = Number(a.countInStock || 0);
      const sb = Number(b.countInStock || 0);
      return sb - sa;
    });
    return copy.slice(0, 6);
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
          <StatCard
            label="Orders"
            value={loading ? "…" : totals.orderCount}
            hint={<Link to="/admin/orders" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View orders</Link>}
          />
          <StatCard
            label="Revenue"
            value={loading ? "…" : `₹${totals.revenue.toFixed(2)}`}
            hint={<span className="text-xs text-gray-500 dark:text-gray-400">Last {orders.length} orders</span>}
          />
          <StatCard
            label="Products"
            value={loading ? "…" : totals.productCount}
            hint={<Link to="/admin/products" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Manage products</Link>}
          />
          <StatCard
            label="Fulfillment"
            value={loading ? "…" : `${totals.delivered}/${Math.max(1, totals.orderCount)} delivered`}
            hint={<span className="text-xs text-yellow-700 dark:text-yellow-400">{totals.pending} pending</span>}
          />
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

        {lastUpdatedAt && (
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">Updated: {lastUpdatedAt.toLocaleTimeString()}</div>
        )}
      </div>
    </AdminLayout>
  );
}
