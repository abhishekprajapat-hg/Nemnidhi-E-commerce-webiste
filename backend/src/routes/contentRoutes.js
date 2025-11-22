// routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getHomepageContent,
  updateHomepageContent,
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

// PUBLIC GET
router.get('/homepage', getHomepageContent);

// ADMIN SAVE (POST + PUT BOTH)
router.post('/homepage', protect, admin, updateHomepageContent);
router.put('/homepage', protect, admin, updateHomepageContent);

module.exports = router;
