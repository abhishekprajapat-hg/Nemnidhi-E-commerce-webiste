const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

/*
 ML-style recommendation: content-based filtering  

*/

router.post("/recommend", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "query missing" });
    }

    // NLP normalize keyword
    const keyword = query.toLowerCase();

    // find similar products using regex + tags match
    const products = await Product.find({
      $or: [
        { name: new RegExp(keyword, "i") },
        { description: new RegExp(keyword, "i") },
        { category: new RegExp(keyword, "i") },
        { tags: keyword },
      ],
    })
      .limit(6)
      .select("name price images category");

    return res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
