const express = require('express');
const router = express.Router();
const {
  getHomepageContent,
  updateHomepageContent,
} = require('../controllers/contentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/homepage').get(getHomepageContent);
router.route('/homepage').put(protect, admin, updateHomepageContent);

module.exports = router;
