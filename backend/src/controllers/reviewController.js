const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ------------------------------
// Update Product Rating
// ------------------------------
async function updateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        numReviews: { $sum: 1 },
        rating: { $avg: '$rating' },
      },
    },
  ]);

  const product = await Product.findById(productId);

  if (!product) return;

  if (stats.length > 0) {
    product.numReviews = stats[0].numReviews;
    product.rating = stats[0].rating;
  } else {
    product.numReviews = 0;
    product.rating = 0;
  }

  await product.save();
}

// ------------------------------
// Create Review
// ------------------------------
exports.createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  // prevent duplicate reviews
  const existing = await Review.findOne({
    productId,
    userId: req.user._id,
  });

  if (existing) {
    res.status(400);
    throw new Error('You already reviewed this product');
  }

  // check verified purchase
  const orderCheck = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    isPaid: true,
  });

  // get image paths from your multer
  const images = req.files?.map((f) => f.path) || [];

  const review = await Review.create({
    productId,
    userId: req.user._id,
    userName: req.user.name,
    rating,
    comment,
    images, // store file paths
    verifiedPurchase: !!orderCheck,
  });

  await updateProductRating(productId);

  res.status(201).json(review);
});

// ------------------------------
// Get Reviews
// ------------------------------
exports.getReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const sort = req.query.sort || 'newest';

  let sortObj = { createdAt: -1 };
  if (sort === 'highest') sortObj = { rating: -1 };
  if (sort === 'lowest') sortObj = { rating: 1 };

  const total = await Review.countDocuments({ productId });

  const reviews = await Review.find({ productId })
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ------------------------------
// Update Review
// ------------------------------
exports.updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not allowed');
  }

  review.rating = req.body.rating ?? review.rating;
  review.comment = req.body.comment ?? review.comment;

  await review.save();
  await updateProductRating(review.productId);

  res.json(review);
});

// ------------------------------
// Delete Review
// ------------------------------
exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner =
    review.userId.toString() === req.user._id.toString() ||
    req.user.isAdmin;

  if (!isOwner) {
    res.status(403);
    throw new Error('Not allowed');
  }

  await review.deleteOne();
  await updateProductRating(review.productId);

  res.json({ message: 'Review deleted' });
});

// ------------------------------
// Helpful Toggle
// ------------------------------
exports.toggleHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const userId = req.user._id;
  const userIndex = review.helpful.indexOf(userId);

  if (userIndex === -1) review.helpful.push(userId);
  else review.helpful.splice(userIndex, 1);

  await review.save();

  res.json({ helpfulCount: review.helpful.length });
});

// ------------------------------
// Report Review
// ------------------------------
exports.reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.reported = true;
  await review.save();

  res.json({ message: 'Review reported' });
});
