import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api/axios";

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth || {});

  const [order, setOrder] = useState(null);
  const [courier, setCourier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const alreadyShipped = !!order?.tracking?.trackingId;

  /* ================= Fetch Order ================= */
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

      if (data?.tracking?.courier) setCourier(data.tracking.courier);
      if (data?.tracking?.trackingId)
        setTrackingId(data.tracking.trackingId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* ================= Submit Tracking ================= */
  const submitHandler = async (e) => {
    e.preventDefault();
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

    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update tracking details."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= States ================= */
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-500">
        Loading order details…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-sm text-red-600">
        Order not found.
      </div>
    );
  }

  const statusStyle =
    order.status === "Delivered"
      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
      : order.status === "Cancelled"
      ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
      : order.status === "Shipped"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* ================= Header ================= */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            Update Shipment Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add or modify courier details for this order
          </p>
        </div>

        <Link
          to={`/admin/order/${order._id}`}
          className="text-sm px-4 py-2 border rounded dark:border-zinc-700"
        >
          ← Back to order
        </Link>
      </div>

      {/* ================= Error ================= */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ================= Order Summary ================= */}
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold dark:text-white">
              Order #{order.orderId || order._id.slice(-8)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Placed{" "}
              {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle}`}
          >
            {order.status}
          </span>
        </div>

        <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
          <b>Total Amount:</b> ₹{order.totalPrice}
        </div>
      </div>

      {/* ================= Existing Tracking ================= */}
      {alreadyShipped && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-5 text-sm dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-300">
          <h3 className="font-semibold mb-2">Current Tracking Details</h3>
          <p>
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
              className="inline-block mt-2 text-blue-600 hover:underline"
            >
              Track shipment →
            </a>
          )}
        </div>
      )}

      {/* ================= Tracking Form ================= */}
      <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
        <h3 className="font-semibold mb-4 dark:text-white">
          {alreadyShipped ? "Update Tracking" : "Add Tracking Information"}
        </h3>

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Courier Name
            </label>
            <input
              type="text"
              placeholder="DTDC / Blue Dart / India Post"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">
              Tracking / AWB Number
            </label>
            <input
              type="text"
              placeholder="Enter tracking number"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {saving
                ? "Saving…"
                : alreadyShipped
                ? "Update Tracking"
                : "Mark as Shipped"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border px-4 py-2 text-sm dark:border-zinc-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
