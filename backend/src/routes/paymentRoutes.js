// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware'); // optional - protect endpoints if you want

// Create razorpay order (server creates razorpay order)
router.post('/razorpay/create', protect, createRazorpayOrder);

// Verify payment (server verifies signature)
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

module.exports = router;
