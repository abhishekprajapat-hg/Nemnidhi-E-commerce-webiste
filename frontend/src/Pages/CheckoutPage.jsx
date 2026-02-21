import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { clearCart } from "../store/cartSlice";
import AddressForm from "../components/AddressForm";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const EMPTY_ADDRESS = {
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
};

const FREE_SHIPPING_THRESHOLD = 1000;
const STANDARD_SHIPPING_CHARGE = 99;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);

  const [shipping, setShipping] = useState(EMPTY_ADDRESS);
  const [billing, setBilling] = useState(EMPTY_ADDRESS);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      const saved = user.shippingAddress || {};
      const prefill = {
        fullName: saved.fullName || user.name || "",
        address: saved.address || "",
        city: saved.city || "",
        postalCode: saved.postalCode || "",
        country: saved.country || "",
        phone: saved.phone || "",
      };
      setShipping(prefill);
      setBilling(prefill);
    }
  }, [user]);

  useEffect(() => {
    if (!useDifferentBilling) setBilling(shipping);
  }, [shipping, useDifferentBilling]);

  const itemsPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0),
    [cartItems]
  );
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_CHARGE;
  const totalPrice = Number((itemsPrice + shippingPrice).toFixed(2));

  const validateAddress = (address) =>
    Boolean(address.fullName && address.address && address.city && address.postalCode && address.country);

  const validate = () => {
    if (!validateAddress(shipping)) {
      showToast("Please complete shipping address", "error");
      return false;
    }
    if (useDifferentBilling && !validateAddress(billing)) {
      showToast("Please complete billing address", "error");
      return false;
    }
    return true;
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

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
        <section className="space-y-5">
          <AddressForm
            title="Shipping Address"
            address={shipping}
            onAddressChange={setShipping}
            disabled={loading}
          />

          <div className="rounded-3xl border border-[var(--nm-border)] bg-[var(--nm-card)] p-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
                className="accent-[var(--nm-accent)]"
              />
              Save this address for next time
            </label>

            <label className="mt-3 flex items-center gap-2 text-sm">
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
              disabled={loading}
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
              disabled={loading}
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
