import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { clearCart } from "../store/cartSlice";
import { setUser } from "../store/authSlice";
import AddressForm from "../components/AddressForm";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const EMPTY_ADDRESS = {
  label: "Home",
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
  landmark: "",
};

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_CHARGE = 99;
const CHECKOUT_HIGHLIGHTS = [
  {
    icon: "fa-shield-halved",
    title: "256-bit Secure Checkout",
    text: "Encrypted payment flow with trusted gateway protection.",
  },
  {
    icon: "fa-truck-fast",
    title: "Fast Dispatch",
    text: "Orders are packed quickly so your outfit reaches sooner.",
  },
  {
    icon: "fa-rotate-left",
    title: "Easy Returns",
    text: "Simple support process if size or fit needs a change.",
  },
];

const normalizeAddress = (source = {}) => ({
  label: source.label || "Home",
  fullName: source.fullName || "",
  address: source.address || "",
  city: source.city || "",
  postalCode: source.postalCode || "",
  country: source.country || "",
  phone: source.phone || "",
  landmark: source.landmark || "",
});

const mapSavedAddresses = (addresses = []) =>
  Array.isArray(addresses)
    ? addresses
        .filter(Boolean)
        .map((entry) => ({
          _id: String(entry._id || ""),
          ...normalizeAddress(entry),
        }))
        .filter((entry) => entry._id)
    : [];

