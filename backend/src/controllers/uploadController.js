// src/controllers/uploadController.js
const asyncHandler = require('express-async-handler');
const initCloudinary = require('../config/cloudinary');

const cloudinary = initCloudinary();

// POST /api/upload/image
// Protected: admin only
exports.uploadImage = asyncHandler(async (req, res) => {
  if (!cloudinary) {
    res.status(500);
    throw new Error('Cloudinary not configured on server. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.');
  }

  // Expect multipart/form-data with field "file"
  if (!req.files && !req.file && !req.body) {
    res.status(400);
    throw new Error('No file provided.');
  }

  // Support two options:
  // 1) Server receives file via middleware like express-fileupload (binary)
  // 2) Frontend sends base64 string in JSON: { data: 'data:image/...' }
  // We'll handle base64 in req.body.data first; if not present, try req.files.file

  let uploadResult = null;

  // Option A: base64 string in body (JSON)
  if (req.body && req.body.data) {
    // body expects: { data: 'data:image/png;base64,...' }
    const base64Data = req.body.data;
    uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: 'myshop/products',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image'
    });
    return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
  }

  // Option B: multipart/form-data file
  // For this we need a file-parsing middleware. We'll assume router uses multer.
  if (req.file && req.file.path) {
    // If using multer with diskStorage, req.file.path contains file path on server
    uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'myshop/products',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image'
    });
    return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
  }

  // Option C: if using express-fileupload: req.files.file.data is buffer
  if (req.files && req.files.file) {
    const file = req.files.file;
    // file.data is buffer: convert to base64 URI
    const dataUri = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
    uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'myshop/products',
      use_filename: true,
      unique_filename: true,
      resource_type: 'image'
    });
    return res.json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
  }

  res.status(400);
  throw new Error('Unsupported upload format. Send JSON with "data" (base64) or multipart/form-data file.');
});
