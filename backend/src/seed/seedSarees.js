// backend/seed/seedSarees.js
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product'); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/yourdb';

const sareeProducts = [
  {
    title: 'Banarasi Silk Saree',
    slug: 'banarasi-silk-saree-red',
    description: 'Handwoven Banarasi silk saree, rich zari work.',
    category: 'Sarees',
    price: 3499,
    sizes: ['Free'],
    colors: ['Red', 'Blue', 'Green', 'Yellow'],
    images: ['https://via.placeholder.com/800x1000?text=banarasi-main'],
    countInStock: 15,
    variants: [
      { slug: 'banarasi-silk-saree-red', color: 'Red', image: 'https://via.placeholder.com/400x500/FF0000/fff?text=Red' },
      { slug: 'banarasi-silk-saree-blue', color: 'Blue', image: 'https://via.placeholder.com/400x500/0000FF/fff?text=Blue' },
      { slug: 'banarasi-silk-saree-green', color: 'Green', image: 'https://via.placeholder.com/400x500/008000/fff?text=Green' },
      { slug: 'banarasi-silk-saree-yellow', color: 'Yellow', image: 'https://via.placeholder.com/400x500/FFFF00/000?text=Yellow' },
    ],
  },
  {
    title: 'Kanjeevaram Silk Saree',
    slug: 'kanjeevaram-silk-saree-red',
    description: 'Pure Kanjeevaram with temple border.',
    category: 'Sarees',
    price: 5599,
    sizes: ['Free'],
    colors: ['Red', 'Maroon', 'Peacock', 'Pink'],
    images: ['https://via.placeholder.com/800x1000?text=kanjeevaram-main'],
    countInStock: 8,
    variants: [
      { slug: 'kanjeevaram-silk-saree-red', color: 'Red', image: 'https://via.placeholder.com/400x500/FF0000/fff?text=Red' },
      { slug: 'kanjeevaram-silk-saree-maroon', color: 'Maroon', image: 'https://via.placeholder.com/400x500/800000/fff?text=Maroon' },
      { slug: 'kanjeevaram-silk-saree-peacock', color: 'Peacock', image: 'https://via.placeholder.com/400x500/006064/fff?text=Peacock' },
      { slug: 'kanjeevaram-silk-saree-pink', color: 'Pink', image: 'https://via.placeholder.com/400x500/FFC0CB/000?text=Pink' },
    ],
  },
  {
    title: 'Chiffon Designer Saree',
    slug: 'chiffon-designer-saree-black',
    description: 'Lightweight chiffon saree with designer border.',
    category: 'Sarees',
    price: 2199,
    sizes: ['Free'],
    colors: ['Black', 'Beige', 'Wine', 'Teal'],
    images: ['https://via.placeholder.com/800x1000?text=chiffon-main'],
    countInStock: 20,
    variants: [
      { slug: 'chiffon-designer-saree-black', color: 'Black', image: 'https://via.placeholder.com/400x500/000000/fff?text=Black' },
      { slug: 'chiffon-designer-saree-beige', color: 'Beige', image: 'https://via.placeholder.com/400x500/F5F5DC/000?text=Beige' },
      { slug: 'chiffon-designer-saree-wine', color: 'Wine', image: 'https://via.placeholder.com/400x500/722F37/fff?text=Wine' },
      { slug: 'chiffon-designer-saree-teal', color: 'Teal', image: 'https://via.placeholder.com/400x500/008080/fff?text=Teal' },
    ],
  },
  {
    title: 'Cotton Handloom Saree',
    slug: 'cotton-handloom-saree-ivory',
    description: 'Comfortable handloom cotton saree for everyday wear.',
    category: 'Sarees',
    price: 1299,
    sizes: ['Free'],
    colors: ['Ivory', 'Sky', 'Olive', 'Coral'],
    images: ['https://via.placeholder.com/800x1000?text=cotton-main'],
    countInStock: 30,
    variants: [
      { slug: 'cotton-handloom-saree-ivory', color: 'Ivory', image: 'https://via.placeholder.com/400x500/F8F4E3/000?text=Ivory' },
      { slug: 'cotton-handloom-saree-sky', color: 'Sky', image: 'https://via.placeholder.com/400x500/87CEEB/000?text=Sky' },
      { slug: 'cotton-handloom-saree-olive', color: 'Olive', image: 'https://via.placeholder.com/400x500/808000/fff?text=Olive' },
      { slug: 'cotton-handloom-saree-coral', color: 'Coral', image: 'https://via.placeholder.com/400x500/FF7F50/000?text=Coral' },
    ],
  },
  {
    title: 'Georgette Party Saree',
    slug: 'georgette-party-saree-navy',
    description: 'Flowy georgette saree with sequin work for parties.',
    category: 'Sarees',
    price: 2999,
    sizes: ['Free'],
    colors: ['Navy', 'Silver', 'Emerald', 'Peach'],
    images: ['https://via.placeholder.com/800x1000?text=georgette-main'],
    countInStock: 12,
    variants: [
      { slug: 'georgette-party-saree-navy', color: 'Navy', image: 'https://via.placeholder.com/400x500/000080/fff?text=Navy' },
      { slug: 'georgette-party-saree-silver', color: 'Silver', image: 'https://via.placeholder.com/400x500/C0C0C0/000?text=Silver' },
      { slug: 'georgette-party-saree-emerald', color: 'Emerald', image: 'https://via.placeholder.com/400x500/50C878/fff?text=Emerald' },
      { slug: 'georgette-party-saree-peach', color: 'Peach', image: 'https://via.placeholder.com/400x500/FFDAB9/000?text=Peach' },
    ],
  },
];

async function connect() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('MongoDB connected');
}

async function seed() {
  try {
    await connect();

    console.log('Clearing existing saree products (category=Sarees)...');
    await Product.deleteMany({ category: 'Sarees' });

    console.log('Inserting sample saree products...');
    for (const p of sareeProducts) {
      // ensure slug uniqueness in case duplicates exist already
      const exists = await Product.findOne({ slug: p.slug });
      if (exists) {
        console.log(`Skipping existing slug: ${p.slug}`);
        continue;
      }
      await Product.create(p);
      console.log(`Inserted: ${p.slug}`);
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
