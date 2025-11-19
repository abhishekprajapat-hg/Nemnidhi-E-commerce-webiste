const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true, trim: true },
  stock: { type: Number, required: true, default: 0, min: 0 },
  price: { type: Number, required: true, min: 0 },
}, { _id: false });

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  sizes: { type: [sizeSchema], default: [] },
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: { type: String, required: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, unique: true, index: true },
  description: { type: String, default: '' },
  category: { type: String, default: '', index: true },
  variants: { type: [variantSchema], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('countInStock').get(function () {
  if (!Array.isArray(this.variants)) return 0;
  return this.variants.reduce((pv, v) => {
    const sizesTotal = Array.isArray(v.sizes)
      ? v.sizes.reduce((sv, s) => sv + (Number(s.stock) || 0), 0)
      : 0;
    return pv + sizesTotal;
  }, 0);
});

productSchema.index({ title: 'text', description: 'text', slug: 'text' });

productSchema.pre('save', function (next) {
  if (Array.isArray(this.reviews)) {
    this.numReviews = this.reviews.length;
    if (this.numReviews > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      this.rating = sum / this.numReviews;
    } else {
      this.rating = 0;
    }
  }
  next();
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
