const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
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

const SAVED_PRODUCT_SELECT =
  "_id title slug category minPrice maxPrice totalStock variants rating numReviews";
const MAX_SAVED_ADDRESSES = 6;
const ADDRESS_REQUIRED_FIELDS = [
  "fullName",
  "address",
  "city",
  "postalCode",
  "country",
];
const ALLOWED_ADDRESS_LABELS = new Set(["Home", "Work", "Other"]);

function cleanText(value = "") {
  return String(value || "").trim();
}

function normalizeAddress(input = {}) {
  const nextLabel = cleanText(input.label);
  return {
    label: ALLOWED_ADDRESS_LABELS.has(nextLabel) ? nextLabel : "Home",
    fullName: cleanText(input.fullName),
    phone: cleanText(input.phone),
    address: cleanText(input.address),
    landmark: cleanText(input.landmark),
    city: cleanText(input.city),
    postalCode: cleanText(input.postalCode),
    country: cleanText(input.country),
  };
}

function isAddressComplete(address = {}) {
  return ADDRESS_REQUIRED_FIELDS.every((field) => Boolean(cleanText(address[field])));
}

function mapSavedAddresses(savedAddresses = []) {
  if (!Array.isArray(savedAddresses)) return [];
  return savedAddresses
    .map((entry) => ({
      _id: entry?._id ? String(entry._id) : String(new mongoose.Types.ObjectId()),
      ...normalizeAddress(entry),
    }))
    .filter((entry) => isAddressComplete(entry));
}

function buildAddressBookPayload(user = {}) {
  const normalizedShipping = normalizeAddress(user.shippingAddress || {});
  let savedAddresses = mapSavedAddresses(user.savedAddresses || []);

  let defaultAddressId = user.defaultAddressId ? String(user.defaultAddressId) : "";
  if (!defaultAddressId || !savedAddresses.some((entry) => String(entry._id) === defaultAddressId)) {
    defaultAddressId = savedAddresses[0]?._id || "";
  }

  const selectedAddress =
    savedAddresses.find((entry) => String(entry._id) === defaultAddressId) || null;

  return {
    shippingAddress: selectedAddress ? normalizeAddress(selectedAddress) : normalizedShipping,
    savedAddresses,
    defaultAddressId,
  };
}

function applyAddressBookToUser(user, payload = {}) {
  const savedAddresses = Array.isArray(payload.savedAddresses)
    ? payload.savedAddresses
    : [];
  user.savedAddresses = savedAddresses.slice(0, MAX_SAVED_ADDRESSES).map((entry) => ({
    ...(entry?._id ? { _id: entry._id } : {}),
    ...normalizeAddress(entry),
  }));
  user.defaultAddressId = payload.defaultAddressId || null;
  user.shippingAddress = normalizeAddress(payload.shippingAddress || {});
}

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

  const addressBook = buildAddressBookPayload(user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    shippingAddress: addressBook.shippingAddress,
    savedAddresses: addressBook.savedAddresses,
    defaultAddressId: addressBook.defaultAddressId,
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

  const addressBook = buildAddressBookPayload(user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    shippingAddress: addressBook.shippingAddress,
    savedAddresses: addressBook.savedAddresses,
    defaultAddressId: addressBook.defaultAddressId,
    token: generateToken(user._id),
  });
});

/* =================================================
   🔵 PROFILE (UNCHANGED)
================================================= */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -otp -otpExpires")
    .populate("savedProducts", SAVED_PRODUCT_SELECT);
  if (!user) throw new Error("User not found");
  const profile = user.toObject();
  const addressBook = buildAddressBookPayload(profile);
  res.json({ ...profile, ...addressBook });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) user.password = req.body.password;

  if (Array.isArray(req.body.savedAddresses)) {
    const nextSaved = mapSavedAddresses(req.body.savedAddresses).slice(
      0,
      MAX_SAVED_ADDRESSES
    );
    let nextDefaultId = cleanText(req.body.defaultAddressId);
    if (!nextDefaultId || !nextSaved.some((entry) => String(entry._id) === nextDefaultId)) {
      nextDefaultId = nextSaved[0]?._id || "";
    }
    const selectedAddress =
      nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
      normalizeAddress(req.body.shippingAddress || {});

    applyAddressBookToUser(user, {
      savedAddresses: nextSaved,
      defaultAddressId: nextDefaultId,
      shippingAddress: selectedAddress,
    });
  } else if (req.body.shippingAddress && typeof req.body.shippingAddress === "object") {
    const rawIncoming = req.body.shippingAddress || {};
    const currentShipping = normalizeAddress(user.shippingAddress || {});
    const incomingAddress = normalizeAddress({
      ...currentShipping,
      ...rawIncoming,
      label:
        rawIncoming.label === undefined || rawIncoming.label === null
          ? currentShipping.label
          : rawIncoming.label,
      phone:
        rawIncoming.phone === undefined || rawIncoming.phone === null
          ? currentShipping.phone
          : rawIncoming.phone,
      landmark:
        rawIncoming.landmark === undefined || rawIncoming.landmark === null
          ? currentShipping.landmark
          : rawIncoming.landmark,
    });
    const addressBook = buildAddressBookPayload(user);
    let nextSaved = [...addressBook.savedAddresses];
    let nextDefaultId = addressBook.defaultAddressId;

    if (isAddressComplete(incomingAddress)) {
      if (nextDefaultId) {
        let updated = false;
        nextSaved = nextSaved.map((entry) => {
          if (String(entry._id) !== String(nextDefaultId)) return entry;
          updated = true;
          return { ...entry, ...incomingAddress };
        });
        if (!updated && nextSaved.length < MAX_SAVED_ADDRESSES) {
          const created = {
            _id: String(new mongoose.Types.ObjectId()),
            ...incomingAddress,
          };
          nextSaved = [created, ...nextSaved];
          nextDefaultId = created._id;
        }
      } else if (nextSaved.length < MAX_SAVED_ADDRESSES) {
        const created = {
          _id: String(new mongoose.Types.ObjectId()),
          ...incomingAddress,
        };
        nextSaved = [created, ...nextSaved];
        nextDefaultId = created._id;
      }
    }

    const selectedAddress =
      nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
      incomingAddress;
    applyAddressBookToUser(user, {
      savedAddresses: nextSaved,
      defaultAddressId: nextDefaultId,
      shippingAddress: selectedAddress,
    });
  }

  const updatedUser = await user.save();
  const addressBook = buildAddressBookPayload(updatedUser);

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    shippingAddress: addressBook.shippingAddress,
    savedAddresses: addressBook.savedAddresses,
    defaultAddressId: addressBook.defaultAddressId,
    token: generateToken(updatedUser._id),
  });
});

