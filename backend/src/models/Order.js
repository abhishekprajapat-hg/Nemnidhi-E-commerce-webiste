const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0, default: 0 },
  qty: { type: Number, required: true, min: 1, default: 1 },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  image: { type: String, default: '' }
}, { _id: false });

const paymentResultSchema = new mongoose.Schema({
  id: { type: String, default: '' },
  status: { type: String, default: '' },
  update_time: { type: String, default: '' },
  email_address: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
  orderItems: { type: [orderItemSchema], default: [], validate: v => Array.isArray(v) },
  shippingAddress: {
    fullName: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  paymentMethod: { type: String, default: 'COD' },
  itemsPrice: { type: Number, default: 0, min: 0 },
  shippingPrice: { type: Number, default: 0, min: 0 },
  taxPrice: { type: Number, default: 0, min: 0 },
  totalPrice: { type: Number, default: 0, min: 0 },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  paymentResult: { type: paymentResultSchema, default: {} },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  status: { type: String, default: 'Created', trim: true },
  cancelReason: { type: String, default: '' },
  cancelledAt: { type: Date }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
