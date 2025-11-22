// controllers/productController.js
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product'); // adjust path if needed

/* ---------------------------
   Helpers
   --------------------------- */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseListParam(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---------------------------
   GET /api/products/categories
   Returns unique categories
   --------------------------- */
exports.getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json((categories || []).filter(Boolean));
});

/* ---------------------------
   GET /api/products
   Advanced filtering + sorting + pagination.
   Supports two modes:
     1) Denormalized mode (fast) — product has minPrice, totalStock, aggColors, aggSizes
     2) Aggregation fallback — unwinds variants & sizes and groups (slower)
   Query params supported from frontend:
     q, category, minPrice, maxPrice, brands, colors, sizes, minRating,
     inStock, sort, sortBy, order, page, limit
   --------------------------- */
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    q = '',
    category,
    minPrice,
    maxPrice,
    brands = '',
    colors = '',
    sizes = '',
    minRating,
    inStock,
    sort = '-createdAt',
    sortBy,
    order = 'desc',
    page = '1',
    limit = '12',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * perPage;

  const brandArr = parseListParam(brands);
  const colorArr = parseListParam(colors);
  const sizeArr = parseListParam(sizes);

  const minP = minPrice !== undefined && String(minPrice).trim() !== '' ? Number(minPrice) : null;
  const maxP = maxPrice !== undefined && String(maxPrice).trim() !== '' ? Number(maxPrice) : null;
  const minR = minRating !== undefined && String(minRating).trim() !== '' ? Number(minRating) : null;
  const inStockBool = String(inStock).toLowerCase() === '1' || String(inStock).toLowerCase() === 'true';

  // Decide if model has denormalized fields
  const hasDenorm =
    Boolean(Product.schema.path('minPrice')) ||
    Boolean(Product.schema.path('totalStock')) ||
    Boolean(Product.schema.path('aggColors')) ||
    Boolean(Product.schema.path('aggSizes'));

  // Build sort object
  let sortObj = {};
  if (sortBy) {
    const dir = String(order).toLowerCase() === 'asc' ? 1 : -1;
    if (sortBy === 'price') sortObj = { minPrice: dir };
    else sortObj[sortBy] = dir;
  } else if (sort) {
    String(sort)
      .split(',')
      .forEach((s) => {
        const t = String(s).trim();
        if (!t) return;
        if (t.startsWith('-')) sortObj[t.slice(1)] = -1;
        else sortObj[t] = 1;
      });
  } else {
    sortObj = { createdAt: -1 };
  }

  // Projection — keep variants so frontend can use images/sizes; adjust to trim payload
  const projection = 'title slug description category brand minPrice maxPrice totalStock aggColors aggSizes rating numReviews createdAt variants reviews images';

  if (hasDenorm) {
    // Fast path using denormalized fields and regular queries
    const filter = {};

    if (q && String(q).trim()) {
      const safe = String(q).trim();
      const reg = new RegExp(escapeRegExp(safe), 'i');
      filter.$or = [{ title: reg }, { slug: reg }, { description: reg }];
    }

    if (category && String(category).trim()) filter.category = String(category).trim();
    if (brandArr.length) filter.brand = { $in: brandArr };
    if (minR != null) filter.rating = { $gte: minR };

    if (minP != null || maxP != null) {
      filter.minPrice = {};
      if (minP != null) filter.minPrice.$gte = minP;
      if (maxP != null) filter.minPrice.$lte = maxP;
    }

    if (colorArr.length) filter.aggColors = { $in: colorArr };
    if (sizeArr.length) filter.aggSizes = { $in: sizeArr };
    if (inStockBool) filter.totalStock = { $gt: 0 };

    const total = Object.keys(filter).length === 0 ? await Product.estimatedDocumentCount() : await Product.countDocuments(filter);
    const pages = Math.max(1, Math.ceil((total || 0) / perPage));

    const products = await Product.find(filter)
      .select(projection)
      .lean()
      .sort(sortObj)
      .skip(skip)
      .limit(perPage)
      .exec();

    // Normalize small conveniences: previewImages, minVariantPrice (if variants available)
    const normalized = (products || []).map((p) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const variantImages = variants.flatMap((v) => (Array.isArray(v.images) ? v.images : []));
      const previewImages = variantImages.length ? variantImages : (Array.isArray(p.images) ? p.images : []);
      const prices = variants.flatMap((v) => (Array.isArray(v.sizes) ? v.sizes.map((s) => Number(s.price || 0)) : []));
      const minVariantPrice = prices.length ? Math.min(...prices) : (p.minPrice || 0);
      const toNum = (val) => (val == null ? 0 : Number(val) || 0);

      return {
        ...p,
        previewImages: Array.isArray(previewImages) ? previewImages : [],
        minVariantPrice: toNum(minVariantPrice),
        totalStock: toNum(p.totalStock),
      };
    });

    return res.json({ products: normalized, total, page: pageNum, pages });
  } else {
    // Fallback: aggregation that unwinds variants & sizes, computes aggregated fields, then filters & paginates
    // This is heavier but works with original nested schema.
    const colorsFilter = colorArr;
    const sizesFilter = sizeArr;

    const pipeline = [];

    // Text / regex search & category/minRating at top-level (reduce set early)
    const topMatch = {};
    if (category && String(category).trim()) topMatch.category = String(category).trim();
    if (minR != null) topMatch.rating = { $gte: minR };
    if (q && String(q).trim()) {
      const safe = String(q).trim();
      const reg = new RegExp(escapeRegExp(safe), 'i');
      // use $or regex search to avoid reliance on text index (works universally)
      topMatch.$or = [{ title: reg }, { slug: reg }, { description: reg }];
    }
    if (Object.keys(topMatch).length) pipeline.push({ $match: topMatch });

    // Unwind variants and sizes to compute price & stock aggregates
    pipeline.push(
      { $unwind: { path: '$variants', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$variants.sizes', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          _sizePrice: '$variants.sizes.price',
          _sizeStock: '$variants.sizes.stock',
          _variantColor: '$variants.color',
          _sizeName: '$variants.sizes.size',
        },
      },
      {
        $group: {
          _id: '$_id',
          doc: { $first: '$$ROOT' },
          minPrice: { $min: { $ifNull: ['$_sizePrice', null] } },
          maxPrice: { $max: { $ifNull: ['$_sizePrice', null] } },
          totalStock: { $sum: { $ifNull: ['$_sizeStock', 0] } },
          aggColors: { $addToSet: { $ifNull: ['$_variantColor', null] } },
          aggSizes: { $addToSet: { $ifNull: ['$_sizeName', null] } },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$doc',
              {
                minPrice: '$minPrice',
                maxPrice: '$maxPrice',
                totalStock: '$totalStock',
                aggColors: '$aggColors',
                aggSizes: '$aggSizes',
              },
            ],
          },
        },
      },
      {
        $addFields: {
          aggColors: {
            $filter: { input: '$aggColors', as: 'c', cond: { $ne: ['$$c', null] } },
          },
          aggSizes: {
            $filter: { input: '$aggSizes', as: 's', cond: { $ne: ['$$s', null] } },
          },
        },
      }
    );

    // Advanced filters applied after aggregation
    const advancedMatch = {};

    if (minP != null || maxP != null) {
      advancedMatch.minPrice = {};
      if (minP != null) advancedMatch.minPrice.$gte = minP;
      if (maxP != null) advancedMatch.minPrice.$lte = maxP;
    }
    if (colorsFilter.length) advancedMatch.aggColors = { $in: colorsFilter };
    if (sizesFilter.length) advancedMatch.aggSizes = { $in: sizesFilter };
    if (inStockBool) advancedMatch.totalStock = { $gt: 0 };
    if (brandArr.length) advancedMatch.brand = { $in: brandArr }; // brand must be top-level to match

    if (Object.keys(advancedMatch).length) pipeline.push({ $match: advancedMatch });

    // Sorting stage: map price -> minPrice
    let aggSort = {};
    if (sortBy) {
      const dir = String(order).toLowerCase() === 'asc' ? 1 : -1;
      if (sortBy === 'price') aggSort = { minPrice: dir };
      else aggSort[sortBy] = dir;
    } else if (sort) {
      String(sort)
        .split(',')
        .forEach((s) => {
          const t = String(s).trim();
          if (!t) return;
          if (t.startsWith('-')) aggSort[t.slice(1)] = -1;
          else aggSort[t] = 1;
        });
    } else {
      aggSort = { createdAt: -1 };
    }

    // Facet for pagination + total count
    pipeline.push({ $sort: aggSort });
    pipeline.push({
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: perPage }],
        totalCount: [{ $count: 'count' }],
      },
    });

    const aggResult = await Product.aggregate(pipeline).allowDiskUse(true).exec();
    const paginated = aggResult[0]?.paginatedResults || [];
    const total = (aggResult[0]?.totalCount?.[0]?.count) || 0;
    const pages = Math.max(1, Math.ceil(total / perPage));

    // Normalize: ensure previewImages & minVariantPrice for UI
    const normalized = (paginated || []).map((p) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const variantImages = variants.flatMap((v) => (Array.isArray(v.images) ? v.images : []));
      const previewImages = variantImages.length ? variantImages : (Array.isArray(p.images) ? p.images : []);
      const prices = variants.flatMap((v) => (Array.isArray(v.sizes) ? v.sizes.map((s) => Number(s.price || 0)) : []));
      const minVariantPrice = prices.length ? Math.min(...prices) : (p.minPrice || 0);
      const toNum = (val) => (val == null ? 0 : Number(val) || 0);

      return {
        ...p,
        previewImages: Array.isArray(previewImages) ? previewImages : [],
        minVariantPrice: toNum(minVariantPrice),
        totalStock: toNum(p.totalStock),
      };
    });

    return res.json({ products: normalized, total, page: pageNum, pages });
  }
});

