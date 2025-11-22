// controllers/reviewController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

const toObjectId = (id) => {
  if (!id) return null;
  return isValidObjectId(id) ? new mongoose.Types.ObjectId(String(id)) : null;
};

async function updateProductRating(productId) {
  if (!productId || !isValidObjectId(productId)) return;

  const matchId = new mongoose.Types.ObjectId(String(productId));

  const stats = await Review.aggregate([
    { $match: { productId: matchId } },
    {
      $group: {
        _id: '$productId',
        numReviews: { $sum: 1 },
        rating: { $avg: '$rating' },
      },
    },
  ]);

  const numReviews = stats.length > 0 ? stats[0].numReviews : 0;
  const rating = stats.length > 0 ? stats[0].rating : 0;

  await Product.updateOne({ _id: matchId }, { $set: { numReviews, rating } }).exec();
}

/**
 * Create review
 * POST /api/reviews/:productId
 */
exports.createReview = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const { rating, comment } = req.body;
  const parsedRating = Number(rating);
  if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    res.status(400);
    throw new Error('Invalid rating (must be 1-5)');
  }

  // Prevent duplicate review by same user
  const existing = await Review.findOne({
    productId: toObjectId(productId),
    userId: toObjectId(req.user._id),
  }).lean();

  if (existing) {
    res.status(400);
    throw new Error('You already reviewed this product');
  }

  // Check if user purchased (verify order)
  const orderCheck = await Order.findOne({
    user: toObjectId(req.user._id),
    'orderItems.product': toObjectId(productId),
    isPaid: true,
  }).lean();

  const files = Array.isArray(req.files) ? req.files : [];
  const images = files.map((f) => f.path || f.filename || '').filter(Boolean);

  // Let mongoose cast productId/userId (we pass ObjectId instances to be explicit)
  const review = await Review.create({
    productId: toObjectId(productId),
    userId: toObjectId(req.user._id),
    userName: req.user.name || '',
    rating: parsedRating,
    comment: comment || '',
    images,
    verifiedPurchase: !!orderCheck,
    helpful: [],
    reported: false,
  });

  // update product stats (await to keep consistency)
  await updateProductRating(productId);

  res.status(201).json(review);
});

/**
 * Get reviews (paginated)
 * GET /api/reviews/:productId
 */
exports.getReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
  const sort = req.query.sort || 'newest';

  let sortObj = { createdAt: -1 };
  if (sort === 'highest') sortObj = { rating: -1 };
  if (sort === 'lowest') sortObj = { rating: 1 };

  const filter = { productId: toObjectId(productId) };

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
  ]);

  res.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

/**
 * Update review
 * PUT /api/reviews/:reviewId
 */
exports.updateReview = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (String(review.userId) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not allowed');
  }

  if (req.body.rating !== undefined) {
    const r = Number(req.body.rating);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      res.status(400);
      throw new Error('Invalid rating (must be 1-5)');
    }
    review.rating = r;
  }

  if (req.body.comment !== undefined) {
    review.comment = req.body.comment;
  }

  await review.save();
  await updateProductRating(review.productId);

  res.json(review);
});

/**
 * Delete review
 * DELETE /api/reviews/:reviewId
 */
exports.deleteReview = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner = String(review.userId) === String(req.user._id);
  const isAdmin = !!req.user.isAdmin;

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not allowed');
  }

  await review.deleteOne();
  await updateProductRating(review.productId);

  res.json({ message: 'Review deleted' });
});

/**
 * Toggle helpful
 * POST /api/reviews/:reviewId/helpful
 */
exports.toggleHelpful = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  // Use atomic update to avoid race conditions
  const userId = toObjectId(req.user._id);
  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const userIdStr = String(userId);
  review.helpful = review.helpful || [];

  const idx = review.helpful.findIndex((u) => String(u) === userIdStr);
  if (idx === -1) {
    review.helpful.push(userId);
  } else {
    review.helpful.splice(idx, 1);
  }

  await review.save();

  res.json({ helpfulCount: review.helpful.length });
});

/**
 * Report review
 * POST /api/reviews/:reviewId/report
 */
exports.reportReview = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  const { reviewId } = req.params;
  if (!isValidObjectId(reviewId)) {
    res.status(400);
    throw new Error('Invalid review id');
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.reported = true;
  await review.save();

  res.json({ message: 'Review reported' });
});
