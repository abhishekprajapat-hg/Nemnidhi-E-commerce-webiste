const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const contentRoutes = require('./src/routes/contentRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const recoRoutes = require('./src/routes/recoRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 5000;

const app = express();

app.set('trust proxy', 1);

function normalizeOrigin(value = '') {
  return String(value || '').trim().replace(/\/+$/, '');
}

function parseAllowedOrigins() {
  const raw = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
    process.env.ALLOWED_ORIGINS,
    process.env.APP_URL,
  ]
    .filter(Boolean)
    .join(',');

  return raw
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
}

function resolveFrontendBuildPath() {
  const explicit = process.env.FRONTEND_DIST_DIR
    ? path.resolve(__dirname, process.env.FRONTEND_DIST_DIR)
    : '';
  const candidates = [
    explicit,
    path.resolve(__dirname, '..', 'frontend', 'dist'),
    path.resolve(__dirname, 'client', 'build'),
  ].filter(Boolean);

  return candidates.find((entry) => fs.existsSync(path.join(entry, 'index.html'))) || '';
}

const allowedOrigins = parseAllowedOrigins();

try {
  const morgan = require('morgan');
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
} catch (err) {
  console.warn('morgan not installed — skipping request logging.');
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = Math.max(50, Number(process.env.RATE_MAX) || 300);
const ipCounts = new Map();
setInterval(() => ipCounts.clear(), RATE_WINDOW_MS);

app.use((req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const entry = ipCounts.get(ip) || 0;
    if (entry > RATE_MAX) {
      return res.status(429).json({ message: 'Too many requests, slow down' });
    }
    ipCounts.set(ip, entry + 1);
    next();
  } catch (err) {
    next();
  }
});

const uploadsPath = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));
} catch (err) {
  console.warn('Uploads static serve disabled:', err.message);
}

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recommend', recoRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => {
  const connectionState = mongoose.connection?.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    env: NODE_ENV,
    db: states[connectionState] || 'unknown',
    uptime: process.uptime(),
  });
});

app.use('/api', notFound);
app.use(errorHandler);

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://glam.nemnidhi.com/</loc></url>
    <url><loc>https://glam.nemnidhi.com/products</loc></url>
    <url><loc>https://glam.nemnidhi.com/categories</loc></url>
  </urlset>`);
});

async function startServer() {
  try {
    console.log('Starting server...');
    console.log('NODE_ENV=', NODE_ENV);
    console.log('PORT=', PORT);
    const mongoUri = process.env.MONGO_URI || '';
    console.log('MONGO_URI present?', !!mongoUri);
    if (mongoUri) {
      try {
        const masked = mongoUri.replace(/(mongodb(\+srv)?:\/\/)([^:@\s]+)(:[^@]+)?@?/, '$1****@');
        console.log('MONGO_URI (masked):', masked);
      } catch (e) {
        console.log('MONGO_URI (short):', mongoUri.substring(0, 40) + '...');
      }
    }

    await connectDB();

    if (NODE_ENV === 'production') {
      const frontendBuild = resolveFrontendBuildPath();
      if (frontendBuild) {
        console.log('Serving frontend from:', frontendBuild);
        app.use(express.static(frontendBuild));
        app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));
      } else {
        console.warn('No frontend build found for production static serving.');
      }
    }

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    const graceful = async (signal) => {
      try {
        console.log(`Received ${signal}. Closing server...`);
        server.close(async () => {
          try {
            await mongoose.disconnect();
            console.log('Mongo disconnected. Exiting.');
            process.exit(0);
          } catch (e) {
            console.error('Error during disconnect:', e);
            process.exit(1);
          }
        });
        setTimeout(() => {
          console.error('Forcing shutdown after timeout.');
          process.exit(1);
        }, 30_000).unref();
      } catch (e) {
        console.error('Graceful shutdown failed:', e);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => graceful('SIGINT'));
    process.on('SIGTERM', () => graceful('SIGTERM'));

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception thrown:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Fatal error when starting server:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

startServer();
