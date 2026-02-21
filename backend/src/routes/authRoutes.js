// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// -----------------------------
// AUTH ROUTES
// -----------------------------

// Email + Password + OTP
router.post('/register', authController.register);
router.post('/login', authController.login);

// OTP verification
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// 🔥 GOOGLE LOGIN / REGISTER
router.post('/google', authController.googleAuth);

// -----------------------------
// PROFILE (PROTECTED)
// -----------------------------
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.get('/wishlist', protect, authController.getWishlist);
router.post('/wishlist/:productId', protect, authController.addToWishlist);
router.delete('/wishlist/:productId', protect, authController.removeFromWishlist);

module.exports = router;
