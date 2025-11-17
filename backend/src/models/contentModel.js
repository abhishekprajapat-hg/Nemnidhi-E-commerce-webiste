const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  // To identify the content, e.g., 'homepage', 'about-us'
  page: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // To store the actual content data (slides, categories, promoBanner, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);