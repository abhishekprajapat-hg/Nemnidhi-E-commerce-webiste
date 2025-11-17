const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  cancelOrder,
  getMyOrders,
  getOrders,
  markOrderDelivered,
  updateOrderToPaid
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrder).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/deliver', protect, admin, markOrderDelivered);

module.exports = router;
