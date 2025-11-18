const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String, // stores file path from multer (ex: /tmp/xxxx.png)
      },
    ],
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpful: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);
