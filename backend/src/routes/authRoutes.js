// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Existing routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// ⭐ ADD OTP ROUTES
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// Profile (protected)
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
