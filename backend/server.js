// server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const contentRoutes = require('./src/routes/contentRoutes');

const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');


const app = express();

// read env as early as possible
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;

// trust proxy (useful when deploying behind nginx / cloud providers)
app.set('trust proxy', 1);

// Middlewares
// Conditional morgan require so a missing dev dependency doesn't crash production
try {
  // require only if available
  // eslint-disable-next-line global-require
  const morgan = require('morgan');
  if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }
} catch (err) {
  // If morgan isn't installed, don't fail the app. Just warn.
  console.warn('morgan not available — skipping request logging. Install with `npm i morgan` for dev logs.');
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

// Basic in-memory rate limiter (very small protection — optional)
const RATE_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_MAX = Number(process.env.RATE_MAX) || 300; // requests per IP per window
const ipCounts = new Map();
setInterval(() => ipCounts.clear(), RATE_WINDOW_MS);

app.use((req, res, next) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const entry = ipCounts.get(ip) || 0;
    if (entry > RATE_MAX) {
      res.status(429).json({ message: 'Too many requests, slow down' });
    } else {
      ipCounts.set(ip, entry + 1);
      next();
    }
  } catch (err) {
    next();
  }
});

// Serve uploaded files (if using /uploads)
const uploadsPath = path.join(__dirname, '/uploads');
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads folder:', err.message);
  }
}
app.use('/uploads', express.static(uploadsPath));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/content', contentRoutes);

// Optional payment routes: import only if file exists to avoid crashes
try {
  const paymentRoutesPath = path.join(__dirname, 'src', 'routes', 'paymentRoutes.js');
  if (fs.existsSync(paymentRoutesPath)) {
    const paymentRoutes = require('./src/routes/paymentRoutes');
    app.use('/api/payment', paymentRoutes);
  } else {
    console.info('Payment routes not found — skipping /api/payment mount');
  }
} catch (err) {
  console.warn('Payment routes load error (continuing without payments):', err.message);
}

// health check with DB connection state
app.get('/api/health', (req, res) => {
  const connectionState = mongoose.connection?.readyState;
  // mongoose.readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  res.json({
    status: 'ok',
    env: NODE_ENV,
    db: states[connectionState] || 'unknown',
  });
});

// Catch-all 404 for api
app.use('/api', notFound);

// Error handlers (last)
app.use(errorHandler);

// Start server only after DB connected
async function start() {
  try {
    await connectDB();
    const server = app.listen(PORT, () =>
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`)
    );

    // Graceful shutdown handlers
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection at:', reason);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.info('SIGTERM received — shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.info('SIGINT received — shutting down gracefully');
      server.close(() => {
        console.log('Server closed (SIGINT)');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
