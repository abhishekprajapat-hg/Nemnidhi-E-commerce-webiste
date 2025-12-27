// scripts/migrateCategories.js
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");

  const MAP = {
    "Sarees": "sarees",
    "Saree": "sarees",
    "Banarasi Sarees": "banarasi-sarees",
    "Designer Lehengas": "designer-lehengas",
  };

  for (const [oldVal, newVal] of Object.entries(MAP)) {
    const res = await Product.updateMany(
      { category: oldVal },
      { $set: { category: newVal } }
    );
    console.log(`🔁 ${oldVal} → ${newVal} | updated: ${res.modifiedCount}`);
  }

  console.log("🎉 Category migration completed");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed", err);
  process.exit(1);
});
