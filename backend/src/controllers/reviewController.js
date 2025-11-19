const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

function toObjectId(id) {
  return isValidObjectId(id) ? mongoose.Types.ObjectId(String(id)) : id;
}

async function updateProductRating(productId) {
  if (!productId) return;
  const matchId = isValidObjectId(productId) ? mongoose.Types.ObjectId(String(productId)) : productId;

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

  await Product.updateOne({ _id: productId }, { $set: { numReviews, rating } }).exec();
}

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
  if (Number.isNaN(parsedRating) || parsedRating < 0) {
    res.status(400);
    throw new Error('Invalid rating');
  }

  const existing = await Review.findOne({
    productId: toObjectId(productId),
    userId: toObjectId(req.user._id),
  }).lean();

  if (existing) {
    res.status(400);
    throw new Error('You already reviewed this product');
  }

  const orderCheck = await Order.findOne({
    user: toObjectId(req.user._1d || req.user._id),
    'orderItems.product': toObjectId(productId),
    isPaid: true,
  }).lean();

  const files = Array.isArray(req.files) ? req.files : [];
  const images = files.map((f) => f.path || f.filename || '').filter(Boolean);

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

  await updateProductRating(productId);

  res.status(201).json(review);
});

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

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  res.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

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
    if (Number.isNaN(r) || r < 0) {
      res.status(400);
      throw new Error('Invalid rating');
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
  const isAdmin = req.user.isAdmin;

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not allowed');
  }

  await review.deleteOne();
  await updateProductRating(review.productId);

  res.json({ message: 'Review deleted' });
});

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

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const userIdStr = String(req.user._id);
  review.helpful = review.helpful || [];

  const idx = review.helpful.findIndex((u) => String(u) === userIdStr);
  if (idx === -1) {
    review.helpful.push(req.user._id);
  } else {
    review.helpful.splice(idx, 1);
  }

  await review.save();

  res.json({ helpfulCount: review.helpful.length });
});

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
