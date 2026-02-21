import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUser } from "../store/authSlice";
import { showToast } from "../utils/toast";
import Input from "../components/profile/Input";
import OrdersList from "../components/profile/OrdersList";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [initialData, setInitialData] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const [profileRes, ordersRes] = await Promise.all([
          api.get("/api/auth/profile", { signal: controller.signal }),
          api.get("/api/orders/myorders", { signal: controller.signal }),
        ]);

        if (!mountedRef.current) return;

        const user = profileRes.data || {};
        const shipping = user.shippingAddress || {
          fullName: "",
          address: "",
          city: "",
          postalCode: "",
          country: "",
        };

        setName(user.name || "");
        setEmail(user.email || "");
        setShippingAddress(shipping);
        setOrders(ordersRes.data || []);
        setInitialData({
          name: user.name || "",
          shippingAddress: shipping,
        });
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setError(err.response?.data?.message || err.message || "Failed to load profile.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, []);

  const safeDispatchUser = useCallback(
    (value) => {
      try {
        if (typeof setUser === "function") dispatch(setUser(value));
        else dispatch({ type: "auth/setUser", payload: value });
      } catch {
        // ignore
      }
    },
    [dispatch]
  );

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    try {
      return (
        initialData.name !== name ||
        JSON.stringify(initialData.shippingAddress || {}) !== JSON.stringify(shippingAddress || {})
      );
    } catch {
      return true;
    }
  }, [initialData, name, shippingAddress]);

  const saveProfile = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isDirty) {
        showToast("No changes to save");
        return;
      }

      setSaving(true);
      try {
        const payload = { name, shippingAddress };
        const { data } = await api.put("/api/auth/profile", payload);

        try {
          localStorage.setItem("user", JSON.stringify(data));
        } catch {
          // ignore
        }

        safeDispatchUser(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setShippingAddress(data.shippingAddress || shippingAddress);
        setInitialData({
          name: data.name || "",
          shippingAddress: data.shippingAddress || shippingAddress,
        });
        showToast("Profile updated successfully");
      } catch (err) {
        showToast(`Failed to save profile: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [name, shippingAddress, safeDispatchUser, isDirty]
  );

  const cancelOrder = useCallback(
    async (orderId) => {
      if (!window.confirm("Are you sure you want to cancel this order?")) return;

      const previous = orders;
      const optimistic = previous.map((order) =>
        order._id === orderId ? { ...order, status: "Cancelled", isDelivered: false } : order
      );
      setOrders(optimistic);

      try {
        await api.put(`/api/orders/${orderId}/cancel`, { reason: "Cancelled by user" });
        const { data } = await api.get("/api/orders/myorders");
        if (mountedRef.current) setOrders(data || []);
        showToast("Order cancelled");
      } catch (err) {
        if (mountedRef.current) setOrders(previous);
        showToast(`Cancel failed: ${err.response?.data?.message || err.message}`, "error");
      }
    },
    [orders]
  );

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("user");
    } catch {
      // ignore
    }
    try {
      safeDispatchUser(null);
    } catch {
      try {
        dispatch({ type: "auth/logout" });
      } catch {
        // ignore
      }
    }
    showToast("Logged out successfully");
    navigate("/");
  }, [dispatch, navigate, safeDispatchUser]);

  const updateShippingField = useCallback((field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  }, []);

  if (loading) {
    return (
      <div className="nm-shell py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-[var(--nm-bg-elevated)]" />
          <div className="h-12 rounded bg-[var(--nm-bg-elevated)]" />
          <div className="h-72 rounded bg-[var(--nm-bg-elevated)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">My Account</p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Profile</h1>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <nav className="mb-5 inline-flex rounded-full border border-[var(--nm-border)] bg-[var(--nm-card)] p-1">
        <button
          onClick={() => setSearchParams({ tab: "profile" })}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeTab === "profile"
              ? "bg-[var(--nm-accent)] text-white"
              : "text-[var(--nm-muted)] hover:text-[var(--nm-text)]"
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setSearchParams({ tab: "orders" })}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeTab === "orders"
              ? "bg-[var(--nm-accent)] text-white"
              : "text-[var(--nm-muted)] hover:text-[var(--nm-text)]"
          }`}
        >
          My Orders ({orders.length})
        </button>
      </nav>

      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="space-y-5" aria-disabled={saving}>
          <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Account Information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Name" id="name" value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="Email" id="email" type="email" value={email} disabled onChange={(event) => setEmail(event.target.value)} />
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Shipping Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  id="fullName"
                  value={shippingAddress.fullName}
                  onChange={(event) => updateShippingField("fullName", event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  id="address"
                  value={shippingAddress.address}
                  onChange={(event) => updateShippingField("address", event.target.value)}
                />
              </div>
              <Input
                label="City"
                id="city"
                value={shippingAddress.city}
                onChange={(event) => updateShippingField("city", event.target.value)}
              />
              <Input
                label="Postal Code"
                id="postalCode"
                value={shippingAddress.postalCode}
                onChange={(event) => updateShippingField("postalCode", event.target.value)}
              />
              <Input
                label="Country"
                id="country"
                value={shippingAddress.country}
                onChange={(event) => updateShippingField("country", event.target.value)}
              />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={handleLogout}
              type="button"
              className="rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              Logout
            </button>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "orders" && <OrdersList orders={orders} cancelOrder={cancelOrder} />}
    </div>
  );
}
