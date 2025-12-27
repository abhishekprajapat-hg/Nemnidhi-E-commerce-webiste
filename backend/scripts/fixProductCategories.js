require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");
// 🔁 map OLD → NEW slugs
const MAP = {
  Western: "western",
  WESTERN: "western",
  "Western Wear": "western",

  Saree: "sarees",
  Sarees: "sarees",
  SAREES: "sarees",

  Top: "tops",
  Tops: "tops",

  Sweater: "sweaters",
  Sweaters: "sweaters",
};

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const products = await Product.find({});
    let fixedCount = 0;

    for (const p of products) {
      if (!p.category) continue;

      const cleaned = MAP[p.category];
      if (cleaned && cleaned !== p.category) {
        console.log(`🔧 ${p.title}: ${p.category} → ${cleaned}`);
        p.category = cleaned;
        await p.save();
        fixedCount++;
      }
    }

    console.log(`🎉 Done. Fixed ${fixedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

run();
