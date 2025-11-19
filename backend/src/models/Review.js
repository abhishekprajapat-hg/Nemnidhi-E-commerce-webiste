const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      default: '',
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    verifiedPurchase: {
      type: Boolean,
      default: false
    },
    helpful: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    },
    reported: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: false });

module.exports =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);
