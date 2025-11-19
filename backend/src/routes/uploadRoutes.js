// src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage } = require('../controllers/uploadController');


// minimal multer in-memory storage (safe; small files)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// POST /api/upload/image  -> expects multipart/form-data field "file"
router.post('/image', upload.single('file'), uploadImage);

// Backwards-compat: POST /api/upload (some clients call this)
router.post('/', upload.single('file'), uploadImage);

module.exports = router;
