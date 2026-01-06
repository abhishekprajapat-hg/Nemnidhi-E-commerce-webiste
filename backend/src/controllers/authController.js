const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

/* ================= GOOGLE CLIENT ================= */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ================= JWT ================= */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set in .env");
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/* ================= OTP EMAIL ================= */
function buildOtpHtml(otp, minutes = 10) {
  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial;">
      <h2>Your verification code</h2>
      <p>This code expires in ${minutes} minutes.</p>
      <div style="font-size:28px;font-weight:600;letter-spacing:6px;">
        ${otp}
      </div>
    </div>
  `;
}

/* =================================================
   🔵 1. REGISTER + SEND OTP (UNCHANGED)
================================================= */
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Email already in use");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000;

  const user = await User.create({
    name,
    email,
    password,
    emailVerified: false,
    otp,
    otpExpires: expiry,
  });

  let emailSent = false;
  try {
    emailSent = await sendEmail(
      email,
      "Your verification code",
      buildOtpHtml(otp, 10)
    );
  } catch {}

  return res.status(201).json({
    message: emailSent
      ? "OTP sent to email"
      : "Account created but failed to send OTP email",
    email: user.email,
  });
});

/* =================================================
   🔵 2. VERIFY OTP (UNCHANGED)
================================================= */
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.emailVerified) {
    return res.json({ message: "Email already verified" });
  }

  if (!user.otp || user.otp !== otp) throw new Error("Invalid OTP");
  if (!user.otpExpires || user.otpExpires < Date.now())
    throw new Error("OTP expired");

  user.emailVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.json({
    message: "Email verified successfully",
    token: generateToken(user._id),
  });
});

/* =================================================
   🔵 3. RESEND OTP (UNCHANGED)
================================================= */
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.emailVerified)
    return res.json({ message: "Email already verified" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await sendEmail(email, "Your new verification code", buildOtpHtml(otp, 10));
  } catch {}

  res.json({ message: "New OTP sent to email" });
});

/* =================================================
   🔵 4. LOGIN (OTP VERIFIED ONLY)
================================================= */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const match = await user.matchPassword(password);
  if (!match) throw new Error("Invalid email or password");

  if (!user.emailVerified) {
    throw new Error("Email not verified. Please verify OTP first.");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user._id),
  });
});

/* =================================================
   🟢 5. GOOGLE LOGIN / REGISTER (NEW)
================================================= */
exports.googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new Error("Google token missing");

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture, sub } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      googleId: sub,
      emailVerified: true, // 🔥 bypass OTP
      password: sub, // dummy
    });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    token: generateToken(user._id),
  });
});

/* =================================================
   🔵 PROFILE (UNCHANGED)
================================================= */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) throw new Error("User not found");
  res.json(user);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) user.password = req.body.password;

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    token: generateToken(updatedUser._id),
  });
});
