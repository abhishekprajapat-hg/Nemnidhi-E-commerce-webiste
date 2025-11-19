const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json((categories || []).filter(Boolean));
});

// Replace your existing getProducts handler with this patched version.

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    min,
    max,
    sort = '-createdAt',
    page = 1,
    limit = 12,
    inStock,
  } = req.query;

  const filter = {};
  const andConditions = [];

  if (q && String(q).trim()) {
    const safe = escapeRegExp(String(q).trim());
    const regex = new RegExp(safe, 'i');
    filter.$or = [{ title: regex }, { slug: regex }, { description: regex }];
  }

  if (category && String(category).trim()) {
    filter.category = new RegExp(escapeRegExp(String(category).trim()), 'i');
  }

  if (String(inStock).toLowerCase() === '1' || String(inStock).toLowerCase() === 'true') {
    andConditions.push({ variants: { $elemMatch: { 'sizes.stock': { $gt: 0 } } } });
  }

  const priceMatch = {};
  const minNum = (min !== undefined && min !== null && String(min).trim() !== '') ? Number(min) : null;
  const maxNum = (max !== undefined && max !== null && String(max).trim() !== '') ? Number(max) : null;
  if (!Number.isNaN(minNum) && minNum !== null) priceMatch.$gte = minNum;
  if (!Number.isNaN(maxNum) && maxNum !== null) priceMatch.$lte = maxNum;
  if (Object.keys(priceMatch).length) {
    andConditions.push({ variants: { $elemMatch: { sizes: { $elemMatch: { price: priceMatch } } } } });
  }

  if (andConditions.length) {
    filter.$and = andConditions;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * perPage;

  const sortObj = {};
  String(sort)
    .split(',')
    .forEach((s) => {
      const t = s.trim();
      if (!t) return;
      if (t.startsWith('-')) sortObj[t.slice(1)] = -1;
      else sortObj[t] = 1;
    });

  // Include variants in projection so frontend gets variant images & sizes
  // (If payload size is a concern, you can limit fields inside variants, e.g. 'variants.color variants.images variants.sizes')
  const projection = 'title slug price images countInStock category rating numReviews createdAt variants';

  let total;
  if (Object.keys(filter).length === 0) {
    total = await Product.estimatedDocumentCount();
  } else {
    total = await Product.countDocuments(filter);
  }

  // fetch products including variants (lean() -> plain objects)
  const products = await Product.find(filter)
    .select(projection)
    .lean()
    .sort(sortObj)
    .skip(skip)
    .limit(perPage)
    .exec();

  // Optional: compute small derived fields for frontend convenience
  const normalized = (products || []).map((p) => {
    // ensure arrays exist
    const variants = Array.isArray(p.variants) ? p.variants : [];

    // collect first non-empty image from variants (flatten), fallback to p.images
    const variantImages = variants.flatMap((v) => (Array.isArray(v.images) ? v.images : []));
    const previewImages = variantImages.length ? variantImages : (Array.isArray(p.images) ? p.images : []);

    // compute min price across variant sizes if present
    const prices = variants.flatMap((v) => (Array.isArray(v.sizes) ? v.sizes.map((s) => Number(s.price || 0)) : []));
    const minVariantPrice = prices.length ? Math.min(...prices) : (Number(p.price || 0));

    // convert possible BSON-like numeric wrappers (if any) to plain numbers defensively
    const safeNum = (val) => {
      if (val == null) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && val.trim() !== '') {
        const asn = Number(val);
        return Number.isFinite(asn) ? asn : 0;
      }
      if (typeof val === 'object') {
        if ('$numberInt' in val) return Number(val.$numberInt) || 0;
        if ('$numberLong' in val) return Number(val.$numberLong) || 0;
        if ('$numberDouble' in val) return Number(val.$numberDouble) || 0;
        if ('$decimal128' in val) return Number(val.$decimal128) || 0;
      }
      return 0;
    };

    return {
      ...p,
      previewImages: Array.isArray(previewImages) ? previewImages : [],
      minVariantPrice: safeNum(minVariantPrice),
      // keep variants as-is (frontend may need full structure)
      variants,
    };
  });

  res.json({
    products: normalized,
    total,
    page: pageNum,
    pages: Math.ceil(total / perPage),
  });
});


exports.getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  let product = null;

  if (isValidObjectId(idOrSlug)) {
    product = await Product.findById(idOrSlug).lean();
  }

  if (!product) {
    product = await Product.findOne({ slug: idOrSlug }).lean();
  }

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    category,
    variants,
  } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error('Title is required');
  }

  const product = new Product({
    title: String(title).trim(),
    slug: slug ? String(slug).trim() : undefined,
    description,
    category,
    variants: Array.isArray(variants) ? variants : [],
  });

  const created = await product.save();
  res.status(201).json(created);
});

// inside productController.js (updateProduct)
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Accept partial updates; if variants provided, validate structure
  const updates = req.body || {};

  // Basic validation examples
  if (updates.slug && typeof updates.slug !== 'string') {
    res.status(400);
    throw new Error('Invalid slug');
  }

  // Merge safely
  Object.keys(updates).forEach((k) => {
    if (k === 'variants') {
      // Replace variants array only if it's an array
      if (Array.isArray(updates.variants)) product.variants = updates.variants;
    } else {
      product[k] = updates[k];
    }
  });

  try {
    const saved = await product.save();
    res.json(saved);
  } catch (err) {
    console.error('Product update error:', err && err.stack ? err.stack : err);
    // Mongoose validation error -> send message
    res.status(500);
    throw new Error(err.message || 'Failed to update product');
  }
});


exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  await product.deleteOne();
  res.json({ message: 'Product deleted', id });
});

exports.createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { id } = req.params;

  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authenticated');
  }

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid product ID');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userIdStr = String(req.user._id);
  const alreadyReviewed = (product.reviews || []).some((r) => String(r.user) === userIdStr);
  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Already reviewed');
  }

  const parsedRating = Number(rating);
  if (Number.isNaN(parsedRating) || parsedRating < 0) {
    res.status(400);
    throw new Error('Invalid rating');
  }

  const review = {
    name: req.user.name || '',
    rating: parsedRating,
    comment: comment || '',
    user: req.user._id,
  };

  product.reviews = product.reviews || [];
  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0) /
    (product.reviews.length || 1);

  await product.save();
  res.status(201).json({ message: 'Review added' });
});
