// backend/src/data/createAdmin.js
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function run() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const name = process.env.ADMIN_NAME || 'Admin';

  let user = await User.findOne({ email });
  if (user) {
    console.log('User exists:', email);
    if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
      console.log('Promoted to admin.');
    } else {
      console.log('User already admin.');
    }
  } else {
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({ name, email, password: hashed, isAdmin: true });
    console.log('Admin user created:', email);
  }

  if (!process.env.JWT_SECRET) {
    console.error('Set JWT_SECRET in .env before running.');
    process.exit(1);
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  console.log('\n=== ADMIN CREDENTIALS ===');
  console.log('email:', email);
  console.log('password:', process.env.ADMIN_PASSWORD || password);
  console.log('token:', token);
  console.log('Use header: Authorization: Bearer <token>');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
