import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { showToast } from "../utils/toast";

// ⭐️ 1. INPUT FIELD KA SIZE BADA KAR DIYA HAI (Dark mode support)
const Input = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="mt-1">
      <input
        id={id}
        name={id}
        {...props}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-4 py-2.5 bg-white
                   dark:bg-zinc-700 dark:border-zinc-600 dark:text-white
                   disabled:bg-gray-100 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
      />
    </div>
  </div>
);

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  
  const [activeTab, setActiveTab] = useState("profile");

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

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [pRes, oRes] = await Promise.all([
          api.get("/api/auth/profile"),
          api.get("/api/orders/myorders"),
        ]);
        if (!on) return;

        const u = pRes.data || {};
        setName(u.name || "");
        setEmail(u.email || "");
        setShippingAddress(
          u.shippingAddress || {
            fullName: "",
            address: "",
            city: "",
            postalCode: "",
            country: "",
          }
        );
        
        setOrders(oRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load profile.");
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        shippingAddress,
      };

      const { data } = await api.put("/api/auth/profile", payload);

      try { localStorage.setItem("user", JSON.stringify(data)); } catch {}
      try { if (typeof setUser === "function") dispatch(setUser(data)); } catch {}

      setName(data.name || "");
      setEmail(data.email || "");
      setShippingAddress(data.shippingAddress || shippingAddress);

      showToast("Profile updated successfully");
    } catch (err) {
      showToast("Failed to save profile: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.put(`/api/orders/${orderId}/cancel`, { reason: "Cancelled by user" });
      const { data } = await api.get("/api/orders/myorders");
      setOrders(data || []);
      showToast("Order cancelled");
    } catch (err) {
      showToast("Cancel failed: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem("user"); } catch {}
    try {
      if (typeof setUser === "function") dispatch(setUser(null));
      else dispatch({ type: "auth/logout" });
    } catch {}
    showToast("Logged out successfully");
    navigate("/");
  };

  const goToFirstProduct = (order) => {
    const first = order?.orderItems?.[0];
    if (!first?.product) return;
    navigate(`/product/${first.product}`);
  };

  if (loading) {
    // ⭐️ Skeleton updated for dark mode
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
          <h1 className="text-3xl font-extrabold dark:text-white">My Account</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-100 p-3 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
            {error}
          </div>
        )}
        
        {/* ⭐️ Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-zinc-700 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("profile")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-zinc-700"
              }`}
            >
              Profile Details
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-zinc-700"
              }`}
            >
              My Orders
              <span className="ml-2 bg-gray-100 text-gray-600 rounded-full py-0.5 px-2.5 text-xs font-medium dark:bg-zinc-700 dark:text-gray-300">
                {orders.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Profile Details Tab */}
        {activeTab === "profile" && (
          <form onSubmit={saveProfile} className="space-y-6">
            {/* Account Information */}
            <div className="rounded-xl border bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Account Information</h2>
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
                    disabled={true} // Email disabled
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email is used for login and cannot be changed.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="rounded-xl border bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Shipping Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Full Name"
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  />
                </div>
                <Input
                  label="City"
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
                <Input
                  label="Postal Code"
                  id="postalCode"
                  value={shippingAddress.postalCode}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                />
                <Input
                  label="Country"
                  id="country"
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
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
                disabled={saving}
                className={`inline-flex justify-center items-center gap-2 px-6 py-2 rounded-md font-medium ${saving ? "bg-gray-300 text-gray-700" : "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
            {orders.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                You have no orders yet —{" "}
                <Link to="/products" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const created = new Date(order.createdAt).toLocaleString();
                  const total = Number(order.totalPrice || 0).toFixed(2);
                  const isCancellable = !order.isDelivered && order.status !== "Cancelled";
                  const items = order.orderItems || [];
                  const first = items[0];
                  const titles = items.map((i) => i.title).filter(Boolean);
                  const shown = titles.slice(0, 3);
                  const more = Math.max(0, titles.length - shown.length);

                  return (
                    <div
                      key={order._id}
                      role="button"
                      onClick={() => goToFirstProduct(order)}
                      className="group border rounded-lg p-4 hover:shadow-md cursor-pointer transition dark:border-zinc-700 dark:hover:bg-zinc-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Order #{order._id.slice(-8)}
                          </div>
                          <div className="font-medium dark:text-white">{created}</div>
                          <div className="text-sm text-gray-700 dark:text-gray-200 mt-1">
                            Total: ₹{total}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              order.status === "Cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                : order.isDelivered
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300"
                            }`}
                          >
                            {order.status || (order.isDelivered ? "Delivered" : "Processing")}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelOrder(order._id);
                            }}
                            disabled={!isCancellable}
                            className={`text-sm px-3 py-1 rounded border ${
                              isCancellable
                                ? "text-red-600 bg-white hover:bg-red-50 dark:bg-zinc-800 dark:text-red-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
                                : "text-gray-400 bg-gray-50 cursor-not-allowed dark:bg-zinc-700 dark:text-gray-500 dark:border-zinc-700"
                            }`}
                            title={isCancellable ? "Cancel order" : "Cannot cancel"}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        {first?.image ? (
                          <div className="w-14 h-14 rounded bg-gray-100 dark:bg-zinc-700 overflow-hidden shrink-0">
                            <img
                              src={first.image}
                              alt={first.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-100 dark:bg-zinc-700 shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-600 dark:text-gray-300">Items</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {shown.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300"
                              >
                                {t}
                              </span>
                            ))}
                            {more > 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300">
                                +{more} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}