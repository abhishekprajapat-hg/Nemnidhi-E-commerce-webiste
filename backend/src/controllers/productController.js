// src/controllers/productController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
// const cloudinary = require('cloudinary').v2; // optional if using cloud storage

// @desc Get all unique product categories
exports.getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.find().distinct('category');
  // Filter out any null, undefined, or empty string categories
  res.json(categories.filter(c => c));
});

// @desc Get all products (with filters, pagination)
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    q,
    inStock,
    category,
    min,
    max,
    sort = '-createdAt',
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};

  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      { title: regex },
      { slug: regex },
      { description: regex },
    ];
  }

  if (inStock) filter.countInStock = { $gt: 0 };
  if (category) filter.category = new RegExp(category, 'i');

  if (min || max) {
    filter.price = {};
    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);
  }

  const pageNum = Math.max(1, parseInt(page));
  const perPage = Math.max(1, Math.min(100, parseInt(limit)));
  const skip = (pageNum - 1) * perPage;

  const total = await Product.countDocuments(filter);

  const sortObj = {};
  String(sort)
    .split(',')
    .forEach((s) => {
      s = s.trim();
      if (!s) return;
      sortObj[s.replace('-', '')] = s.startsWith('-') ? -1 : 1;
    });

  const products = await Product.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(perPage);

  res.json({ products, total, page: pageNum, pages: Math.ceil(total / perPage) });
});

// @desc Get single product
exports.getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  let product = null;

  // First, try to find by ID if the format is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    product = await Product.findById(idOrSlug);
  }
  // If it's not a valid ID or if no product was found by ID, try finding by slug
  if (!product) { 
    product = await Product.findOne({ slug: idOrSlug });
  }

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

// @desc Create new product
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, slug, price, description, category, images, countInStock } = req.body;

  const product = new Product({
    title,
    slug,
    price,
    description,
    category,
    images,
    countInStock,
  });

  const created = await product.save();
  res.status(201).json(created);
});

// @desc Update product
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  Object.assign(product, updates);
  const updated = await product.save();
  res.json(updated);
});

// @desc Delete product (safe)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Optional Cloudinary cleanup
  // if (Array.isArray(product.images)) {
  //   for (const img of product.images) {
  //     try {
  //       await cloudinary.uploader.destroy(img.public_id);
  //     } catch (e) {}
  //   }
  // }

  await product.deleteOne();
  res.json({ message: 'Product deleted', id });
});
