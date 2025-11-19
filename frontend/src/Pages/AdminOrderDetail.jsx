import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";

const CACHE_TTL = 10 * 1000; // 10s

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const fetchController = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (fetchController.current) fetchController.current.abort();
    };
  }, []);

  const readCache = useCallback((orderId) => {
    try {
      const raw = sessionStorage.getItem(`order:${orderId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || Date.now() - (parsed._cachedAt || 0) > CACHE_TTL) {
        sessionStorage.removeItem(`order:${orderId}`);
        return null;
      }
      return parsed.data || null;
    } catch (e) {
      return null;
    }
  }, []);

  const writeCache = useCallback((orderId, data) => {
    try {
      sessionStorage.setItem(
        `order:${orderId}`,
        JSON.stringify({ _cachedAt: Date.now(), data })
      );
    } catch (e) {}
  }, []);

  const fetchOrder = useCallback(
    async (useCache = true) => {
      setError("");
      if (useCache) {
        const cached = readCache(id);
        if (cached) {
          setOrder(cached);
          setLoading(false);
        } else {
          if (!order) setLoading(true);
        }
      } else {
        if (!order) setLoading(true);
      }

      if (fetchController.current) {
        try {
          fetchController.current.abort();
        } catch (e) {}
      }
      fetchController.current = new AbortController();

      try {
        const { data } = await api.get(`/api/orders/${id}`, {
          signal: fetchController.current.signal,
        });
        if (!mountedRef.current) return;
        setOrder(data);
        writeCache(id, data);
        setLoading(false);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (!mountedRef.current) return;
        setError(err.response?.data?.message || err.message || "Failed to load order.");
        setLoading(false);
      } finally {
        fetchController.current = null;
      }
    },
    [id, order, readCache, writeCache]
  );

  useEffect(() => {
    fetchOrder(true);
    // also refresh in background to ensure freshness shortly after mount
    const t = setTimeout(() => fetchOrder(false), 600);
    return () => clearTimeout(t);
  }, [fetchOrder]);

  const itemsTotal = useMemo(
    () =>
      (order?.orderItems || []).reduce(
        (s, it) => s + Number(it.price || 0) * Number(it.qty || 0),
        0
      ),
    [order]
  );

  const optimisticUpdate = useCallback((patch) => {
    setOrder((prev) => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  const markDelivered = useCallback(async () => {
    if (!order || acting) return;
    const prev = order;
    optimisticUpdate({ isDelivered: true, status: "Delivered", deliveredAt: new Date().toISOString() });
    setActing(true);
    try {
      await api.put(`/api/orders/${order._id}/deliver`);
      showToast("Order marked as delivered");
      // refresh in background to get authoritative data
      fetchOrder(false);
    } catch (err) {
      // rollback
      setOrder(prev);
      showToast(err.response?.data?.message || err.message || "Failed to mark delivered", "error");
    } finally {
      setActing(false);
    }
  }, [order, acting, optimisticUpdate, fetchOrder]);

  const cancelOrder = useCallback(async () => {
    if (!order || acting) return;
    if (!window.confirm("Cancel this order? This action cannot be undone.")) return;
    const prev = order;
    optimisticUpdate({ status: "Cancelled", cancelledAt: new Date().toISOString() });
    setActing(true);
    try {
      await api.put(`/api/orders/${order._id}/cancel`, { reason: "Cancelled by admin" });
      showToast("Order has been cancelled", "info");
      fetchOrder(false);
    } catch (err) {
      setOrder(prev);
      showToast(err.response?.data?.message || err.message || "Failed to cancel order", "error");
    } finally {
      setActing(false);
    }
  }, [order, acting, optimisticUpdate, fetchOrder]);

  const isDelivered = useMemo(
    () => !!(order?.isDelivered || (order?.status || "").toLowerCase() === "delivered"),
    [order]
  );
  const isCancelled = useMemo(
    () => (order?.status || "").toLowerCase() === "cancelled",
    [order]
  );

  const formattedPlacedAt = useMemo(() => {
    if (!order?.createdAt) return "";
    try {
      return new Date(order.createdAt).toLocaleString();
    } catch (e) {
      return order.createdAt;
    }
  }, [order?.createdAt]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100">
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:bg-zinc-800/90 dark:border-zinc-700">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/admin" className="font-bold text-lg dark:text-white">Admin Order Details</Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as <span className="text-black font-medium dark:text-white">Admin</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold dark:text-white">
              {loading ? <Skeleton w="w-64" h="h-8" /> : `Order #${String(order?._id || "").slice(-8)}`}
            </h1>
            {!loading && (
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Placed {formattedPlacedAt}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/orders")}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-700"
            >
              Back to orders
            </button>
            <button
              disabled={acting || isDelivered || isCancelled}
              onClick={markDelivered}
              className={`px-4 py-2 rounded-lg font-medium ${isDelivered ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:opacity-90"} text-white`}
            >
              {isDelivered ? "Delivered" : acting ? "Working..." : "Mark delivered"}
            </button>
            <button
              disabled={acting || isDelivered || isCancelled}
              onClick={cancelOrder}
              className={`px-4 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 ${isDelivered || isCancelled ? "opacity-50 cursor-not-allowed dark:border-red-600/30 dark:text-red-600/50" : "dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"}`}
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardTitle>Shipping</CardTitle>
              {loading ? (
                <div className="space-y-2 mt-2">
                  <Skeleton w="w-48" />
                  <Skeleton w="w-64" />
                  <Skeleton w="w-40" />
                </div>
              ) : (
                <>
                  <div className="mt-2 text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">{order.shippingAddress?.fullName || "—"}</div>
                    <div className="text-gray-600 dark:text-gray-300">{order.shippingAddress?.address || "—"}</div>
                    <div className="text-gray-600 dark:text-gray-300">{order.shippingAddress?.city || "—"}, {order.shippingAddress?.postalCode || "—"}</div>
                    <div className="text-gray-600 dark:text-gray-300">{order.shippingAddress?.country || "—"}</div>
                  </div>

                  <div className="mt-3">
                    <Badge tone={isCancelled ? "red" : isDelivered ? "green" : "yellow"}>
                      {order.status || (isDelivered ? "Delivered" : "Created")}
                    </Badge>
                  </div>
                </>
              )}
            </Card>

            <Card>
              <CardTitle>Items</CardTitle>
              <div className="mt-3 divide-y divide-gray-200 dark:divide-zinc-700">
                {(loading ? Array.from({ length: 2 }) : order.orderItems || []).map((it, idx) => {
                  const key = it?._id || `${idx}-${it?.product || "p"}`;
                  return (
                    <div key={key} className="py-3 flex items-center gap-3">
                      {loading ? (
                        <>
                          <Skeleton w="w-14" h="h-14" rounded />
                          <div className="flex-1">
                            <Skeleton w="w-48" />
                            <Skeleton w="w-24" />
                          </div>
                          <Skeleton w="w-20" />
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden shrink-0">
                            {it.image ? (
                              <img
                                alt={it.title}
                                src={it.image}
                                loading="lazy"
                                className="object-cover w-full h-full"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }}
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${it.product}`} className="text-sm font-medium hover:underline dark:text-white">
                              {it.title || "Product"}
                            </Link>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Qty: {it.qty} • ₹{Number(it.price || 0).toFixed(2)}{it.size ? ` • Size ${it.size}` : ""}{it.color ? ` • ${it.color}` : ""}
                            </div>
                          </div>
                          <div className="text-sm font-medium dark:text-white">
                            ₹{(Number(it.price || 0) * Number(it.qty || 0)).toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardTitle>Summary</CardTitle>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Items">{loading ? <Skeleton w="w-16" /> : `₹${itemsTotal.toFixed(2)}`}</Row>
                <Row label="Shipping">{loading ? <Skeleton w="w-12" /> : `₹${Number(order?.shippingPrice || 0).toFixed(2)}`}</Row>
                <Row label="Tax">{loading ? <Skeleton w="w-12" /> : `₹${Number(order?.taxPrice || 0).toFixed(2)}`}</Row>
                <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 mt-2 flex items-center justify-between">
                  <div className="text-gray-600 dark:text-gray-300 font-medium">Total</div>
                  <div className="text-xl font-extrabold dark:text-white">{loading ? <Skeleton w="w-20" h="h-6" /> : `₹${Number(order?.totalPrice || 0).toFixed(2)}`}</div>
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle>Payment</CardTitle>
              {loading ? (
                <div className="mt-3 space-y-2">
                  <Skeleton w="w-24" />
                  <Skeleton w="w-20" />
                </div>
              ) : (
                <div className="mt-3 text-sm">
                  <div className="font-medium dark:text-white">{order.paymentMethod || "—"}</div>
                  <div className="text-gray-500 dark:text-gray-400">Paid: {order.isPaid ? `Yes (${new Date(order.paidAt).toLocaleString()})` : "No"}</div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI helpers */
function Card({ children }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">{children}</div>;
}
function CardTitle({ children }) {
  return <h2 className="font-semibold text-lg dark:text-white">{children}</h2>;
}
function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-600 dark:text-gray-300">{label}</div>
      <div className="font-medium dark:text-white">{children}</div>
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
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${toneClasses}`}>{children}</span>;
}
function Skeleton({ w = "w-full", h = "h-4", rounded = false }) {
  return <div className={`${w} ${h} ${rounded ? "rounded-md" : "rounded"} bg-gray-200 dark:bg-zinc-700 animate-pulse`} />;
}
