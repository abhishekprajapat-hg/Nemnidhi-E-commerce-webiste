import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api/axios";
import AdminLayout from "../components/admin/AdminLayout";

export default function AdminOrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});

  const [order, setOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const alreadyShipped = Boolean(order?.tracking?.trackingId);

  const fetchOrder = useCallback(async () => {
    if (!user?.token) {
      setError("You are not authenticated.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(`/api/orders/${id}`);
      setOrder(data);
      setCourier(data?.tracking?.courier || "");
      setTrackingId(data?.tracking?.trackingId || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const submitHandler = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!courier.trim() || !trackingId.trim()) {
      setError("Courier name and tracking number are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.put(`/api/orders/${id}/tracking`, {
        courier: courier.trim(),
        trackingId: trackingId.trim(),
      });
      await fetchOrder();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update tracking details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-10 text-sm text-[var(--nm-muted)]">Loading order details...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="py-10 text-sm text-red-600">Order not found.</div>
      </AdminLayout>
    );
  }

  const statusClass =
    order.status === "Delivered"
      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
      : order.status === "Cancelled"
        ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
        : order.status === "Shipped"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="nm-display text-4xl font-semibold leading-none sm:text-5xl">
              Shipment Tracking
            </h1>
            <p className="mt-2 text-sm text-[var(--nm-muted)]">
              Add or edit courier details for this order.
            </p>
          </div>
          <Link to={`/admin/order/${order._id}`} className="nm-btn-secondary text-sm">
            Back to Order
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                Order #{order.orderId || order._id.slice(-8)}
              </p>
              <p className="text-sm text-[var(--nm-muted)]">
                Placed {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${statusClass}`}>
              {order.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--nm-muted)]">
            <b className="text-[var(--nm-text)]">Total:</b> Rs {order.totalPrice}
          </p>
        </article>

        {alreadyShipped && (
          <article className="rounded-3xl border border-green-300 bg-green-50 p-5 text-sm dark:bg-green-500/10 dark:text-green-300">
            <h3 className="font-semibold">Current Tracking Details</h3>
            <p className="mt-2">
              <b>Courier:</b> {order.tracking.courier}
            </p>
            <p>
              <b>Tracking No:</b> {order.tracking.trackingId}
            </p>
            {order.tracking.trackingUrl && (
              <a
                href={order.tracking.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold underline"
              >
                Track shipment
              </a>
            )}
          </article>
        )}

        <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
          <h3 className="text-lg font-semibold">
            {alreadyShipped ? "Update Tracking" : "Add Tracking Information"}
          </h3>

          <form onSubmit={submitHandler} className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                Courier Name
              </span>
              <input
                type="text"
                placeholder="DTDC / Blue Dart / India Post"
                value={courier}
                onChange={(event) => setCourier(event.target.value)}
                className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                Tracking / AWB Number
              </span>
              <input
                type="text"
                placeholder="Enter tracking number"
                value={trackingId}
                onChange={(event) => setTrackingId(event.target.value)}
                className="w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-3 text-sm focus:border-[var(--nm-accent)] focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : alreadyShipped ? "Update Tracking" : "Mark as Shipped"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="nm-btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </article>
      </div>
    </AdminLayout>
  );
}
