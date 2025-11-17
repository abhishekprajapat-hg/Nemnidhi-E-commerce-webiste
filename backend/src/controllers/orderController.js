// src/controllers/orderController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Admin: get all orders with advanced filtering (with facets)
 * GET /api/orders  (admin)
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    q,
    status,
    paymentMethod,
    city,
    country,
    from,
    to,
    min,
    max,
    sort = '-createdAt',
    page = 1,
    limit = 20,
    facets = 'true',
  } = req.query;

  const initialFilter = {};

  if (status) {
    const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length) initialFilter.status = { $in: statuses };
  }

  if (paymentMethod) initialFilter.paymentMethod = paymentMethod;
  if (city) initialFilter['shippingAddress.city'] = new RegExp(String(city), 'i');
  if (country) initialFilter['shippingAddress.country'] = new RegExp(String(country), 'i');

  if (from || to) {
    initialFilter.createdAt = {};
    if (from) initialFilter.createdAt.$gte = new Date(from);
    if (to) initialFilter.createdAt.$lte = new Date(to);
    if (!Object.keys(initialFilter.createdAt).length) delete initialFilter.createdAt;
  }

  if (min || max) {
    initialFilter.totalPrice = {};
    if (min) initialFilter.totalPrice.$gte = Number(min);
    if (max) initialFilter.totalPrice.$lte = Number(max);
    if (!Object.keys(initialFilter.totalPrice).length) delete initialFilter.totalPrice;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * perPage;

  const sortObj = {};
  String(sort).split(',').forEach((s) => {
    const key = s.trim();
    if (!key) return;
    if (key.startsWith('-')) sortObj[key.slice(1)] = -1;
    else sortObj[key] = 1;
  });

  const pipeline = [
    { $match: initialFilter },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ];

  if (q && String(q).trim()) {
    const regex = new RegExp(String(q).trim(), 'i');
    pipeline.push({
      $match: {
        $or: [
          { _id: { $regex: regex } },
          { 'user.email': { $regex: regex } },
          { 'user.name': { $regex: regex } },
          { 'shippingAddress.fullName': { $regex: regex } },
          { 'orderItems.title': { $regex: regex } },
        ],
      },
    });
  }

  const wantFacets = String(facets).toLowerCase() === 'true';

  pipeline.push({
    $facet: {
      orders: [
        { $sort: Object.keys(sortObj).length ? sortObj : { createdAt: -1 } },
        { $skip: skip },
        { $limit: perPage },
      ],
      totalCount: [{ $count: 'count' }],
      ...(wantFacets
        ? {
            statusCounts: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $project: { _id: 0, status: '$_id', count: 1 } },
            ],
            paymentCounts: [
              { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
              { $project: { _id: 0, paymentMethod: '$_id', count: 1 } },
            ],
          }
        : {}),
    },
  });

  const [result] = await Order.aggregate(pipeline);
  const total = result?.totalCount?.[0]?.count || 0;
  const pages = Math.ceil(total / perPage);

  res.json({
    orders: result?.orders || [],
    page: pageNum,
    pages,
    total,
    facets: wantFacets
      ? {
          status: result?.statusCounts || [],
          paymentMethod: result?.paymentCounts || [],
        }
      : undefined,
  });
});

// keep old name that routes import
exports.getOrders = exports.getAllOrders;

/**
 * Create order (no payment required) - Private
 * POST /api/orders
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod = 'COD',
    itemsPrice,
    shippingPrice = 0,
    taxPrice = 0,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    isPaid: false,
    status: 'Created',
  });

  const createdOrder = await order.save();

  // best-effort decrement stock
  for (const item of orderItems) {
    try {
      await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.qty } });
    } catch (err) {
      console.error('Stock update error', err.message);
    }
  }

  res.status(201).json(createdOrder);
});

/**
 * Get order by id - Private (owner or admin)
 * GET /api/orders/:id
 */
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const isOwner = order.user && order.user._id && order.user._id.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json(order);
});

/**
 * Cancel order - Private (owner only; not delivered)
 * PUT /api/orders/:id/cancel
 */
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }
  if (order.isDelivered) {
    res.status(400);
    throw new Error('Cannot cancel delivered order');
  }
  if (order.status === 'Cancelled') {
    res.status(400);
    throw new Error('Order already cancelled');
  }

  const { reason } = req.body || {};
  order.status = 'Cancelled';
  order.cancelReason = reason || '';
  order.cancelledAt = Date.now();

  // restore stock best-effort
  for (const item of order.orderItems) {
    try {
      await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: item.qty } });
    } catch (err) {
      console.error('Stock restore error', err.message);
    }
  }

  await order.save();
  res.json({ message: 'Order cancelled', order });
});

/**
 * Get logged-in user's orders - Private
 * GET /api/orders/myorders
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

/**
 * Mark order delivered - Private/Admin
 * PUT /api/orders/:id/deliver
 */
exports.markOrderDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.isDelivered) {
    return res.json({ message: 'Already delivered', order });
  }
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.status = 'Delivered';
  await order.save();
  res.json({ message: 'Order marked delivered', order });
});

/**
 * Update order to paid (kept for back-compat) - Private
 * PUT /api/orders/:id/pay
 */
exports.updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: req.body.id || '',
    status: req.body.status || '',
    update_time: req.body.update_time || '',
    email_address: req.body.email_address || '',
  };
  order.status = 'Paid';
  await order.save();
  res.json({ message: 'Order marked as paid', order });
});
