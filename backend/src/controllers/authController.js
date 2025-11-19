// src/controllers/authController.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set in .env');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper to build OTP email HTML
function buildOtpHtml(otp, minutes = 10) {
  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
      <h2 style="margin:0 0 8px 0">Your verification code</h2>
      <p style="margin:0 0 16px 0">Use the code below to verify your email. This code expires in ${minutes} minutes.</p>
      <div style="font-size:28px; font-weight:600; letter-spacing:6px; margin:8px 0; padding:12px 16px; display:inline-block; background:#f7f7fb; border-radius:8px;">
        ${otp}
      </div>
      <p style="color:#666; margin-top:14px; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

// -----------------------------
// 🔵 1. REGISTER + SEND OTP
// -----------------------------
exports.register = asyncHandler(async (req, res) => {
  console.log('REGISTER body:', req.body);
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('Email already in use');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Create user with OTP fields
  const user = await User.create({
    name,
    email,
    password,
    emailVerified: false,
    otp,
    otpExpires: expiry,
  });

  if (!user) {
    res.status(500);
    throw new Error('Failed to create user');
  }

  // Try to send the OTP email. If it fails, we still created the user,
  // but we return a helpful message so frontend can show instructions.
  let emailSent = false;
  try {
    const subject = 'Your verification code';
    const html = buildOtpHtml(otp, 10);
    emailSent = await sendEmail(email, subject, html);
    if (!emailSent) {
      console.warn('sendEmail returned false for', email);
    }
  } catch (err) {
    console.error('Failed to send OTP email:', err);
    emailSent = false;
  }

  // Respond with helpful message
  if (emailSent) {
    return res.status(201).json({
      message: 'OTP sent to email',
      email: user.email,
    });
  } else {
    // Email failed — still return created but warn frontend
    return res.status(201).json({
      message:
        'Account created but failed to send OTP email. Please contact support or try resending OTP from the app.',
      email: user.email,
      warning: true,
    });
  }
});

// -----------------------------
// 🔵 2. VERIFY OTP
// -----------------------------
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and OTP are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    return res.json({ message: 'Email already verified' });
  }

  if (!user.otp || user.otp !== otp) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  if (!user.otpExpires || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('OTP expired');
  }

  user.emailVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.json({
    message: 'Email verified successfully',
    token: generateToken(user._id),
  });
});

// -----------------------------
// 🔵 3. RESEND OTP
// -----------------------------
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error('User not found');
  }

  if (user.emailVerified) {
    return res.json({ message: 'Email already verified' });
  }

  // New OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000;

  user.otp = otp;
  user.otpExpires = expiry;
  await user.save();

  // send email
  let emailSent = false;
  try {
    const subject = 'Your new verification code';
    const html = buildOtpHtml(otp, 10);
    emailSent = await sendEmail(email, subject, html);
    if (!emailSent) console.warn('sendEmail returned false for resend:', email);
  } catch (err) {
    console.error('Failed to resend OTP email:', err);
    emailSent = false;
  }

  if (emailSent) {
    return res.json({ message: 'New OTP sent to email' });
  } else {
    return res.json({
      message:
        'OTP generated but failed to send email. You can still verify using the code if available in server logs, or try again.',
      warning: true,
    });
  }
});

// -----------------------------
// 🔵 LOGIN USER — BLOCK UNVERIFIED USERS
// -----------------------------
exports.login = asyncHandler(async (req, res) => {
  console.log('LOGIN body:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const match = await user.matchPassword(password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // ❗ block login until verified
  if (!user.emailVerified) {
    res.status(401);
    throw new Error('Email not verified. Please verify OTP first.');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    shippingAddress: user.shippingAddress || {},
    token: generateToken(user._id),
  });
});

// -----------------------------
// PROFILE CONTROLLERS (UNCHANGED)
// -----------------------------
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;

  if (req.body.password) user.password = req.body.password;
  if (req.body.shippingAddress) user.shippingAddress = req.body.shippingAddress;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    shippingAddress: updatedUser.shippingAddress || {},
    token: generateToken(updatedUser._id),
  });
});
