const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  city: { type: String, default: '', trim: true },
  postalCode: { type: String, default: '', trim: true },
  country: { type: String, default: '', trim: true }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: { unique: true, sparse: true }
    },

    password: { type: String, required: true, minlength: 6 },

    isAdmin: { type: Boolean, default: false },

    shippingAddress: { type: addressSchema, default: {} },

    // ------------------------------
    // OTP VERIFICATION FIELDS
    // ------------------------------

    emailVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String, // store as string for leading zeros
      default: null,
    },

    otpExpires: {
      type: Date,
      default: null,
    }
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password match method
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
