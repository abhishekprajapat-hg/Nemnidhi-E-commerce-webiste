const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrderById,
  cancelOrder,
  getMyOrders,
  getOrders,
  markOrderDelivered,
  updateOrderToPaid,
  updateOrderTracking,
} = require('../controllers/orderController');

const { protect, admin } = require('../middleware/authMiddleware');

/**
 * =========================
 * ORDERS
 * =========================
 */

// Create order | Get all orders (ADMIN)
router
  .route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

// Logged-in user orders
router.route('/myorders').get(protect, getMyOrders);

// Single order (user or admin)
router.route('/:id').get(protect, getOrderById);

// Cancel order (user or admin)
router.put('/:id/cancel', protect, cancelOrder);

// Mark order paid
router.put('/:id/pay', protect, updateOrderToPaid);

// Mark order delivered (ADMIN)
router.put('/:id/deliver', protect, admin, markOrderDelivered);

// 🚚 Add / Update tracking (ADMIN)
router.put('/:id/tracking', protect, admin, updateOrderTracking);



module.exports = router;
