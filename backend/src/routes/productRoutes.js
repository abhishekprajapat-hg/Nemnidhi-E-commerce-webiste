// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProductCategories,
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// list / search - support both /api/products and /api/products/product
router.get('/', getProducts);
router.get('/product', getProducts);

// IMPORTANT: Specific routes like '/categories' must be defined BEFORE dynamic routes like '/:idOrSlug'.
router.get('/categories', getProductCategories);
router.get('/:idOrSlug', getProductByIdOrSlug);

// admin protected CRUD (PUT/DELETE use :id)
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// create (admin)
router.post('/product', protect, admin, createProduct);

module.exports = router;
