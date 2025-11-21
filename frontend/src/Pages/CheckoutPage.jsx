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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((s) => s.auth.user);
  const cartItems = useSelector((s) => s.cart.items);

  const [shipping, setShipping] = useState(EMPTY_ADDRESS);
  const [billing, setBilling] = useState(EMPTY_ADDRESS);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [loading, setLoading] = useState(false);

  // Free shipping threshold (₹1000 or more)
  const FREE_SHIPPING_THRESHOLD = 1000;
  const STANDARD_SHIPPING_CHARGE = 99;

  useEffect(() => {
    if (!user) navigate("/login", { state: { from: "/checkout" } });
  }, [user]);

  useEffect(() => {
    if (cartItems.length === 0) navigate("/cart");
  }, [cartItems]);

  useEffect(() => {
    if (user) {
      const sa = user.shippingAddress || {};
      const pf = {
        fullName: sa.fullName || user.name || "",
        address: sa.address || "",
        city: sa.city || "",
        postalCode: sa.postalCode || "",
        country: sa.country || "",
        phone: sa.phone || "",
      };
      setShipping(pf);
      setBilling(pf);
    }
  }, [user]);

  useEffect(() => {
    if (!useDifferentBilling) setBilling(shipping);
  }, [shipping, useDifferentBilling]);

  // ⭐ Prices (No Tax)
  const itemsPrice = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) => sum + Number(it.price) * Number(it.qty),
        0
      ),
    [cartItems]
  );

  // ✅ Free shipping when itemsPrice is >= ₹1000
  const shippingPrice =
    itemsPrice >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_CHARGE;

  // ❌ Removed tax
  const totalPrice = +(itemsPrice + shippingPrice).toFixed(2);

  // Validation
  const validateAddress = (a) =>
    a.fullName && a.address && a.city && a.postalCode && a.country;

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

  // ⭐ COD Order (No Tax in payload)
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

  // ⭐ Razorpay Payment (No Tax in order)
  const handleRazorpayPayment = async () => {
    const ok = await loadRazorpayScript();
    if (!ok) {
      showToast("Payment gateway failed", "error");
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
      name: "Your Shop",
      description: "Order Payment",
      prefill: {
        name: shipping.fullName,
        email: user.email,
        contact: shipping.phone,
      },
      modal: {
        ondismiss: () => showToast("Payment cancelled", "info"),
      },

      handler: async (res) => {
        try {
          const verifyRes = await api.post("/api/payment/razorpay/verify", {
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,

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
          });

          dispatch(clearCart());
          navigate(`/order/success/${verifyRes.data.orderId}`);
        } catch (err) {
          showToast("Payment verification failed", "error");
        }
      },
    };

    new window.Razorpay(options).open();
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (paymentMethod === "COD") await placeOrderCOD();
      else await handleRazorpayPayment();
    } catch (err) {
      showToast("Order failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fdf7f7] min-h-screen dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold dark:text-white mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Section */}
          <div className="lg:col-span-7 space-y-6">
            <AddressForm
              title="Shipping address"
              address={shipping}
              onAddressChange={setShipping}
              disabled={loading}
            />

            <div className="rounded-xl border bg-[#fffcfc] p-6 dark:bg-zinc-800 dark:border-zinc-700">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="ml-2 dark:text-gray-300">Save Address</span>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={useDifferentBilling}
                  onChange={(e) => setUseDifferentBilling(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="ml-2 dark:text-gray-300">
                  Use a different billing address
                </span>
              </div>
            </div>

            {useDifferentBilling && (
              <AddressForm
                title="Billing address"
                address={billing}
                onAddressChange={setBilling}
                disabled={loading}
              />
            )}
          </div>

          {/* Right Section */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border p-6 bg-[#fffcfc] dark:bg-zinc-800">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Order Summary
              </h3>

              <div className="max-h-64 overflow-y-auto space-y-4 mb-4">
                {cartItems.map((it) => (
                  <div className="flex items-center gap-4" key={it.product}>
                    <img
                      src={it.image}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div className="flex-1 dark:text-gray-200">
                      <div>{it.title}</div>
                      <div className="text-xs text-gray-400">Qty: {it.qty}</div>
                    </div>
                    <div className="font-medium dark:text-white">
                      ₹{(it.price * it.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 dark:border-zinc-700 space-y-2">
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">Items</span>
                  <span className="dark:text-white">₹{itemsPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="dark:text-gray-300">Shipping</span>
                  <div className="flex items-center gap-3">
                    <span className="dark:text-white">
                      {shippingPrice === 0 ? "Free" : `₹${shippingPrice}`}
                    </span>
                    {shippingPrice === 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Free for orders ₹{FREE_SHIPPING_THRESHOLD}+
                      </span>
                    )}
                  </div>
                </div>

                {/* ❌ Tax Removed */}

                <div className="border-t mt-3 pt-3 flex justify-between dark:border-zinc-700">
                  <span className="font-semibold dark:text-gray-200">Total</span>
                  <span className="text-xl font-extrabold dark:text-white">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 bg-[#fffcfc] dark:bg-zinc-800">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Payment Method
              </h3>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMethod === "Razorpay"}
                    onChange={() => setPaymentMethod("Razorpay")}
                  />
                  <span className="dark:text-gray-300">Pay Online (Razorpay)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  <span className="dark:text-gray-300">Cash on Delivery</span>
                </label>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-6 w-full px-4 py-3 rounded-md text-white font-semibold bg-black dark:bg-white dark:text-black"
              >
                {loading ? "Processing..." : `Place Order (${paymentMethod})`}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
