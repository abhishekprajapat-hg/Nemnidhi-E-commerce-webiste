// backend/src/seed/seedProducts.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const connectDB = require("../config/db");

const sarees = [
  {
    title: "Banarasi Silk Saree",
    slug: "banarasi-silk-saree",
    description:
      "Elegant Banarasi silk saree handwoven with intricate zari motifs, known for its regal texture and timeless charm. Perfect for weddings and festive occasions.",
    price: 8999,
    category: "Sarees",
    brand: "Banaras Heritage",
    countInStock: 15,
    image: "https://www.utsavpedia.com/wp-content/uploads/2013/07/pure-baluchari-handloom-silk-saree-in-fuchsia.jpg",
  },
  {
    title: "Kanjivaram Saree",
    slug: "kanjivaram-saree",
    description:
      "Traditional Kanjivaram silk saree from Tamil Nadu featuring gold threadwork and vibrant contrast borders, symbolizing South Indian craftsmanship.",
    price: 10999,
    category: "Sarees",
    brand: "Kanchipuram Weaves",
    countInStock: 12,
    image: "https://example.com/images/kanjivaram.jpg",
  },
  {
    title: "Paithani Saree",
    slug: "paithani-saree",
    description:
      "Handwoven Paithani saree from Maharashtra, known for its peacock pallu and rich zari borders crafted with precision and grace.",
    price: 11999,
    category: "Sarees",
    brand: "Paithani Looms",
    countInStock: 10,
    image: "https://example.com/images/paithani.jpg",
  },
  {
    title: "Bandhani Saree",
    slug: "bandhani-saree",
    description:
      "Colorful Bandhani saree from Gujarat and Rajasthan made using tie-and-dye techniques creating mesmerizing dotted patterns.",
    price: 5999,
    category: "Sarees",
    brand: "Rajasthan Bandhej",
    countInStock: 20,
    image: "https://example.com/images/bandhani.jpg",
  },
  {
    title: "Patola Saree",
    slug: "patola-saree",
    description:
      "Double ikat Patola saree from Patan, woven with intricate geometric designs and bright colors. A true symbol of luxury and art.",
    price: 24999,
    category: "Sarees",
    brand: "Patola Heritage",
    countInStock: 5,
    image: "https://example.com/images/patola.jpg",
  },
];

const tops = [
  {
    title: "Classic White Button-Down Top",
    slug: "classic-white-button-down-top",
    description: "A timeless wardrobe staple, this crisp white button-down top is perfect for both office and casual wear. Made from breathable cotton.",
    price: 2499,
    category: "Tops",
    brand: "Urban Essentials",
    countInStock: 30,
    image: "https://example.com/images/white-button-down.jpg",
  },
  {
    title: "Floral Print Peplum Top",
    slug: "floral-print-peplum-top",
    description: "A charming floral peplum top with a flattering silhouette. The vibrant print adds a pop of color to your look.",
    price: 1999,
    category: "Tops",
    brand: "Bloom Chic",
    countInStock: 25,
    image: "https://example.com/images/floral-peplum-top.jpg",
  },
  {
    title: "Striped Off-Shoulder Top",
    slug: "striped-off-shoulder-top",
    description: "Stay on-trend with this stylish striped off-shoulder top. The elasticated neckline ensures a comfortable fit.",
    price: 1799,
    category: "Tops",
    brand: "Summer Vibes",
    countInStock: 20,
    image: "https://example.com/images/striped-off-shoulder.jpg",
  },
  {
    title: "Lace Detail Camisole Top",
    slug: "lace-detail-camisole-top",
    description: "An elegant camisole top featuring delicate lace trim. Perfect for layering or wearing on its own for a dressy occasion.",
    price: 1499,
    category: "Tops",
    brand: "Luxe Layers",
    countInStock: 35,
    image: "https://example.com/images/lace-camisole.jpg",
  },
  {
    title: "Ruffled Sleeve Blouse",
    slug: "ruffled-sleeve-blouse",
    description: "Make a statement with this beautiful blouse adorned with dramatic ruffled sleeves. Available in multiple colors.",
    price: 2799,
    category: "Tops",
    brand: "Femme Fatale",
    countInStock: 15,
    image: "https://example.com/images/ruffled-sleeve-blouse.jpg",
  },
];

const jeans = [
  {
    title: "Classic Straight-Leg Jeans",
    slug: "classic-straight-leg-jeans",
    description: "A timeless pair of straight-leg jeans in a medium wash. Made from durable denim with a hint of stretch for comfort.",
    price: 3999,
    category: "Jeans",
    brand: "Denim Co.",
    countInStock: 40,
    image: "https://example.com/images/straight-leg-jeans.jpg",
  },
  {
    title: "Slim-Fit Dark Wash Jeans",
    slug: "slim-fit-dark-wash-jeans",
    description: "A modern slim-fit jean in a versatile dark wash. Perfect for dressing up or down.",
    price: 4299,
    category: "Jeans",
    brand: "Urban Denim",
    countInStock: 35,
    image: "https://example.com/images/slim-fit-dark-jeans.jpg",
  },
  {
    title: "High-Waisted Skinny Jeans",
    slug: "high-waisted-skinny-jeans",
    description: "Flatter your figure with these high-waisted skinny jeans. The stretchy fabric provides a comfortable, body-hugging fit.",
    price: 3799,
    category: "Jeans",
    brand: "Sculpt & Fit",
    countInStock: 50,
    image: "https://example.com/images/high-waisted-skinny.jpg",
  },
  {
    title: "Relaxed Fit Light Wash Jeans",
    slug: "relaxed-fit-light-wash-jeans",
    description: "Your new favorite weekend jeans. A comfortable relaxed fit in a trendy light wash.",
    price: 3599,
    category: "Jeans",
    brand: "Casual Day",
    countInStock: 30,
    image: "https://example.com/images/relaxed-fit-light-jeans.jpg",
  },
  {
    title: "Black Ripped Skinny Jeans",
    slug: "black-ripped-skinny-jeans",
    description: "Add some edge to your look with these black skinny jeans featuring distressed details and rips.",
    price: 4499,
    category: "Jeans",
    brand: "Rebel Wear",
    countInStock: 25,
    image: "https://example.com/images/black-ripped-jeans.jpg",
  },
];

