const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

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

  const filter = {};

  if (status) {
    const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length) filter.status = { $in: statuses };
  }

  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (city) filter['shippingAddress.city'] = new RegExp(String(city), 'i');
  if (country) filter['shippingAddress.country'] = new RegExp(String(country), 'i');

  if (from || to) {
    const createdAt = {};
    if (from) {
      const d = new Date(from);
      if (!isNaN(d)) createdAt.$gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d)) createdAt.$lte = d;
    }
    if (Object.keys(createdAt).length) filter.createdAt = createdAt;
  }

  if (min || max) {
    const totalPrice = {};
    if (min !== undefined && min !== null && String(min).trim() !== '') totalPrice.$gte = Number(min);
    if (max !== undefined && max !== null && String(max).trim() !== '') totalPrice.$lte = Number(max);
    if (Object.keys(totalPrice).length) filter.totalPrice = totalPrice;
  }

  if (q && String(q).trim()) {
    const qq = String(q).trim();
    const regex = new RegExp(qq, 'i');
    filter.$or = [
      { 'shippingAddress.fullName': { $regex: regex } },
      { 'orderItems.title': { $regex: regex } },
      { userEmail: { $regex: regex } },
    ];
    if (isValidObjectId(qq)) {
      try {
        filter.$or.push({ _id: mongoose.Types.ObjectId(qq) });
      } catch (e) {}
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * perPage;

  const sortObj = {};
  String(sort)
    .split(',')
    .forEach((s) => {
      const key = s.trim();
      if (!key) return;
      if (key.startsWith('-')) sortObj[key.slice(1)] = -1;
      else sortObj[key] = 1;
    });

  const total = await Order.countDocuments(filter);

  const projection =
    'user orderItems shippingAddress paymentMethod itemsPrice shippingPrice taxPrice totalPrice isPaid isDelivered status createdAt paidAt deliveredAt';

  const orders = await Order.find(filter)
    .select(projection)
    .sort(sortObj)
    .skip(skip)
    .limit(perPage)
    .populate('user', 'name email')
    .lean()
    .exec();

  let facetResult = {};
  const wantFacets = String(facets).toLowerCase() === 'true';
  if (wantFacets) {
    try {
      const [statusCounts, paymentCounts] = await Promise.all([
        Order.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $project: { _id: 0, status: '$_id', count: 1 } },
        ]).allowDiskUse(true),
        Order.aggregate([
          { $match: filter },
          { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
          { $project: { _id: 0, paymentMethod: '$_id', count: 1 } },
        ]).allowDiskUse(true),
      ]);
      facetResult = { status: statusCounts || [], paymentMethod: paymentCounts || [] };
    } catch (aggErr) {
      console.error('Order facets aggregation error:', aggErr && aggErr.stack ? aggErr.stack : aggErr);
      facetResult = { status: [], paymentMethod: [] };
    }
  }

  res.json({
    orders,
    total,
    page: pageNum,
    pages: Math.ceil(total / perPage),
    facets: wantFacets ? facetResult : undefined,
  });
});

exports.getOrders = exports.getAllOrders;

