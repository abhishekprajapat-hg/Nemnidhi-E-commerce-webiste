const asyncHandler = require('express-async-handler');
const Content = require('../models/contentModel'); // This path must be correct

/**
 * @desc    Get homepage content
 * @route   GET /api/content/homepage
 * @access  Public
 */
const getHomepageContent = asyncHandler(async (req, res) => {
  const homepageContent = await Content.findOne({ page: 'homepage' });

  if (homepageContent) {
    res.json(homepageContent.data);
  } else {
    // If no content is found, the frontend has a fallback. Return null with a 200 OK status
    // to prevent the browser from logging a 404 error in the console.
    res.status(200).json(null);
  }
});

/**
 * @desc    Create or Update homepage content
 * @route   PUT /api/content/homepage
 * @access  Admin
 */
const updateHomepageContent = asyncHandler(async (req, res) => {
  const contentData = req.body; // The entire data object from the frontend

  // Use findOneAndUpdate with 'upsert' to create the document if it doesn't exist
  const updatedContent = await Content.findOneAndUpdate(
    { page: 'homepage' },
    { data: contentData },
    { new: true, upsert: true, runValidators: true }
  );

  if (updatedContent) {
    res.status(200).json(updatedContent.data);
  } else {
    res.status(500);
    throw new Error('Failed to save homepage content.');
  }
});

module.exports = { getHomepageContent, updateHomepageContent };