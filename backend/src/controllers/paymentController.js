const asyncHandler = require("express-async-handler");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const Product = require("../models/Product");
const crypto = require("crypto");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ⭐ Step 1 → Create Razorpay order
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

// ⭐ Step 2 → Verify + create order in DB + REDUCE STOCK
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  // ✅ AUTH GUARD
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderPayload,
  } = req.body;

  // ✅ BASIC VALIDATIONS
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error("Missing payment fields");
  }

  if (
    !orderPayload ||
    !Array.isArray(orderPayload.orderItems) ||
    orderPayload.orderItems.length === 0
  ) {
    res.status(400);
    throw new Error("Invalid order payload");
  }

  // ✅ SIGNATURE VERIFY
  const expectedSig = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    res.status(400);
    throw new Error("Invalid signature");
  }

  // ⭐ CREATE ORDER
  const finalOrder = await Order.create({
    orderId: razorpay_order_id,
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

  // 🔥 REDUCE STOCK (CORRECT WAY – VARIANT + SIZE LEVEL)
  for (const item of finalOrder.orderItems) {
    const { product: productId, qty, size, color } = item;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    let stockReduced = false;

    for (const variant of product.variants) {
      if (variant.color === color) {
        for (const s of variant.sizes) {
          if (s.size === size) {
            if (s.stock < qty) {
              throw new Error(`Out of stock: ${product.title}`);
            }

            s.stock -= qty; // ✅ REAL STOCK UPDATE
            stockReduced = true;
            break;
          }
        }
      }
      if (stockReduced) break;
    }

    if (!stockReduced) {
      throw new Error("Matching product size/color not found");
    }

    await product.save(); // ✅ triggers pre-save → updates totalStock
  }

  res.json({
    success: true,
    orderId: finalOrder._id,
  });
});
