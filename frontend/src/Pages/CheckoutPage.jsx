import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { clearCart } from "../store/cartSlice";
import AddressForm from "../components/AddressForm"; 

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

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");

  // Protected route logic
  useEffect(() => {
    if (!user) {
      showToast("You must be logged in to check out", "error");
      navigate("/login", { state: { from: "/checkout" } });
    }
  }, [user, navigate]);

  // Empty cart check
  useEffect(() => {
    if (cartItems.length === 0) {
      showToast("Your cart is empty", "info");
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  // Shipping/Billing address pre-fill
  useEffect(() => {
    if (user) {
      const sa = user.shippingAddress || {};
      const prefill = {
        fullName: sa.fullName || user.name || "",
        address: sa.address || "",
        city: sa.city || "",
        postalCode: sa.postalCode || "",
        country: sa.country || "",
        phone: sa.phone || "",
      };
      setShipping(prefill);
      setBilling(prefill); 
    }
  }, [user]);

  // Auto-save shipping to localStorage (and sync billing if needed)
  useEffect(() => {
    localStorage.setItem("shippingAddress", JSON.stringify(shipping));
    if (!useDifferentBilling) {
      setBilling(shipping);
    }
  }, [shipping, useDifferentBilling]);


  // --- Calculations ---
  const itemsPrice = useMemo(
    () => cartItems.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0), 0),
    [cartItems]
  );
  const shippingPrice = itemsPrice > 2000 ? 0 : 99;
  const taxPrice = +(itemsPrice * 0.05).toFixed(2);
  const totalPrice = +(itemsPrice + shippingPrice + taxPrice).toFixed(2);

  // --- Form Handling ---
  const validateAddress = (address) => {
    const required = ["fullName", "address", "city", "postalCode", "country"];
    for (const k of required) {
      if (!address[k] || (typeof address[k] === "string" && address[k].trim() === "")) {
        return false;
      }
    }
    return true;
  };

  const validate = () => {
    if (!cartItems.length) {
      showToast("Your cart is empty");
      return false;
    }
    if (!validateAddress(shipping)) {
      showToast("Please complete shipping address");
      return false;
    }
    if (useDifferentBilling && !validateAddress(billing)) {
      showToast("Please complete billing address");
      return false;
    }
    return true;
  };

  // --- Payment Logic (No change in functionality) ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const src = "https://checkout.razorpay.com/v1/checkout.js";
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createOrderPayload = (method) => ({
    orderItems: cartItems.map((it) => ({
      product: it.product,
      title: it.title,
      price: Number(it.price),
      qty: Number(it.qty),
      size: it.size || "",
      color: it.color || "",
      image: it.image || "",
    })),
    shippingAddress: shipping,
    billingAddress: useDifferentBilling ? billing : shipping,
    saveAddress: saveAddress,
    paymentMethod: method,
    itemsPrice: +itemsPrice.toFixed(2),
    shippingPrice: +shippingPrice.toFixed(2),
    taxPrice: +taxPrice.toFixed(2),
    totalPrice: +totalPrice.toFixed(2),
  });

  const onOrderSuccess = (orderId) => {
    dispatch(clearCart());
    showToast("Order placed successfully!");
    navigate(`/order/success/${orderId}`);
  };

  const placeOrderCOD = async () => {
    const payload = createOrderPayload("COD");
    const { data } = await api.post("/api/orders", payload);
    onOrderSuccess(data._id);
  };

  const placeOrderRazorpay = async () => {
    const payload = createOrderPayload("Razorpay");
    const createRes = await api.post("/api/orders", payload);
    const internalOrder = createRes.data;
    if (!internalOrder || !internalOrder._id) {
      throw new Error("Failed to create internal order");
    }

    const r = await api.post("/api/payment/razorpay/create", { orderId: internalOrder._id });
    const razorResp = r.data;
    if (!razorResp || !razorResp.id) {
      throw new Error("Failed to create Razorpay order");
    }

    const ok = await loadRazorpayScript();
    if (!ok || !window.Razorpay) {
      throw new Error("Payment SDK failed to load");
    }

    const key = import.meta.env.VITE_RAZORPAY_KEY || "";
    const options = {
      key: key,
      amount: razorResp.amount,
      currency: razorResp.currency,
      name: "Your Shop Name",
      description: `Order ${internalOrder._id}`,
      image: "/logo.png",
      order_id: razorResp.id,
      handler: async function (response) {
        try {
          await api.post("/api/payment/razorpay/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: internalOrder._id,
          });
          onOrderSuccess(internalOrder._id);
        } catch (verifyErr) {
          console.error("Payment verification failed", verifyErr);
          showToast("Payment verification failed — contact support", "error");
          navigate(`/order/${internalOrder._id}`);
        }
      },
      prefill: {
        name: shipping.fullName || user.name,
        email: user.email,
        contact: shipping.phone || "",
      },
      notes: { internalOrderId: String(internalOrder._id) },
      theme: { color: "#111827" },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      console.error("Razorpay payment.failed", resp);
      showToast("Payment failed or cancelled", "error");
      navigate(`/order/${internalOrder._id}`);
    });
    rzp.open();
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (paymentMethod === "COD") {
        await placeOrderCOD();
      } else if (paymentMethod === "Razorpay") {
        await placeOrderRazorpay();
      }
    } catch (err) {
      console.error("Place order error", err);
      showToast("Failed to place order: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };
  
  if (!user || cartItems.length === 0) {
    // ⭐️ Loading state ko dark mode friendly banaya
    return <div className="flex justify-center items-center h-screen dark:bg-black dark:text-gray-300"><div>Loading...</div></div>;
  }

  return (
    // ⭐️ Main Wrapper - Changed bg-gray-50 to bg-[#fdf7f7]
    <div className="bg-[#fdf7f7] min-h-screen dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold dark:text-white">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* left: address forms */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Shipping Address Form (AddressForm component handles internal dark styles) */}
            <AddressForm
              title="Shipping address"
              address={shipping}
              onAddressChange={setShipping}
              disabled={loading}
            />

            {/* 2. "Save Address" & "Billing Address" Checkboxes */}
            <div className="rounded-xl border bg-[#fffcfc] p-6 shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="saveAddress"
                    name="saveAddress"
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="saveAddress" className="font-medium text-gray-700 dark:text-gray-300">
                    Save this address to my profile
                  </label>
                </div>
              </div>
              <div className="relative flex items-start mt-4">
                <div className="flex items-center h-5">
                  <input
                    id="useDifferentBilling"
                    name="useDifferentBilling"
                    type="checkbox"
                    checked={useDifferentBilling}
                    onChange={(e) => setUseDifferentBilling(e.target.checked)}
                    disabled={loading}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-zinc-600 dark:bg-zinc-700"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="useDifferentBilling" className="font-medium text-gray-700 dark:text-gray-300">
                    Use a different billing address
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Billing Address Form (Conditional) */}
            {useDifferentBilling && (
              <AddressForm
                title="Billing address"
                address={billing}
                onAddressChange={setBilling}
                disabled={loading}
              />
            )}
          </div>

          {/* right: order summary & payment */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary */}
              <div className="rounded-xl border p-6 bg-[#fffcfc] shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Order Summary</h3>
                
                {/* Item List */}
                <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((it) => (
                    <div key={`${it.product}-${it.size}-${it.color}`} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 shrink-0">
                        <img src={it.image || "/placeholder.png"} alt={it.title} className="object-cover w-full h-full" onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm line-clamp-1 dark:text-white">{it.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{it.size ? `Size: ${it.size}` : ""} {it.color ? ` • ${it.color}` : ""}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Qty: {it.qty}</div>
                      </div>
                      <div className="text-sm font-medium dark:text-white">₹{(it.price * it.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                
                {/* Price Breakdown */}
                <div className="space-y-2 border-t pt-4 border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div>Items Price</div>
                    <div>₹{itemsPrice.toFixed(2)}</div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div>Shipping</div>
                    <div>{shippingPrice === 0 ? "Free" : `₹${shippingPrice.toFixed(2)}`}</div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <div>Tax (5%)</div>
                    <div>₹{taxPrice.toFixed(2)}</div>
                  </div>
                  <div className="border-t mt-3 pt-3 flex items-center justify-between border-gray-200 dark:border-zinc-700">
                    <div className="text-base font-semibold dark:text-gray-200">Total</div>
                    <div className="text-xl font-extrabold dark:text-white">₹{totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="rounded-xl border p-6 bg-[#fffcfc] shadow-sm dark:bg-zinc-800 dark:border-zinc-700">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Payment Method</h3>
                <fieldset disabled={loading} className="space-y-3">
                  {/* Razorpay Option */}
                  <div className="flex items-center p-4 border rounded-md dark:border-zinc-700 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-600 dark:has-[:checked]:bg-indigo-900/40">
                    <input
                      id="razorpay"
                      name="paymentMethod"
                      type="radio"
                      checked={paymentMethod === "Razorpay"}
                      onChange={() => setPaymentMethod("Razorpay")}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700"
                    />
                    <label htmlFor="razorpay" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pay Online (Razorpay)
                    </label>
                  </div>
                  {/* COD Option */}
                  <div className="flex items-center p-4 border rounded-md dark:border-zinc-700 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-600 dark:has-[:checked]:bg-indigo-900/40">
                    <input
                      id="cod"
                      name="paymentMethod"
                      type="radio"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700"
                    />
                    <label htmlFor="cod" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cash on Delivery (COD)
                    </label>
                  </div>
                </fieldset>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className={`mt-6 w-full px-4 py-3 rounded-md text-white font-semibold transition ${loading ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300" : "bg-black hover:opacity-90 dark:bg-white dark:text-black dark:hover:bg-gray-200"}`}
                >
                  {loading ? "Processing..." : `Place Order (${paymentMethod})`}
                </button>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}