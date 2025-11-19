const express = require('express');
const router = express.Router();
const {
  getProductCategories,
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/product', getProducts); // backwards compat if something calls /product

router.get('/categories', getProductCategories);

// create product: POST /api/products
router.post('/', protect, admin, createProduct);

// create review for product: POST /api/products/:id/reviews
router.post('/:id/reviews', protect, createProductReview);

// get single product by id or slug
router.get('/:idOrSlug', getProductByIdOrSlug);

// update & delete
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
