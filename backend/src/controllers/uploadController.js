// src/controllers/uploadController.js
const asyncHandler = require('express-async-handler');
const initCloudinary = require('../config/cloudinary');
const fs = require('fs');
const os = require('os');
const path = require('path');

const cloudinary = initCloudinary();

/**
 * Upload handler that accepts:
 * - req.body.data (base64 data URI)
 * - req.file.path (multer diskStorage)
 * - req.file.buffer (multer memoryStorage)
 * - req.files.file (express-fileupload)
 */
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!cloudinary) {
    res.status(500);
    throw new Error('Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.');
  }

  if (!req.body && !req.file && !req.files) {
    res.status(400);
    throw new Error('No file provided. Send multipart/form-data with "file" or JSON with "data" (base64).');
  }

  // 1) JSON base64 field
  if (req.body && req.body.data) {
    const base64Data = req.body.data;
    try {
      const uploadResult = await cloudinary.uploader.upload(base64Data, {
        folder: 'myshop/products',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
      });
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    } catch (err) {
      console.error('Cloudinary upload (base64) error:', err && err.stack ? err.stack : err);
      res.status(500);
      throw new Error('Image upload failed');
    }
  }

  // 2) multer.diskStorage -> req.file.path
  if (req.file && req.file.path) {
    try {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'myshop/products',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
      });
      // if the file is on disk and you want to delete after upload, try to clean up
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    } catch (err) {
      console.error('Cloudinary upload (disk) error:', err && err.stack ? err.stack : err);
      res.status(500);
      throw new Error('Image upload failed');
    }
  }

  // 3) multer.memoryStorage -> req.file.buffer
  if (req.file && req.file.buffer) {
    // convert buffer to a temporary file and upload, or upload from data URI
    try {
      // Option A: build data URI from buffer
      const mime = req.file.mimetype || 'image/jpeg';
      const dataUri = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'myshop/products',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
      });
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    } catch (err) {
      console.error('Cloudinary upload (buffer) error:', err && err.stack ? err.stack : err);
      res.status(500);
      throw new Error('Image upload failed');
    }
  }

  // 4) express-fileupload style (req.files.file.data)
  if (req.files && req.files.file) {
    try {
      const file = req.files.file;
      const dataUri = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'myshop/products',
        use_filename: true,
        unique_filename: true,
        resource_type: 'image',
      });
      return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    } catch (err) {
      console.error('Cloudinary upload (express-fileupload) error:', err && err.stack ? err.stack : err);
      res.status(500);
      throw new Error('Image upload failed');
    }
  }

  res.status(400);
  throw new Error('Unsupported upload format. Provide file or data.');
});
