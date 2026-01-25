import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
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

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });

  // Keep original profile snapshot to determine dirty state
  const [initialData, setInitialData] = useState(null);

  // mounted ref to avoid state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        // parallel requests; they will be aborted if necessary
        const [pRes, oRes] = await Promise.all([
          api.get("/api/auth/profile", { signal: controller.signal }),
          api.get("/api/orders/myorders", { signal: controller.signal }),
        ]);

        if (!mountedRef.current) return;

        const u = pRes.data || {};
        const fetchedShipping = u.shippingAddress || {
          fullName: "",
          address: "",
          city: "",
          postalCode: "",
          country: "",
        };

        setName(u.name || "");
        setEmail(u.email || "");
        setShippingAddress(fetchedShipping);
        setOrders(oRes.data || []);

        setInitialData({
          name: u.name || "",
          shippingAddress: fetchedShipping,
        });
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") {
          // fetch aborted - ignore
          return;
        }
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load profile.",
        );
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, []);

  // helper to dispatch setUser safely
  const safeDispatchUser = useCallback(
    (value) => {
      try {
        if (typeof setUser === "function") dispatch(setUser(value));
        else dispatch({ type: "auth/setUser", payload: value });
      } catch {
        // swallow
      }
    },
    [dispatch],
  );

  // compute dirty state: have changes been made since initial load?
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    try {
      return (
        initialData.name !== name ||
        JSON.stringify(initialData.shippingAddress || {}) !==
          JSON.stringify(shippingAddress || {})
      );
    } catch {
      return true;
    }
  }, [initialData, name, shippingAddress]);

  const saveProfile = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!isDirty) {
        showToast("No changes to save");
        return;
      }
      setSaving(true);
      try {
        const payload = { name, shippingAddress };
        const { data } = await api.put("/api/auth/profile", payload);

        // update localStorage & redux safely
        try {
          localStorage.setItem("user", JSON.stringify(data));
        } catch {}

        safeDispatchUser(data);

        // update local state from server response to be fully in sync
        setName(data.name || "");
        setEmail(data.email || "");
        setShippingAddress(data.shippingAddress || shippingAddress);

        // refresh initial snapshot
        setInitialData({
          name: data.name || "",
          shippingAddress: data.shippingAddress || shippingAddress,
        });

        showToast("Profile updated successfully");
      } catch (err) {
        showToast(
          "Failed to save profile: " +
            (err.response?.data?.message || err.message),
          "error",
        );
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [name, shippingAddress, safeDispatchUser, isDirty],
  );

  // Optimistic cancel order: update UI immediately, revert on failure
  const cancelOrder = useCallback(
    async (orderId) => {
      if (!window.confirm("Are you sure you want to cancel this order?"))
        return;

      // mark optimistic update
      const prevOrders = orders;
      const optimistic = prevOrders.map((o) =>
        o._id === orderId
          ? { ...o, status: "Cancelled", isDelivered: false }
          : o,
      );
      setOrders(optimistic);

      try {
        await api.put(`/api/orders/${orderId}/cancel`, {
          reason: "Cancelled by user",
        });
        // fetch fresh orders to ensure accuracy
        const { data } = await api.get("/api/orders/myorders");
        if (mountedRef.current) setOrders(data || []);
        showToast("Order cancelled");
      } catch (err) {
        // revert
        if (mountedRef.current) setOrders(prevOrders);
        showToast(
          "Cancel failed: " + (err.response?.data?.message || err.message),
          "error",
        );
      }
    },
    [orders],
  );

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem("user");
    } catch {}
    try {
      safeDispatchUser(null);
    } catch {
      try {
        // fallback action
        dispatch({ type: "auth/logout" });
      } catch {}
    }
    showToast("Logged out successfully");
    navigate("/");
  }, [dispatch, navigate, safeDispatchUser]);

  // small helpers to update shippingAddress fields with stable refs
  const updateShippingField = useCallback((field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  }, []);

  // quick memo for orders count shown in tab
  const ordersCount = orders.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-zinc-700 w-48 rounded" />
          <div className="h-10 bg-gray-100 dark:bg-zinc-800 w-full rounded" />
          <div className="h-72 bg-gray-100 dark:bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdf7f7] dark:bg-zinc-900 min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold dark:text-white">
            My Account
          </h1>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-100 p-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="border-b border-gray-200 dark:border-zinc-700 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setSearchParams({ tab: "profile" })}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-zinc-700"
              }`}
            >
              Profile Details
            </button>
            <button
              onClick={() => setSearchParams({ tab: "orders" })}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-zinc-700"
              }`}
            >
              My Orders
              <span className="ml-2 bg-gray-100 text-gray-600 rounded-full py-0.5 px-2.5 text-xs font-medium dark:bg-zinc-700 dark:text-gray-300">
                {ordersCount}
              </span>
            </button>
          </nav>
        </div>

        {activeTab === "profile" && (
          <form
            onSubmit={saveProfile}
            className="space-y-6"
            aria-disabled={saving}
          >
            <div className="rounded-xl border bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <Input
                    label="Email"
                    id="email"
                    type="email"
                    value={email}
                    disabled={true}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email is used for login and cannot be changed.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) =>
                      updateShippingField("fullName", e.target.value)
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) =>
                      updateShippingField("address", e.target.value)
                    }
                  />
                </div>
                <Input
                  label="City"
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => updateShippingField("city", e.target.value)}
                />
                <Input
                  label="Postal Code"
                  id="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    updateShippingField("postalCode", e.target.value)
                  }
                />
                <Input
                  label="Country"
                  id="country"
                  value={shippingAddress.country}
                  onChange={(e) =>
                    updateShippingField("country", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleLogout}
                type="button"
                className="text-sm px-4 py-2 rounded-md border bg-white hover:bg-gray-50 text-red-600 font-medium dark:bg-zinc-800 dark:border-zinc-700 dark:text-red-400 dark:hover:bg-zinc-700"
              >
                Logout
              </button>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className={`inline-flex justify-center items-center gap-2 px-6 py-2 rounded-md font-medium ${
                  saving || !isDirty
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "orders" && (
          <OrdersList orders={orders} cancelOrder={cancelOrder} />
        )}
      </div>
    </div>
  );
}
