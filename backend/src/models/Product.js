const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    sizes: { type: [sizeSchema], default: [] },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, default: "", index: true },

    brand: { type: String, default: "", index: true },

    /* ML + recommender tags */
    tags: { type: [String], default: [], index: true },

    embedding: { type: [Number], default: [], index: true },


    variants: { type: [variantSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },

    // computed/denormalized fields
    minPrice: { type: Number, default: null, index: true },
    maxPrice: { type: Number, default: null, index: true },
    totalStock: { type: Number, default: 0, index: true },
    aggColors: { type: [String], default: [], index: true },
    aggSizes: { type: [String], default: [], index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// virtual convenience
productSchema.virtual("countInStock").get(function () {
  return this.totalStock || 0;
});

// full-text search
productSchema.index({ title: "text", description: "text", slug: "text" });

/*
 * Pre-save compute denormalized values + normalize ML tags
 */
productSchema.pre("save", function (next) {
  try {
    let minP = null,
      maxP = null,
      totalStock = 0;

    const colorsSet = new Set();
    const sizesSet = new Set();

    // compute price/stock aggregates
    if (Array.isArray(this.variants)) {
      for (const v of this.variants) {
        if (v && v.color) colorsSet.add(String(v.color).trim());

        if (Array.isArray(v.sizes)) {
          for (const s of v.sizes) {
            const price = Number(s.price);
            const stock = Number(s.stock) || 0;

            if (!isNaN(price)) {
              if (minP === null || price < minP) minP = price;
              if (maxP === null || price > maxP) maxP = price;
            }

            totalStock += stock;

            if (s.size) sizesSet.add(String(s.size).trim());
          }
        }
      }
    }

    this.minPrice = minP;
    this.maxPrice = maxP;
    this.totalStock = totalStock;
    this.aggColors = [...colorsSet];
    this.aggSizes = [...sizesSet];

    // reviews aggregate
    if (Array.isArray(this.reviews)) {
      this.numReviews = this.reviews.length;
      if (this.numReviews > 0) {
        const sum = this.reviews.reduce(
          (acc, r) => acc + (Number(r.rating) || 0),
          0
        );
        this.rating = sum / this.numReviews;
      } else {
        this.rating = 0;
      }
    }

    // 🔥 normalize tags for ML searching
    if (Array.isArray(this.tags)) {
      this.tags = this.tags.map((t) => String(t).trim().toLowerCase());
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