exports.getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");
  res.json(buildAddressBookPayload(user));
});

exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  const nextAddress = normalizeAddress(req.body || {});
  if (!isAddressComplete(nextAddress)) {
    res.status(400);
    throw new Error("Please fill full address details");
  }

  const addressBook = buildAddressBookPayload(user);
  if (addressBook.savedAddresses.length >= MAX_SAVED_ADDRESSES) {
    res.status(400);
    throw new Error(`You can save up to ${MAX_SAVED_ADDRESSES} addresses`);
  }

  const createdAddress = {
    _id: String(new mongoose.Types.ObjectId()),
    ...nextAddress,
  };
  const nextSaved = [createdAddress, ...addressBook.savedAddresses].slice(
    0,
    MAX_SAVED_ADDRESSES
  );
  const shouldSetDefault = Boolean(req.body?.setDefault) || !addressBook.defaultAddressId;
  const nextDefaultId = shouldSetDefault
    ? createdAddress._id
    : addressBook.defaultAddressId;
  const selectedAddress = shouldSetDefault
    ? createdAddress
    : nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
      createdAddress;

  applyAddressBookToUser(user, {
    savedAddresses: nextSaved,
    defaultAddressId: nextDefaultId,
    shippingAddress: selectedAddress,
  });

  await user.save();
  res.status(201).json({
    message: "Address saved successfully",
    ...buildAddressBookPayload(user),
  });
});

exports.setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    res.status(400);
    throw new Error("Invalid address id");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  const addressBook = buildAddressBookPayload(user);
  const selectedAddress = addressBook.savedAddresses.find(
    (entry) => String(entry._id) === String(addressId)
  );
  if (!selectedAddress) {
    res.status(404);
    throw new Error("Address not found");
  }

  applyAddressBookToUser(user, {
    savedAddresses: addressBook.savedAddresses,
    defaultAddressId: selectedAddress._id,
    shippingAddress: selectedAddress,
  });

  await user.save();
  res.json({
    message: "Default address updated",
    ...buildAddressBookPayload(user),
  });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    res.status(400);
    throw new Error("Invalid address id");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  const addressBook = buildAddressBookPayload(user);
  const exists = addressBook.savedAddresses.some(
    (entry) => String(entry._id) === String(addressId)
  );
  if (!exists) {
    res.status(404);
    throw new Error("Address not found");
  }

  const nextSaved = addressBook.savedAddresses.filter(
    (entry) => String(entry._id) !== String(addressId)
  );

  let nextDefaultId = addressBook.defaultAddressId;
  let selectedAddress = null;
  if (!nextSaved.length) {
    nextDefaultId = "";
  } else if (String(nextDefaultId) === String(addressId)) {
    nextDefaultId = nextSaved[0]._id;
    selectedAddress = nextSaved[0];
  } else {
    selectedAddress =
      nextSaved.find((entry) => String(entry._id) === String(nextDefaultId)) ||
      nextSaved[0];
    nextDefaultId = selectedAddress._id;
  }

  applyAddressBookToUser(user, {
    savedAddresses: nextSaved,
    defaultAddressId: nextDefaultId,
    shippingAddress: selectedAddress || {},
  });

  await user.save();
  res.json({
    message: "Address removed",
    ...buildAddressBookPayload(user),
  });
});

exports.getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("savedProducts")
    .populate("savedProducts", SAVED_PRODUCT_SELECT);
  if (!user) throw new Error("User not found");
  res.json({ savedProducts: user.savedProducts || [] });
});

exports.addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    res.status(404);
    throw new Error("Product not found");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  const alreadySaved = (user.savedProducts || []).some(
    (savedId) => String(savedId) === String(productId)
  );
  if (!alreadySaved) {
    user.savedProducts = [productId, ...(user.savedProducts || [])];
    await user.save();
  }

  const updated = await User.findById(req.user._id)
    .select("savedProducts")
    .populate("savedProducts", SAVED_PRODUCT_SELECT);

  res.json({ savedProducts: updated?.savedProducts || [], isSaved: true });
});

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new Error("User not found");

  user.savedProducts = (user.savedProducts || []).filter(
    (savedId) => String(savedId) !== String(productId)
  );
  await user.save();

  const updated = await User.findById(req.user._id)
    .select("savedProducts")
    .populate("savedProducts", SAVED_PRODUCT_SELECT);

  res.json({ savedProducts: updated?.savedProducts || [], isSaved: false });
});
