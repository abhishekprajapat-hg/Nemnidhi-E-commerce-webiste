const asyncHandler = require('express-async-handler');
const Content = require('../models/contentModel');
const mongoose = require('mongoose');

const HOMEPAGE_CACHE_TTL = 30 * 1000;
let homepageCache = null;
let homepageCacheAt = 0;



function trimProductForList(p) {
  if (!p) return null;
  return {
    _id: p._id,
    title: p.title,
    slug: p.slug,
    price: Number(p.price || 0),
    images: Array.isArray(p.images) ? p.images.slice(0, 4) : [],
    rating: p.rating || 0,
    numReviews: p.numReviews || 0,
    countInStock: typeof p.countInStock !== 'undefined' ? p.countInStock : undefined,
  };
}

function trimHomepageData(data = {}) {
  if (!data || typeof data !== 'object') return data;

  const out = { ...data };

  if (Array.isArray(out.heroBanners)) {
    out.heroBanners = out.heroBanners
      .map((b) => ({
        title: b.title,
        subtitle: b.subtitle,
        image: Array.isArray(b.image) ? b.image[0] : b.image || null,
        cta: b.cta || null,
      }))
      .slice(0, 6);
  }

  if (Array.isArray(out.featured)) {
    out.featured = out.featured
      .map((f) => ({
        title: f.title,
        subtitle: f.subtitle,
        image: f.image ? (Array.isArray(f.image) ? f.image[0] : f.image) : null,
        link: f.link || null,
      }))
      .slice(0, 8);
  }

  const productArrayKeys = ['newArrivals', 'products', 'recommended', 'youMayAlsoLike', 'relatedProducts'];
  for (const key of productArrayKeys) {
    if (Array.isArray(out[key])) {
      out[key] = out[key].slice(0, 8).map(trimProductForList);
    }
  }

  if (Array.isArray(out.sections)) {
    out.sections = out.sections.slice(0, 12).map((s) => {
      const ns = { ...s };
      if (Array.isArray(ns.products)) {
        ns.products = ns.products.slice(0, 8).map(trimProductForList);
      }
      if (Array.isArray(ns.image)) ns.image = ns.image.slice(0, 2);
      else if (ns.image) ns.image = ns.image;
      return ns;
    });
  }

  if (typeof out.longHtml === 'string' && out.longHtml.length > 4000) {
    out.longHtml = out.longHtml.slice(0, 2000) + '...';
  }

  if (out.meta && out.meta.description && out.meta.description.length > 800) {
    out.meta.description = out.meta.description.slice(0, 500) + '...';
  }

  return out;
}

const getHomepageContent = asyncHandler(async (req, res) => {
  const wantRaw = String(req.query.raw || '').toLowerCase() === '1' || (req.user && req.user.isAdmin);

  const now = Date.now();
  if (!wantRaw && homepageCache && now - homepageCacheAt < HOMEPAGE_CACHE_TTL) {
    return res.json(homepageCache);
  }

  const doc = await Content.findOne({ page: 'homepage' }).lean();
  if (!doc) {
    return res.status(200).json(null);
  }

  const fullData = doc.data || null;

  if (wantRaw) {
    return res.json(fullData);
  }

  const trimmed = trimHomepageData(fullData);

  homepageCache = trimmed;
  homepageCacheAt = Date.now();

  try {
    if (process.env.NODE_ENV !== 'production') {
      const bytes = Buffer.byteLength(JSON.stringify(trimmed), 'utf8');
      console.log(`Homepage trimmed JSON size: ${Math.round(bytes / 1024)} KB`);
    }
  } catch (e) {
    // intentionally empty
  }

  return res.json(trimmed);
});

const updateHomepageContent = asyncHandler(async (req, res) => {
  // quick guard against empty/huge bodies (adjust threshold if you want)
  if (!req.body || typeof req.body !== 'object') {
    res.status(400);
    throw new Error('Invalid request body.');
  }

  // Optional: reject overly large payloads (very rough check)
  try {
    const sizeBytes = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (sizeBytes > MAX_SIZE) {
      res.status(413);
      throw new Error('Payload too large. Upload images separately and use URLs.');
    }
  } catch (e) {
    // continue — JSON.stringify might fail for circular refs but unlikely
  }

  const contentData = req.body;

  // Build update using $set and ensure page is set on upsert.
  const updateDoc = {
    $set: {
      data: contentData,
      page: 'homepage',
    },
  };

  try {
    const updatedContent = await Content.findOneAndUpdate(
      { page: 'homepage' },
      updateDoc,
      {
        new: true,
        upsert: true,
        runValidators: true,
        context: 'query', // necessary for some validators on findOneAndUpdate
        setDefaultsOnInsert: true,
      }
    ).lean();

    if (!updatedContent) {
      res.status(500);
      throw new Error('Failed to save homepage content.');
    }

    // clear cache so next GET returns fresh trimmed data
    homepageCache = null;
    homepageCacheAt = 0;

    return res.status(200).json(updatedContent.data || null);
  } catch (err) {
    // If Mongoose validation error, return useful message
    if (err && err.name === 'ValidationError') {
      res.status(422);
      const messages = Object.values(err.errors || {}).map((e) => e.message).join('; ');
      return res.json({ error: 'Validation failed', details: messages || err.message });
    }

    // Other errors bubble up
    console.error('Error saving homepage content:', err);
    res.status(500);
    throw new Error('Failed to save homepage content. See server logs for details.');
  }
});





module.exports = { getHomepageContent, updateHomepageContent };