const isAddressComplete = (address = {}) =>
  Boolean(address.fullName && address.address && address.city && address.postalCode && address.country);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);

  const [shipping, setShipping] = useState(EMPTY_ADDRESS);
  const [billing, setBilling] = useState(EMPTY_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const prefill = normalizeAddress({
      ...user.shippingAddress,
      fullName: user.shippingAddress?.fullName || user.name || "",
    });
    setShipping(prefill);
    setBilling(prefill);
  }, [user]);

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;

    async function loadAddressBook() {
      try {
        const { data } = await api.get("/api/auth/profile");
        if (cancelled) return;

        const nextSaved = mapSavedAddresses(data.savedAddresses);
        const nextDefaultId =
          String(data.defaultAddressId || "") || nextSaved[0]?._id || "";
        const selected =
          nextSaved.find((entry) => String(entry._id) === nextDefaultId) || null;
        const fallback = normalizeAddress(data.shippingAddress || EMPTY_ADDRESS);

        setSavedAddresses(nextSaved);
        setSelectedAddressId(selected?._id || "");
        setShowNewAddressForm(nextSaved.length === 0);
        setShipping(selected ? normalizeAddress(selected) : fallback);
      } catch {
        // Keep local fallback if profile fetch fails
      }
    }

    loadAddressBook();
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  useEffect(() => {
    if (!useDifferentBilling) setBilling(shipping);
  }, [shipping, useDifferentBilling]);

  const selectedSavedAddress = useMemo(
    () =>
      savedAddresses.find((entry) => String(entry._id) === String(selectedAddressId)) || null,
    [savedAddresses, selectedAddressId]
  );
  const shouldShowShippingForm = showNewAddressForm || savedAddresses.length === 0;
  const shippingFormStep = savedAddresses.length > 0 ? 2 : 1;
  const billingStep = savedAddresses.length > 0 && shouldShowShippingForm ? 3 : 2;
  const uiDisabled = loading || addressLoading;

  const itemsPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0),
    [cartItems]
  );
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_CHARGE;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - itemsPrice);
  const totalPrice = Number((itemsPrice + shippingPrice).toFixed(2));

  const syncAddressCache = (addressBook) => {
    if (!user) return;
    dispatch(
      setUser({
        ...user,
        shippingAddress: normalizeAddress(addressBook.shippingAddress || {}),
        savedAddresses: mapSavedAddresses(addressBook.savedAddresses),
        defaultAddressId: String(addressBook.defaultAddressId || ""),
      })
    );
  };

  const validate = () => {
    if (!isAddressComplete(shipping)) {
      showToast("Please complete shipping address", "error");
      return false;
    }
    if (useDifferentBilling && !isAddressComplete(billing)) {
      showToast("Please complete billing address", "error");
      return false;
    }
    return true;
  };

  const handleSelectSavedAddress = async (addressId) => {
    const picked = savedAddresses.find(
      (entry) => String(entry._id) === String(addressId)
    );
    if (!picked) return;

    setSelectedAddressId(String(addressId));
    setShowNewAddressForm(false);
    setShipping(normalizeAddress(picked));

    try {
      const { data } = await api.put(`/api/auth/addresses/${addressId}/default`);
      const nextSaved = mapSavedAddresses(data.savedAddresses);
      const nextDefaultId =
        String(data.defaultAddressId || "") || String(addressId);
      const selected =
        nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        picked;

      setSavedAddresses(nextSaved);
      setSelectedAddressId(nextDefaultId);
      setShipping(normalizeAddress(selected));
      syncAddressCache({
        ...data,
        savedAddresses: nextSaved,
        shippingAddress: selected,
        defaultAddressId: nextDefaultId,
      });
    } catch {
      showToast("Could not update default address", "error");
    }
  };

  const handleSaveNewAddress = async () => {
    if (!isAddressComplete(shipping)) {
      showToast("Please complete address before saving", "error");
      return;
    }

    setAddressLoading(true);
    try {
      const { data } = await api.post("/api/auth/addresses", {
        ...shipping,
        setDefault: true,
      });
      const nextSaved = mapSavedAddresses(data.savedAddresses);
      const nextDefaultId =
        String(data.defaultAddressId || "") || nextSaved[0]?._id || "";
      const selected =
        nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        shipping;

      setSavedAddresses(nextSaved);
      setSelectedAddressId(nextDefaultId);
      setShowNewAddressForm(false);
      setShipping(normalizeAddress(selected));
      syncAddressCache({
        ...data,
        savedAddresses: nextSaved,
        shippingAddress: selected,
        defaultAddressId: nextDefaultId,
      });
      showToast("Address saved");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not save address",
        "error"
      );
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Remove this saved address?")) return;

    setAddressLoading(true);
    try {
      const { data } = await api.delete(`/api/auth/addresses/${addressId}`);
      const nextSaved = mapSavedAddresses(data.savedAddresses);
      const nextDefaultId = String(data.defaultAddressId || "");
      const selected =
        nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
        null;

      setSavedAddresses(nextSaved);
      setSelectedAddressId(selected ? selected._id : "");
      setShowNewAddressForm(nextSaved.length === 0);
      setShipping(
        selected
          ? normalizeAddress(selected)
          : normalizeAddress({ ...EMPTY_ADDRESS, fullName: user?.name || "" })
      );
      syncAddressCache({
        ...data,
        savedAddresses: nextSaved,
        shippingAddress: selected || {},
        defaultAddressId: nextDefaultId,
      });
      showToast("Address removed");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Could not remove address",
        "error"
      );
    } finally {
      setAddressLoading(false);
    }
  };

  const startAddingAddress = () => {
    setShowNewAddressForm(true);
    setSelectedAddressId("");
    setShipping(
      normalizeAddress({ ...EMPTY_ADDRESS, fullName: user?.name || "" })
    );
  };

  const cancelAddNewAddress = () => {
    const fallback = selectedSavedAddress || savedAddresses[0] || null;
    setShowNewAddressForm(false);
    if (fallback) {
      setSelectedAddressId(fallback._id);
      setShipping(normalizeAddress(fallback));
    }
  };

  const placeOrderCOD = async () => {
    const payload = {
      orderItems: cartItems,
      shippingAddress: shipping,
      billingAddress: useDifferentBilling ? billing : shipping,
      paymentMethod: "COD",
      itemsPrice,
      shippingPrice,
      totalPrice,
    };

    const { data } = await api.post("/api/orders", payload);
    dispatch(clearCart());
    navigate(`/order/success/${data._id}`);
  };

  const handleRazorpayPayment = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      showToast("Payment gateway failed to load", "error");
      return;
    }

    const { data: rpOrder } = await api.post("/api/payment/razorpay/create", {
      totalPrice,
    });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      order_id: rpOrder.id,
      name: "Nemnidhi",
      description: "Order Payment",
      prefill: {
        name: shipping.fullName,
        email: user.email,
        contact: shipping.phone,
      },
      modal: {
        ondismiss: () => showToast("Payment cancelled", "info"),
      },
      handler: async (response) => {
        try {
          const verifyRes = await api.post(
            "/api/payment/razorpay/verify",
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderPayload: {
                orderItems: cartItems,
                shippingAddress: shipping,
                billingAddress: useDifferentBilling ? billing : shipping,
                saveAddress,
                paymentMethod: "Razorpay",
                itemsPrice,
                shippingPrice,
                totalPrice,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            }
          );

          dispatch(clearCart());
          navigate(`/order/success/${verifyRes.data.orderId}`);
        } catch {
          showToast("Payment verification failed", "error");
        }
      },
    };

    new window.Razorpay(options).open();
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === "COD") {
        await placeOrderCOD();
      } else {
        await handleRazorpayPayment();
      }
    } catch {
      showToast("Order failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nm-shell py-8 sm:py-10">
      <div className="mb-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--nm-muted)]">Checkout</p>
        <h1 className="nm-display mt-2 text-5xl font-semibold leading-none">Secure Payment</h1>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {CHECKOUT_HIGHLIGHTS.map((point) => (
          <article
            key={point.title}
            className="rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nm-accent)]/15 text-[var(--nm-accent)]">
                <i className={`fa-solid ${point.icon}`} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold leading-tight">{point.title}</h2>
                <p className="mt-1 text-xs text-[var(--nm-muted)]">{point.text}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <section className="space-y-5">
          <article className="overflow-hidden rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nm-border)] bg-[var(--nm-bg)]/30 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[var(--nm-accent)] px-2 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[var(--nm-muted)]">
                    Delivery
                  </p>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.06em]">
                    Select Address
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={startAddingAddress}
                disabled={uiDisabled}
                className="rounded-lg border border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--nm-accent-strong)] transition hover:border-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Add New
              </button>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {savedAddresses.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--nm-border)] bg-[var(--nm-surface)] px-3 py-3 text-sm text-[var(--nm-muted)]">
                  No saved address yet. Add a new address to continue.
                </p>
              ) : (
                savedAddresses.map((entry) => {
                  const isSelected =
                    String(selectedAddressId) === String(entry._id) &&
                    !showNewAddressForm;
                  return (
                    <label
                      key={entry._id}
                      className={`block rounded-xl border p-3 ${
                        isSelected
                          ? "border-[var(--nm-accent)] bg-[var(--nm-accent-soft)]/35"
                          : "border-[var(--nm-border)] bg-[var(--nm-surface)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={isSelected}
                          onChange={() => handleSelectSavedAddress(entry._id)}
                          disabled={uiDisabled}
                          className="mt-1 accent-[var(--nm-accent)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{entry.fullName}</p>
                            <span className="rounded-md border border-[var(--nm-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)]">
                              {entry.label || "Home"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--nm-muted)]">
                            {entry.address}, {entry.city} - {entry.postalCode}
                          </p>
                          <p className="mt-1 text-xs text-[var(--nm-muted)]">
                            {entry.country}
                            {entry.phone ? `  |  ${entry.phone}` : ""}
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectSavedAddress(entry._id)}
                              disabled={uiDisabled}
                              className="rounded-md border border-[var(--nm-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-accent-strong)] transition hover:border-[var(--nm-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Deliver Here
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(entry._id)}
                              disabled={uiDisabled}
                              className="rounded-md border border-[var(--nm-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--nm-muted)] transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </article>

          {shouldShowShippingForm && (
            <div className="space-y-3">
              <AddressForm
                title={savedAddresses.length > 0 ? "Add New Address" : "Shipping Address"}
                address={shipping}
                onAddressChange={setShipping}
                disabled={uiDisabled}
                stepNumber={shippingFormStep}
              />
              <div className="flex flex-wrap gap-2">
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={cancelAddNewAddress}
                    disabled={uiDisabled}
                    className="nm-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNewAddress}
                  disabled={uiDisabled}
                  className="nm-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addressLoading ? "Saving..." : "Save Address & Deliver Here"}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            {shouldShowShippingForm && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="accent-[var(--nm-accent)]"
                />
                Save this address for next time
              </label>
            )}

            <label className={`${shouldShowShippingForm ? "mt-3" : ""} flex items-center gap-2 text-sm`}>
              <input
                type="checkbox"
                checked={useDifferentBilling}
                onChange={(event) => setUseDifferentBilling(event.target.checked)}
                className="accent-[var(--nm-accent)]"
              />
              Use a different billing address
            </label>
          </div>

          {useDifferentBilling && (
            <AddressForm
              title="Billing Address"
              address={billing}
              onAddressChange={setBilling}
              disabled={uiDisabled}
              stepNumber={billingStep}
            />
          )}
        </section>

        <aside className="space-y-5">
          <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={`${item.product}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.title}
                    className="h-14 w-14 rounded-xl border border-[var(--nm-border)] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-[var(--nm-muted)]">Qty {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">Rs {(item.price * item.qty).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-[var(--nm-border)] pt-4 text-sm">
              <div className="flex justify-between text-[var(--nm-muted)]">
                <span>Items</span>
                <span className="font-semibold text-[var(--nm-text)]">Rs {itemsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[var(--nm-muted)]">
                <span>Shipping</span>
                <span className="font-semibold text-[var(--nm-text)]">
                  {shippingPrice === 0 ? "Free" : `Rs ${shippingPrice}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--nm-border)] pt-3 text-base font-semibold">
                <span>Total</span>
                <span>Rs {totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {remainingForFreeShipping > 0 && (
              <div className="mt-4 rounded-2xl border border-[var(--nm-border)] bg-[var(--nm-bg)] p-3 text-xs text-[var(--nm-muted)]">
                <p className="flex items-center gap-2">
                  <i className="fa-solid fa-gift text-[var(--nm-accent)]" aria-hidden="true" />
                  Add <span className="font-semibold text-[var(--nm-text)]">Rs {remainingForFreeShipping.toFixed(2)}</span>{" "}
                  more to unlock free shipping.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Payment Method</h2>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={paymentMethod === "Razorpay"}
                  onChange={() => setPaymentMethod("Razorpay")}
                  className="accent-[var(--nm-accent)]"
                />
                Pay Online (Razorpay)
              </label>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading || addressLoading}
              className="nm-btn-primary mt-5 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Processing..." : `Place Order (${paymentMethod})`}
            </button>
          </article>
        </aside>
      </div>
    </div>
  );
}
