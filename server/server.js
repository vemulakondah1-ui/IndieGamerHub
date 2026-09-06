process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const reviewRoutes = require('./routes/reviews');
const forumRoutes = require('./routes/forums');
const adminRoutes = require('./routes/admin');
const steamRoutes = require('./routes/steam');

const app = express();

// Connect to MongoDB
connectDB();

// Security & Logging Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(pinoHttp({ logger }));

// CORS & Body Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/games/:gameId/reviews', reviewRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/steam', steamRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'IndieGamer Hub API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDuplicateKeyError = err.code === 11000;

  if (isDuplicateKeyError) {
    const field = Object.keys(err.keyPattern)[0];
    logger.error({ err, field }, `Duplicate key error on field: ${field}`);
    return res.status(400).json({
      success: false,
      message: `A user with this ${field} already exists`,
    });
  }

  logger.error({ err, statusCode }, `Error: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
