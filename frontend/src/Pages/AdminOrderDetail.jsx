import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import AdminLayout from "../components/admin/AdminLayout";

const CACHE_TTL = 10 * 1000;

function readCache(orderId) {
  try {
    const raw = sessionStorage.getItem(`order:${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - (parsed._cachedAt || 0) > CACHE_TTL) {
      sessionStorage.removeItem(`order:${orderId}`);
      return null;
    }
    return parsed.data || null;
  } catch {
    return null;
  }
}

function writeCache(orderId, data) {
  try {
    sessionStorage.setItem(`order:${orderId}`, JSON.stringify({ _cachedAt: Date.now(), data }));
  } catch {
    // ignore cache failures
  }
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const controllerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
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
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      try {
        const { data } = await api.get(`/api/orders/${id}`, {
          signal: controllerRef.current.signal,
        });
        if (!mountedRef.current) return;
        setOrder(data || null);
        writeCache(id, data || null);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        if (!mountedRef.current) return;
        setError(err.response?.data?.message || err.message || "Failed to load order.");
      } finally {
        if (mountedRef.current) setLoading(false);
        controllerRef.current = null;
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    fetchOrder(true);
    const timer = setTimeout(() => fetchOrder(false), 600);
    return () => clearTimeout(timer);
  }, [id, fetchOrder]);

  const isDelivered = useMemo(
    () => Boolean(order?.isDelivered || (order?.status || "").toLowerCase() === "delivered"),
    [order]
  );
  const isCancelled = useMemo(
    () => (order?.status || "").toLowerCase() === "cancelled",
    [order]
  );

  const itemsTotal = useMemo(
    () =>
      (order?.orderItems || []).reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0
      ),
    [order]
  );

  const optimisticUpdate = (patch) => {
    setOrder((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const markDelivered = useCallback(async () => {
    if (!order || acting) return;

    const previous = order;
    optimisticUpdate({
      isDelivered: true,
      status: "Delivered",
      deliveredAt: new Date().toISOString(),
    });
    setActing(true);

    try {
      await api.put(`/api/orders/${order._id}/deliver`);
      showToast("Order marked as delivered");
      fetchOrder(false);
    } catch (err) {
      setOrder(previous);
      showToast(err.response?.data?.message || err.message || "Failed to mark delivered", "error");
    } finally {
      setActing(false);
    }
  }, [order, acting, fetchOrder]);

  const cancelOrder = useCallback(async () => {
    if (!order || acting) return;
    if (!window.confirm("Cancel this order? This action cannot be undone.")) return;

    const previous = order;
    optimisticUpdate({
      status: "Cancelled",
      cancelledAt: new Date().toISOString(),
    });
    setActing(true);

    try {
      await api.put(`/api/orders/${order._id}/cancel`, { reason: "Cancelled by admin" });
      showToast("Order cancelled", "info");
      fetchOrder(false);
    } catch (err) {
      setOrder(previous);
      showToast(err.response?.data?.message || err.message || "Failed to cancel order", "error");
    } finally {
      setActing(false);
    }
  }, [order, acting, fetchOrder]);

  const statusTone = isCancelled ? "red" : isDelivered ? "green" : "amber";
  const statusClass =
    statusTone === "green"
      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
      : statusTone === "red"
        ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">
              {loading ? "Loading..." : `Order #${String(order?._id || "").slice(-8)}`}
            </h1>
            {!loading && order?.createdAt && (
              <p className="mt-2 text-sm text-[var(--nm-muted)]">
                Placed {new Date(order.createdAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/admin/order/${order?._id}/tracking`} className="nm-btn-secondary text-sm">
              Update Tracking
            </Link>
            <button onClick={() => navigate("/admin/orders")} className="nm-btn-secondary text-sm">
              Back to Orders
            </button>
            <button
              disabled={acting || isDelivered || isCancelled}
              onClick={markDelivered}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isDelivered ? "Delivered" : acting ? "Working..." : "Mark Delivered"}
            </button>
            <button
              disabled={acting || isDelivered || isCancelled}
              onClick={cancelOrder}
              className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Cancel
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="space-y-5 lg:col-span-8">
            <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <h2 className="text-lg font-semibold">Shipping</h2>
              {loading ? (
                <p className="mt-3 text-sm text-[var(--nm-muted)]">Loading shipping details...</p>
              ) : (
                <>
                  <div className="mt-3 text-sm text-[var(--nm-muted)]">
                    <p className="font-semibold text-[var(--nm-text)]">
                      {order?.shippingAddress?.fullName || "--"}
                    </p>
                    <p>{order?.shippingAddress?.address || "--"}</p>
                    <p>
                      {order?.shippingAddress?.city || "--"},{" "}
                      {order?.shippingAddress?.postalCode || "--"}
                    </p>
                    <p>{order?.shippingAddress?.country || "--"}</p>
                  </div>
                  <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${statusClass}`}>
                    {order?.status || (isDelivered ? "Delivered" : "Created")}
                  </span>
                </>
              )}
            </article>

            <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <h2 className="text-lg font-semibold">Items</h2>
              <div className="mt-3 divide-y divide-[var(--nm-border)]">
                {(loading ? Array.from({ length: 2 }) : order?.orderItems || []).map((item, index) => (
                  <div key={item?._id || `${index}-${item?.product || "item"}`} className="flex items-center gap-3 py-3">
                    {loading ? (
                      <>
                        <div className="h-14 w-14 rounded-xl bg-[var(--nm-bg-elevated)] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 rounded bg-[var(--nm-bg-elevated)] animate-pulse" />
                          <div className="h-3 w-28 rounded bg-[var(--nm-bg-elevated)] animate-pulse" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--nm-border)] bg-[var(--nm-bg-elevated)]">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link to={`/product/${item.product}`} className="text-sm font-semibold hover:underline">
                            {item.title || "Product"}
                          </Link>
                          <p className="text-xs text-[var(--nm-muted)]">
                            Qty {item.qty} | Rs {Number(item.price || 0).toFixed(2)}
                            {item.size ? ` | Size ${item.size}` : ""}
                            {item.color ? ` | ${item.color}` : ""}
                          </p>
                        </div>
                        <div className="text-sm font-semibold">
                          Rs {(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <aside className="space-y-5 lg:col-span-4">
            <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <h2 className="text-lg font-semibold">Summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--nm-muted)]">Items</span>
                  <span className="font-semibold">Rs {itemsTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--nm-muted)]">Shipping</span>
                  <span className="font-semibold">Rs {Number(order?.shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--nm-muted)]">Tax</span>
                  <span className="font-semibold">Rs {Number(order?.taxPrice || 0).toFixed(2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[var(--nm-border)] pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>Rs {Number(order?.totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
              <h2 className="text-lg font-semibold">Payment</h2>
              <div className="mt-3 text-sm text-[var(--nm-muted)]">
                <p className="font-semibold text-[var(--nm-text)]">{order?.paymentMethod || "--"}</p>
                <p>
                  Paid:{" "}
                  {order?.isPaid
                    ? `Yes (${order?.paidAt ? new Date(order.paidAt).toLocaleString() : "-"})`
                    : "No"}
                </p>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
