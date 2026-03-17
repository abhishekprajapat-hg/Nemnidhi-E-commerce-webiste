import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api/axios";
import { setUser } from "../store/authSlice";
import { showToast } from "../utils/toast";
import Input from "../components/profile/Input";
import OrdersList from "../components/profile/OrdersList";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const TABS = ["profile", "saved", "orders"];
const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  phone: "",
  address: "",
  landmark: "",
  city: "",
  postalCode: "",
  country: "",
};
const REQUIRED_ADDRESS_FIELDS = ["fullName", "address", "city", "postalCode", "country"];

const normalizeAddress = (address = {}) => ({
  label: ["Home", "Work", "Other"].includes(address.label) ? address.label : "Home",
  fullName: String(address.fullName || "").trim(),
  phone: String(address.phone || "").trim(),
  address: String(address.address || "").trim(),
  landmark: String(address.landmark || "").trim(),
  city: String(address.city || "").trim(),
  postalCode: String(address.postalCode || "").trim(),
  country: String(address.country || "").trim(),
});

const mapSavedAddresses = (addresses = []) =>
  Array.isArray(addresses)
    ? addresses
        .filter(Boolean)
        .map((entry) => ({ _id: String(entry._id || ""), ...normalizeAddress(entry) }))
        .filter((entry) => entry._id)
    : [];

