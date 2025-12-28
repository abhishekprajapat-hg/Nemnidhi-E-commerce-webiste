// src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

const { protect } = require("../middleware/authMiddleware");

router.post("/razorpay/create", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

module.exports = router;
