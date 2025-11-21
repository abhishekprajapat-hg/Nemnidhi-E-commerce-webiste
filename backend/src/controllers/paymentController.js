// src/controllers/paymentController.js
const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ⭐ Step 1 → Create Razorpay order (NO internal order yet)
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { totalPrice } = req.body;

  if (!totalPrice || totalPrice <= 0 || isNaN(totalPrice)) {
    res.status(400);
    throw new Error("Invalid amount");
  }

  const razorOrder = await razorpayInstance.orders.create({
    amount: Math.round(totalPrice * 100),
    currency: "INR",
  });

  res.json(razorOrder);
});

// ⭐ Step 2 → Verify + create order in DB (ONLY if success)
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderPayload,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing payment fields");
  }

  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error("Invalid signature");
  }

  // ⭐ Now create final order in DB
  const finalOrder = await Order.create({
    ...orderPayload,
    user: req.user._id,
    isPaid: true,
    paidAt: new Date(),
    paymentResult: {
      provider: "razorpay",
      id: razorpay_payment_id,
      orderId: razorpay_order_id,
    },
  });

  res.json({ success: true, orderId: finalOrder._id });
});