const isAddressComplete = (address = {}) =>
  REQUIRED_ADDRESS_FIELDS.every((field) => Boolean(String(address[field] || "").trim()));

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") || "").toLowerCase();
  const activeTab = TABS.includes(tabParam) ? tabParam : "profile";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [defaultAddressId, setDefaultAddressId] = useState("");
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressSaving, setAddressSaving] = useState(false);
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
        const nextSavedAddresses = mapSavedAddresses(user.savedAddresses);
        const fallbackShipping = normalizeAddress(user.shippingAddress || EMPTY_ADDRESS);
        let nextDefaultAddressId = String(user.defaultAddressId || "");
        if (
          !nextDefaultAddressId ||
          !nextSavedAddresses.some((entry) => String(entry._id) === nextDefaultAddressId)
        ) {
          nextDefaultAddressId = nextSavedAddresses[0]?._id || "";
        }

        setName(user.name || "");
        setEmail(user.email || "");
        setSavedAddresses(nextSavedAddresses);
        setDefaultAddressId(nextDefaultAddressId);
        setAddressDraft(
          nextSavedAddresses.length > 0
            ? normalizeAddress(nextSavedAddresses[0])
            : fallbackShipping
        );
        setEditingAddressId("");
        setSavedProducts(
          Array.isArray(user.savedProducts) ? user.savedProducts.filter(Boolean) : []
        );
        setOrders(ordersRes.data || []);
        setInitialData({
          name: user.name || "",
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

  const defaultAddress = useMemo(
    () =>
      savedAddresses.find((entry) => String(entry._id) === String(defaultAddressId)) ||
      savedAddresses[0] ||
      null,
    [savedAddresses, defaultAddressId]
  );
  const isAddressEditorOpen = Boolean(editingAddressId);
  const isAddingAddress = editingAddressId === "new";

  const isDirty = useMemo(() => {
    if (!initialData) return false;
    try {
      return initialData.name !== name;
    } catch {
      return true;
    }
  }, [initialData, name]);

  const profileCompletion = useMemo(() => {
    const addressForCompletion = defaultAddress || EMPTY_ADDRESS;
    const fields = [
      name,
      email,
      addressForCompletion.fullName,
      addressForCompletion.address,
      addressForCompletion.city,
      addressForCompletion.postalCode,
      addressForCompletion.country,
    ];
    const completed = fields.filter((field) => Boolean(String(field || "").trim())).length;
    return Math.round((completed / fields.length) * 100);
  }, [defaultAddress, email, name]);

  const userInitial = useMemo(() => {
    const source = String(name || email || "N").trim();
    return source ? source.charAt(0).toUpperCase() : "N";
  }, [email, name]);

  const activeOrdersCount = useMemo(
    () =>
      orders.filter((order) => {
        const status = String(order?.status || "").toLowerCase();
        return status !== "delivered" && status !== "cancelled";
      }).length,
    [orders]
  );

  const deliveredOrdersCount = useMemo(
    () =>
      orders.filter((order) => String(order?.status || "").toLowerCase() === "delivered").length,
    [orders]
  );

  const totalSpend = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order?.totalPrice || 0), 0),
    [orders]
  );

  const switchTab = useCallback(
    (tab) => {
      setSearchParams({ tab });
    },
    [setSearchParams]
  );

  const saveProfile = useCallback(
    async (event) => {
      event.preventDefault();
      if (!isDirty) {
        showToast("No changes to save");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          name,
          shippingAddress: defaultAddress ? normalizeAddress(defaultAddress) : normalizeAddress(EMPTY_ADDRESS),
        };
        const { data } = await api.put("/api/auth/profile", payload);
        const nextSavedAddresses = mapSavedAddresses(data.savedAddresses);
        let nextDefaultAddressId = String(data.defaultAddressId || "");
        if (
          !nextDefaultAddressId ||
          !nextSavedAddresses.some((entry) => String(entry._id) === nextDefaultAddressId)
        ) {
          nextDefaultAddressId = nextSavedAddresses[0]?._id || "";
        }

        try {
          const cached = JSON.parse(localStorage.getItem("user") || "null") || {};
          localStorage.setItem("user", JSON.stringify({ ...cached, ...data }));
        } catch {
          // ignore
        }

        safeDispatchUser((() => {
          try {
            const cached = JSON.parse(localStorage.getItem("user") || "null") || {};
            return { ...cached, ...data };
          } catch {
            return data;
          }
        })());
        setName(data.name || "");
        setEmail(data.email || "");
        setSavedAddresses(nextSavedAddresses);
        setDefaultAddressId(nextDefaultAddressId);
        if (!isAddressEditorOpen) {
          setAddressDraft(
            nextSavedAddresses.length > 0
              ? normalizeAddress(nextSavedAddresses[0])
              : normalizeAddress(data.shippingAddress || EMPTY_ADDRESS)
          );
        }
        setInitialData({
          name: data.name || "",
        });
        showToast("Profile updated successfully");
      } catch (err) {
        showToast(`Failed to save profile: ${err.response?.data?.message || err.message}`, "error");
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [defaultAddress, isAddressEditorOpen, isDirty, name, safeDispatchUser]
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

  const removeSavedProduct = useCallback(
    async (productId) => {
      const previous = savedProducts;
      const optimistic = previous.filter((product) => String(product?._id) !== String(productId));
      setSavedProducts(optimistic);

      try {
        const { data } = await api.delete(`/api/auth/wishlist/${productId}`);
        const next = Array.isArray(data?.savedProducts)
          ? data.savedProducts.filter(Boolean)
          : optimistic;
        if (mountedRef.current) setSavedProducts(next);
        showToast("Removed from saved products");
      } catch (err) {
        if (mountedRef.current) setSavedProducts(previous);
        showToast(`Failed to remove: ${err.response?.data?.message || err.message}`, "error");
      }
    },
    [savedProducts]
  );

  const getProductThumb = useCallback((product) => {
    const fromVariants = product?.variants?.find(
      (variant) => Array.isArray(variant?.images) && variant.images[0]
    )?.images?.[0];
    return fromVariants || "/placeholder.png";
  }, []);

  const getProductPrice = useCallback((product) => {
    if (Number.isFinite(Number(product?.minPrice))) return Number(product.minPrice);
    const fromVariants = product?.variants?.find(
      (variant) => Array.isArray(variant?.sizes) && variant.sizes[0]?.price
    )?.sizes?.[0]?.price;
    return Number(fromVariants || 0);
  }, []);

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

  const syncAddressBookToUser = useCallback(
    (addressBook) => {
      const nextSavedAddresses = mapSavedAddresses(addressBook.savedAddresses);
      const nextDefaultAddressId = String(addressBook.defaultAddressId || "");
      const nextShippingAddress = normalizeAddress(addressBook.shippingAddress || EMPTY_ADDRESS);
      try {
        const cached = JSON.parse(localStorage.getItem("user") || "null") || {};
        const nextUser = {
          ...cached,
          name,
          email,
          shippingAddress: nextShippingAddress,
          savedAddresses: nextSavedAddresses,
          defaultAddressId: nextDefaultAddressId,
        };
        localStorage.setItem("user", JSON.stringify(nextUser));
        safeDispatchUser(nextUser);
      } catch {
        safeDispatchUser({
          name,
          email,
          shippingAddress: nextShippingAddress,
          savedAddresses: nextSavedAddresses,
          defaultAddressId: nextDefaultAddressId,
        });
      }
    },
    [email, name, safeDispatchUser]
  );

  const applyAddressBookResponse = useCallback(
    (payload) => {
      const nextSavedAddresses = mapSavedAddresses(payload.savedAddresses);
      let nextDefaultAddressId = String(payload.defaultAddressId || "");
      if (
        !nextDefaultAddressId ||
        !nextSavedAddresses.some((entry) => String(entry._id) === nextDefaultAddressId)
      ) {
        nextDefaultAddressId = nextSavedAddresses[0]?._id || "";
      }
      const defaultEntry =
        nextSavedAddresses.find((entry) => String(entry._id) === nextDefaultAddressId) || null;
      const nextShippingAddress = defaultEntry
        ? normalizeAddress(defaultEntry)
        : normalizeAddress(payload.shippingAddress || EMPTY_ADDRESS);

      setSavedAddresses(nextSavedAddresses);
      setDefaultAddressId(nextDefaultAddressId);
      setEditingAddressId("");
      setAddressDraft(nextShippingAddress);

      syncAddressBookToUser({
        savedAddresses: nextSavedAddresses,
        defaultAddressId: nextDefaultAddressId,
        shippingAddress: nextShippingAddress,
      });
    },
    [syncAddressBookToUser]
  );

  const openAddAddressEditor = useCallback(() => {
    setEditingAddressId("new");
    setAddressDraft(
      normalizeAddress({
        ...EMPTY_ADDRESS,
        fullName: name || defaultAddress?.fullName || "",
        phone: defaultAddress?.phone || "",
      })
    );
  }, [defaultAddress?.fullName, defaultAddress?.phone, name]);

  const openEditAddressEditor = useCallback((address) => {
    if (!address?._id) return;
    setEditingAddressId(String(address._id));
    setAddressDraft(normalizeAddress(address));
  }, []);

  const closeAddressEditor = useCallback(() => {
    setEditingAddressId("");
    setAddressDraft(normalizeAddress(defaultAddress || EMPTY_ADDRESS));
  }, [defaultAddress]);

  const updateAddressDraftField = useCallback((field, value) => {
    setAddressDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveAddress = useCallback(async () => {
    if (!isAddressComplete(addressDraft)) {
      showToast("Please complete all required address fields", "error");
      return;
    }

    setAddressSaving(true);
    try {
      if (isAddingAddress) {
        const { data } = await api.post("/api/auth/addresses", {
          ...normalizeAddress(addressDraft),
          setDefault: savedAddresses.length === 0,
        });
        applyAddressBookResponse(data);
        showToast("Address added");
      } else {
        const updatedAddresses = savedAddresses.map((entry) =>
          String(entry._id) === String(editingAddressId)
            ? { ...entry, ...normalizeAddress(addressDraft) }
            : entry
        );
        const nextDefault = defaultAddressId || updatedAddresses[0]?._id || "";
        const defaultEntry =
          updatedAddresses.find((entry) => String(entry._id) === String(nextDefault)) || null;

        const { data } = await api.put("/api/auth/profile", {
          name,
          savedAddresses: updatedAddresses,
          defaultAddressId: nextDefault,
          shippingAddress: defaultEntry ? normalizeAddress(defaultEntry) : normalizeAddress(addressDraft),
        });
        applyAddressBookResponse(data);
        showToast("Address updated");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save address", "error");
    } finally {
      if (mountedRef.current) setAddressSaving(false);
    }
  }, [
    addressDraft,
    applyAddressBookResponse,
    defaultAddressId,
    editingAddressId,
    isAddingAddress,
    name,
    savedAddresses,
  ]);

  const setDefaultAddress = useCallback(
    async (addressId) => {
      if (!addressId) return;
      setAddressSaving(true);
      try {
        const { data } = await api.put(`/api/auth/addresses/${addressId}/default`);
        applyAddressBookResponse(data);
        showToast("Default address updated");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to update default address", "error");
      } finally {
        if (mountedRef.current) setAddressSaving(false);
      }
    },
    [applyAddressBookResponse]
  );

  const removeAddress = useCallback(
    async (addressId) => {
      if (!addressId) return;
      if (!window.confirm("Remove this address from your account?")) return;

      setAddressSaving(true);
      try {
        const { data } = await api.delete(`/api/auth/addresses/${addressId}`);
        applyAddressBookResponse(data);
        showToast("Address removed");
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to remove address", "error");
      } finally {
        if (mountedRef.current) setAddressSaving(false);
      }
    },
    [applyAddressBookResponse]
  );

  if (loading) {
    return (
      <div className="nm-shell py-10 sm:py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-40 rounded-[2rem] bg-[var(--nm-bg-elevated)]" />
          <div className="h-12 rounded-full bg-[var(--nm-bg-elevated)]" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[28rem] rounded-[2rem] bg-[var(--nm-bg-elevated)]" />
            <div className="h-[28rem] rounded-[2rem] bg-[var(--nm-bg-elevated)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nm-shell py-8 sm:py-10 lg:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] px-5 py-6 shadow-[0_28px_70px_-56px_rgba(24,14,7,0.82)] sm:px-6 sm:py-7 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[var(--nm-accent-soft)] to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] text-xl font-semibold">
              {userInitial}
            </div>
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">My Account</p>
              <h1 className="nm-display mt-1 text-4xl font-semibold leading-none sm:text-5xl">Profile</h1>
              <p className="mt-2 text-sm text-[var(--nm-muted)]">{email || "No email found"}</p>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-4">
            <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Saved</p>
              <p className="mt-1 text-base font-semibold">{savedProducts.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Orders</p>
              <p className="mt-1 text-base font-semibold">{orders.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">In Progress</p>
              <p className="mt-1 text-base font-semibold">{activeOrdersCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">Delivered</p>
              <p className="mt-1 text-base font-semibold">{deliveredOrdersCount}</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <nav className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-1.5">
        <button
          type="button"
          onClick={() => switchTab("profile")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeTab === "profile"
              ? "bg-[var(--nm-accent)] text-white shadow-[0_14px_30px_-20px_var(--nm-accent)]"
              : "text-[var(--nm-muted)] hover:bg-[var(--nm-surface)] hover:text-[var(--nm-text)]"
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => switchTab("saved")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeTab === "saved"
              ? "bg-[var(--nm-accent)] text-white shadow-[0_14px_30px_-20px_var(--nm-accent)]"
              : "text-[var(--nm-muted)] hover:bg-[var(--nm-surface)] hover:text-[var(--nm-text)]"
          }`}
        >
          Saved ({savedProducts.length})
        </button>
        <button
          type="button"
          onClick={() => switchTab("orders")}
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
            activeTab === "orders"
              ? "bg-[var(--nm-accent)] text-white shadow-[0_14px_30px_-20px_var(--nm-accent)]"
              : "text-[var(--nm-muted)] hover:bg-[var(--nm-surface)] hover:text-[var(--nm-text)]"
          }`}
        >
          Orders ({orders.length})
        </button>
      </nav>

      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="mt-6 space-y-5" aria-disabled={saving}>
          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Account Information</h2>
              <p className="mt-1 text-sm text-[var(--nm-muted)]">Update your personal details and manage addresses.</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Input label="Name" id="name" value={name} onChange={(event) => setName(event.target.value)} />
                <Input
                  label="Email"
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="mt-7 border-t border-[var(--nm-border)] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Address Book</h3>
                    <p className="mt-1 text-sm text-[var(--nm-muted)]">
                      Manage delivery addresses for quick checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddAddressEditor}
                    disabled={saving || addressSaving}
                    className="rounded-full border border-[var(--nm-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-accent-strong)] transition hover:border-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Add Address
                  </button>
                </div>

                {savedAddresses.length === 0 && !isAddressEditorOpen && (
                  <div className="mt-4 rounded-2xl border border-dashed border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-4 text-sm text-[var(--nm-muted)]">
                    No saved addresses yet. Add your first address.
                  </div>
                )}

                {savedAddresses.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {savedAddresses.map((address) => {
                      const isDefault = String(address._id) === String(defaultAddressId);
                      return (
                        <article
                          key={address._id}
                          className={`rounded-2xl border px-4 py-3 ${
                            isDefault
                              ? "border-[var(--nm-accent)] bg-[var(--nm-accent-soft)]/35"
                              : "border-[var(--nm-border)] bg-[var(--nm-surface)]"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold">{address.fullName}</p>
                                <span className="rounded-md border border-[var(--nm-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)]">
                                  {address.label}
                                </span>
                                {isDefault && (
                                  <span className="rounded-md bg-[var(--nm-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-[var(--nm-muted)]">
                                {address.address}, {address.city} - {address.postalCode}
                              </p>
                              <p className="mt-1 text-xs text-[var(--nm-muted)]">
                                {address.country}
                                {address.phone ? ` | ${address.phone}` : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => setDefaultAddress(address._id)}
                                  disabled={saving || addressSaving}
                                  className="rounded-md border border-[var(--nm-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-accent-strong)] transition hover:border-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditAddressEditor(address)}
                                disabled={saving || addressSaving}
                                className="rounded-md border border-[var(--nm-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAddress(address._id)}
                                disabled={saving || addressSaving}
                                className="rounded-md border border-[var(--nm-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)] transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                {isAddressEditorOpen && (
                  <div className="mt-5 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] p-4 sm:p-5">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.1em]">
                      {isAddingAddress ? "Add New Address" : "Edit Address"}
                    </h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                            Address Type
                          </span>
                          <select
                            value={addressDraft.label}
                            onChange={(event) => updateAddressDraftField("label", event.target.value)}
                            className="block w-full rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-3 text-sm text-[var(--nm-text)] focus:border-[var(--nm-accent)] focus:outline-none"
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                      </div>
                      <Input
                        label="Full Name"
                        id="address-full-name"
                        value={addressDraft.fullName}
                        onChange={(event) => updateAddressDraftField("fullName", event.target.value)}
                      />
                      <Input
                        label="Phone"
                        id="address-phone"
                        value={addressDraft.phone}
                        onChange={(event) => updateAddressDraftField("phone", event.target.value)}
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Address"
                          id="address-line"
                          value={addressDraft.address}
                          onChange={(event) => updateAddressDraftField("address", event.target.value)}
                        />
                      </div>
                      <Input
                        label="Landmark"
                        id="address-landmark"
                        value={addressDraft.landmark}
                        onChange={(event) => updateAddressDraftField("landmark", event.target.value)}
                      />
                      <Input
                        label="City"
                        id="address-city"
                        value={addressDraft.city}
                        onChange={(event) => updateAddressDraftField("city", event.target.value)}
                      />
                      <Input
                        label="Postal Code"
                        id="address-postal"
                        value={addressDraft.postalCode}
                        onChange={(event) => updateAddressDraftField("postalCode", event.target.value)}
                      />
                      <Input
                        label="State"
                        id="address-country"
                        value={addressDraft.country}
                        onChange={(event) => updateAddressDraftField("country", event.target.value)}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={closeAddressEditor}
                        disabled={addressSaving}
                        className="nm-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={addressSaving}
                        className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {addressSaving ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-5">
              <section className="rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
                <h3 className="text-base font-semibold">Profile Completion</h3>
                <p className="mt-1 text-sm text-[var(--nm-muted)]">Complete your details for faster checkout.</p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--nm-bg-elevated)]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--nm-accent),var(--nm-accent-strong))] transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-muted)]">
                  {profileCompletion}% complete
                </p>

                <div className="mt-4 grid gap-2">
                  <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm">
                    <span className="text-[var(--nm-muted)]">Total spend:</span>{" "}
                    <span className="font-semibold">{formatCurrency(totalSpend)}</span>
                  </div>
                  <div className="rounded-xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-sm">
                    <span className="text-[var(--nm-muted)]">Saved products:</span>{" "}
                    <span className="font-semibold">{savedProducts.length}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
                <h3 className="text-base font-semibold">Session</h3>
                <p className="mt-1 text-sm text-[var(--nm-muted)]">
                  Need to switch account? Logout from here.
                </p>
                <button
                  onClick={handleLogout}
                  type="button"
                  className="mt-4 rounded-full border border-red-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Logout
                </button>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] px-4 py-3">
            <p className="text-sm text-[var(--nm-muted)]">
              {isDirty ? "You have unsaved changes." : "All changes are saved."}
            </p>
            <button
              type="submit"
              disabled={saving || addressSaving || !isDirty}
              className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "saved" && (
        <section className="mt-6 rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Wishlist</p>
              <h2 className="nm-display text-3xl font-semibold leading-none sm:text-4xl">Saved Products</h2>
            </div>
            <span className="rounded-full border border-[var(--nm-border)] px-3 py-1 text-xs font-semibold text-[var(--nm-muted)]">
              {savedProducts.length} items
            </span>
          </div>

          {savedProducts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)] px-4 py-10 text-center">
              <p className="text-sm text-[var(--nm-muted)]">No saved products yet.</p>
              <Link
                to="/products"
                className="mt-3 inline-flex rounded-full border border-[var(--nm-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-accent-strong)]"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {savedProducts.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-surface)]"
                >
                  <Link to={`/product/${product._id}`} className="block">
                    <div className="aspect-[4/5] overflow-hidden bg-[var(--nm-bg-elevated)]">
                      <img
                        src={getProductThumb(product)}
                        alt={product.title || "product"}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholder.png";
                        }}
                      />
                    </div>
                  </Link>

                  <div className="space-y-3 p-3.5">
                    <div>
                      <Link to={`/product/${product._id}`} className="line-clamp-1 text-sm font-semibold">
                        {product.title || "Product"}
                      </Link>
                      <p className="mt-1 text-sm text-[var(--nm-muted)]">{formatCurrency(getProductPrice(product))}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product._id}`}
                        className="rounded-full border border-[var(--nm-border)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)] transition hover:border-[var(--nm-accent)] hover:text-[var(--nm-accent)]"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeSavedProduct(product._id)}
                        className="rounded-full border border-[var(--nm-border)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)] transition hover:border-red-300 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "orders" && (
        <section className="mt-6 rounded-[2rem] border border-[var(--nm-border)] bg-[var(--nm-card)] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--nm-muted)]">Purchases</p>
              <h2 className="nm-display text-3xl font-semibold leading-none sm:text-4xl">My Orders</h2>
            </div>
            <span className="rounded-full border border-[var(--nm-border)] px-3 py-1 text-xs font-semibold text-[var(--nm-muted)]">
              {orders.length} total
            </span>
          </div>
          <OrdersList orders={orders} cancelOrder={cancelOrder} />
        </section>
      )}
    </div>
  );
}