async function recomputeAndSetCountInStock(productId, session = null) {
  if (!isValidObjectId(productId)) return;
  const p = await Product.findById(productId).session(session).lean();
  if (!p) return;
  const total = (p.variants || []).reduce((pv, v) => {
    const s = (v.sizes || []).reduce((acc, si) => acc + (Number(si.stock) || 0), 0);
    return pv + s;
  }, 0);
  await Product.updateOne({ _id: productId }, { $set: { countInStock: total } }, { session });
}

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

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const session = await mongoose.startSession();
  let usingTransaction = false;

  try {
    try {
      session.startTransaction();
      usingTransaction = true;
    } catch (txErr) {
      usingTransaction = false;
    }

    const itemsSnapshot = [];

    for (const it of orderItems) {
      const { product: productId, color, size, qty } = it;
      const quantity = Number(qty || 1);
      if (!productId) {
        throw new Error('Order item missing product id');
      }
      if (!color || !size) {
        throw new Error('Order item must include color and size');
      }

      const query = {
        _id: productId,
        variants: {
          $elemMatch: {
            color: color,
            sizes: { $elemMatch: { size: size, stock: { $gte: quantity } } },
          },
        },
      };

      const update = {
        $inc: { 'variants.$[v].sizes.$[s].stock': -quantity },
      };

      const arrayFilters = [{ 'v.color': color }, { 's.size': size }];

      const opts = { arrayFilters, session };

      const updateResult = await Product.updateOne(query, update, opts);

      const matched = (updateResult && (updateResult.matchedCount || updateResult.n || updateResult.ok)) ? (updateResult.matchedCount || updateResult.n) : 0;
      const modified = (updateResult && (updateResult.modifiedCount || updateResult.nModified)) ? (updateResult.modifiedCount || updateResult.nModified) : 0;

      if (!updateResult || matched === 0 || modified === 0) {
        if (usingTransaction) await session.abortTransaction();
        res.status(400);
        throw new Error(`Insufficient stock or variant/size not found for product ${productId} (${color}/${size})`);
      }

      const prod = await Product.findById(productId).session(usingTransaction ? session : null);
      if (!prod) {
        if (usingTransaction) await session.abortTransaction();
        res.status(404);
        throw new Error('Product not found after stock decrement');
      }

      const variant = (prod.variants || []).find((v) => String(v.color) === String(color));
      if (!variant) {
        if (usingTransaction) await session.abortTransaction();
        res.status(400);
        throw new Error('Variant not found in product after update');
      }
      const sizeObj = (variant.sizes || []).find((s) => String(s.size) === String(size));
      if (!sizeObj) {
        if (usingTransaction) await session.abortTransaction();
        res.status(400);
        throw new Error('Size object not found after update');
      }

      try {
        await recomputeAndSetCountInStock(productId, usingTransaction ? session : null);
      } catch (e) {
        console.warn('Failed to recompute countInStock', e && e.message ? e.message : e);
      }

      const image =
        (Array.isArray(variant.images) && variant.images[0]) ||
        prod.image ||
        (Array.isArray(prod.images) && prod.images[0]) ||
        '';

      itemsSnapshot.push({
        product: prod._id,
        title: prod.title,
        price: Number(sizeObj.price || prod.price || 0),
        qty: quantity,
        size: sizeObj.size,
        color: variant.color,
        image,
      });
    }

    const order = new Order({
      user: req.user ? req.user._id : null,
      orderItems: itemsSnapshot,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: false,
      status: 'Created',
    });

    const savedOrder = usingTransaction ? await order.save({ session }) : await order.save();

    if (usingTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json(savedOrder);
  } catch (err) {
    try {
      if (usingTransaction) await session.abortTransaction();
    } catch (e) {}
    try {
      session.endSession();
    } catch (e) {}
    throw err;
  }
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  const order = await Order.findById(id).populate('user', 'name email').lean();
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const currentUserId = req.user && (req.user._id ? req.user._id.toString() : req.user.toString());
  const orderUserId = order.user && order.user._id ? order.user._id.toString() : (order.user ? String(order.user) : null);
  const isOwner = currentUserId && orderUserId && currentUserId === orderUserId;
  if (!isOwner && !(req.user && req.user.isAdmin)) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }
  res.json(order);
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  const order = await Order.findById(id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (!(req.user && (String(order.user) === String(req.user._id) || req.user.isAdmin))) {
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

  for (const item of order.orderItems) {
    try {
      const { product: productId, color, size, qty } = item;
      if (!productId || !color || !size) continue;

      const update = { $inc: { 'variants.$[v].sizes.$[s].stock': Number(qty || 0) } };
      const arrayFilters = [{ 'v.color': color }, { 's.size': size }];

      await Product.updateOne({ _id: productId }, update, { arrayFilters });

      try {
        await recomputeAndSetCountInStock(productId);
      } catch (e) {
        console.warn('Failed to recompute countInStock after cancel', e && e.message ? e.message : e);
      }
    } catch (err) {
      console.error('Stock restore error', err && err.message ? err.message : err);
    }
  }

  await order.save();
  res.json({ message: 'Order cancelled', order });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

exports.markOrderDelivered = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  const order = await Order.findById(id);
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

exports.updateOrderToPaid = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid order id');
  }
  const order = await Order.findById(id);
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