/* ---------------------------
   GET /api/products/:idOrSlug
   returns product by id or slug
   --------------------------- */
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

/* ---------------------------
   POST /api/products
   create product
   --------------------------- */
exports.createProduct = asyncHandler(async (req, res) => {
  const { title, slug, description, category, brand, variants } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error('Title is required');
  }

  const product = new Product({
    title: String(title).trim(),
    slug: slug ? String(slug).trim() : undefined,
    description: description || '',
    category: category || '',
    brand: brand || '',
    variants: Array.isArray(variants) ? variants : [],
  });

  const created = await product.save();
  res.status(201).json(created);
});

/* ---------------------------
   PUT /api/products/:id
   update product (partial allowed)
   --------------------------- */
exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Accept partial updates; if variants provided, replace only if array
  const updates = req.body || {};

  // Basic validation examples
  if (updates.slug && typeof updates.slug !== 'string') {
    res.status(400);
    throw new Error('Invalid slug');
  }

  Object.keys(updates).forEach((k) => {
    if (k === 'variants') {
      if (Array.isArray(updates.variants)) product.variants = updates.variants;
    } else {
      product[k] = updates[k];
    }
  });

  try {
    const saved = await product.save(); // triggers pre('save') if present in model
    res.json(saved);
  } catch (err) {
    console.error('Product update error:', err && err.stack ? err.stack : err);
    res.status(500);
    throw new Error(err.message || 'Failed to update product');
  }
});

/* ---------------------------
   DELETE /api/products/:id
   --------------------------- */
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

/* ---------------------------
   POST /api/products/:id/reviews
   create review
   --------------------------- */
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
