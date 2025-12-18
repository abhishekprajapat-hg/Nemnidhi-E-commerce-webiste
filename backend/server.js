require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 5000;

const app = express();

app.set('trust proxy', 1);

try {
  const morgan = require('morgan');
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));
} catch (err) {
  console.warn('morgan not installed — skipping request logging.');
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
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


try {
  const paymentRoutesPath = path.join(__dirname, 'src', 'routes', 'paymentRoutes.js');
  if (fs.existsSync(paymentRoutesPath)) {
    const paymentRoutes = require('./src/routes/paymentRoutes');
    app.use('/api/payment', paymentRoutes);
  } else {
    console.info('/api/payment not mounted (no file found)');
  }
} catch (err) {
  console.warn('Error loading payment routes, continuing without payments:', err.message);
}

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
      const clientBuild = path.join(__dirname, 'client', 'build');
      if (fs.existsSync(clientBuild)) {
        app.use(express.static(clientBuild));
        app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
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