const sweaters = [
  {
    title: "Classic Crewneck Wool Sweater",
    slug: "classic-crewneck-wool-sweater",
    description: "A timeless crewneck sweater crafted from 100% merino wool. Soft, warm, and perfect for layering in cold weather.",
    price: 4999,
    category: "Sweaters",
    brand: "Woolen Co.",
    countInStock: 25,
    image: "https://example.com/images/crewneck-wool-sweater.jpg",
  },
  {
    title: "V-Neck Cashmere Sweater",
    slug: "v-neck-cashmere-sweater",
    description: "Indulge in the luxury of pure cashmere with this elegant V-neck sweater. A versatile piece for a sophisticated look.",
    price: 8999,
    category: "Sweaters",
    brand: "Luxe Knits",
    countInStock: 15,
    image: "https://example.com/images/v-neck-cashmere-sweater.jpg",
  },
  {
    title: "Chunky Knit Turtleneck",
    slug: "chunky-knit-turtleneck",
    description: "Stay cozy and stylish in this chunky knit turtleneck sweater. The oversized fit makes it a comfortable winter essential.",
    price: 5499,
    category: "Sweaters",
    brand: "Cozy Wear",
    countInStock: 20,
    image: "https://example.com/images/chunky-turtleneck.jpg",
  },
  {
    title: "Striped Cotton Sweater",
    slug: "striped-cotton-sweater",
    description: "A lightweight cotton sweater with classic stripes. Perfect for transitional weather or a casual day out.",
    price: 3499,
    category: "Sweaters",
    brand: "Casual Day",
    countInStock: 30,
    image: "https://example.com/images/striped-cotton-sweater.jpg",
  },
  {
    title: "Fair Isle Pattern Sweater",
    slug: "fair-isle-pattern-sweater",
    description: "Embrace traditional style with this Fair Isle sweater, featuring intricate patterns and a festive feel.",
    price: 5999,
    category: "Sweaters",
    brand: "Heritage Knits",
    countInStock: 18,
    image: "https://example.com/images/fair-isle-sweater.jpg",
  },
];

const western = [
  {
    title: "Floral Maxi Dress",
    slug: "floral-maxi-dress",
    description: "A beautiful floral maxi dress with a flowing silhouette, perfect for summer days and garden parties.",
    price: 4999,
    category: "Western",
    brand: "Summer Bloom",
    countInStock: 20,
    image: "https://example.com/images/floral-maxi-dress.jpg",
  },
  {
    title: "Denim Jacket",
    slug: "denim-jacket",
    description: "A classic, versatile denim jacket that's a must-have in any wardrobe. Perfect for layering over any outfit.",
    price: 3499,
    category: "Western",
    brand: "Denim Co.",
    countInStock: 40,
    image: "https://example.com/images/denim-jacket.jpg",
  },
  {
    title: "Little Black Dress",
    slug: "little-black-dress",
    description: "An elegant and timeless little black dress with a modern cut. Your go-to choice for any evening event.",
    price: 5999,
    category: "Western",
    brand: "Evening Elegance",
    countInStock: 15,
    image: "https://example.com/images/little-black-dress.jpg",
  },
  {
    title: "Plaid Flannel Shirt",
    slug: "plaid-flannel-shirt",
    description: "A soft and cozy plaid flannel shirt, perfect for a casual, rustic look. Can be worn buttoned up or open over a tee.",
    price: 2499,
    category: "Western",
    brand: "Country Comfort",
    countInStock: 30,
    image: "https://example.com/images/plaid-flannel-shirt.jpg",
  },
  {
    title: "High-Waisted Trousers",
    slug: "high-waisted-trousers",
    description: "Chic high-waisted trousers with a wide-leg cut. A sophisticated choice for the office or a stylish day out.",
    price: 3999,
    category: "Western",
    brand: "Office Style",
    countInStock: 25,
    image: "https://example.com/images/high-waisted-trousers.jpg",
  },
];

async function seed() {
  try {
    await connectDB();

    // Seed Sarees
    await Product.deleteMany({ category: "Sarees" }); // Clear old sarees
    await Product.insertMany(sarees); // Add new sarees
    console.log(`✅ ${sarees.length} Sarees seeded successfully!`);

    // Seed Tops
    await Product.deleteMany({ category: "Tops" }); // Clear old tops
    await Product.insertMany(tops); // Add new tops
    console.log(`✅ ${tops.length} Tops seeded successfully!`);

    // Seed Jeans
    await Product.deleteMany({ category: "Jeans" }); // Clear old jeans
    await Product.insertMany(jeans); // Add new jeans
    console.log(`✅ ${jeans.length} Jeans seeded successfully!`);

    // Seed Sweaters
    await Product.deleteMany({ category: "Sweaters" }); // Clear old sweaters
    await Product.insertMany(sweaters); // Add new sweaters
    console.log(`✅ ${sweaters.length} Sweaters seeded successfully!`);

    // Seed Western
    await Product.deleteMany({ category: "Western" }); // Clear old western wear
    await Product.insertMany(western); // Add new western wear
    console.log(`✅ ${western.length} Western wear items seeded successfully!`);

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
