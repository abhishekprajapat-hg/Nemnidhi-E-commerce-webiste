const express = require('express');
const router = express.Router();

const {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  toggleHelpful,
  reportReview,
} = require('../controllers/reviewController');

const upload = require('../middleware/multer'); // USING YOUR multer.js
const { protect } = require('../middleware/authMiddleware');

// Get all reviews for product
router.get('/:productId', getReviews);

// Create review WITH IMAGE (max 3)
router.post(
  '/:productId',
  protect,
  upload.array('images', 3), // use your multer
  createReview
);

// Edit review
router.put('/edit/:reviewId', protect, updateReview);

// Delete review
router.delete('/:reviewId', protect, deleteReview);

// Helpful toggle
router.post('/helpful/:reviewId', protect, toggleHelpful);

// Report review
router.post('/report/:reviewId', protect, reportReview);

module.exports = router;
