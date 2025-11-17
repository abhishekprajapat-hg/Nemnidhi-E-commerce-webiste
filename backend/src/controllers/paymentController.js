// src/controllers/paymentController.js
const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const Order = require('../models/Order'); // adjust path/name to your Order model
const crypto = require('crypto');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('Razorpay keys not set (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET). Payment endpoints will fail until set.');
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/payment/razorpay/create
 * body: { orderId }
 * Creates a razorpay order using your internal order's total and returns razorpay order object
 */
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    res.status(400);
    throw new Error('orderId is required');
  }

  // load internal order
  const internalOrder = await Order.findById(orderId);
  if (!internalOrder) {
    res.status(404);
    throw new Error('Internal order not found');
  }

  // amount must be in paise
  const amountRupees = Number(internalOrder.totalPrice || internalOrder.total || 0);
  if (isNaN(amountRupees) || amountRupees <= 0) {
    res.status(400);
    throw new Error('Invalid order amount');
  }

  const amountPaise = Math.round(amountRupees * 100);

  // Create Razorpay order
  try {
    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: String(internalOrder._id),
      notes: {
        internalOrderId: String(internalOrder._id),
        userId: String(internalOrder.user || '')
      }
    };

    const razorOrder = await razorpayInstance.orders.create(options);

    // Return Razorpay order object to client
    res.json({
      id: razorOrder.id,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      receipt: razorOrder.receipt,
      internalOrderId: internalOrder._id
    });
  } catch (err) {
    console.error('Razorpay order create error', err);
    res.status(500).json({ message: 'Failed to create Razorpay order', detail: err.message || String(err) });
  }
});

/**
 * POST /api/payment/razorpay/verify
 * body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies signature and marks internal order as paid
 */
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing required payment params');
  }

  // Construct signature payload the same way Razorpay expects: order_id|payment_id
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid signature (verification failed)');
  }

  // mark internal order as paid
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: razorpay_payment_id,
    provider: 'razorpay',
    orderId: razorpay_order_id
  };

  await order.save();

  res.json({ success: true, orderId: order._id });
});
