require('dotenv').config();
require('./utils/tlsGate').applyTlsGate();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const reviewRoutes = require('./routes/reviews');
const forumRoutes = require('./routes/forums');
const adminRoutes = require('./routes/admin');
const steamRoutes = require('./routes/steam');

const app = express();

// nginx (client/nginx.conf) sits exactly one hop in front of this server and forwards X-Forwarded-For; without this, express-rate-limit throws on every request instead of reading the real client IP.
app.set('trust proxy', 1);

connectDB();

// styleSrc allows 'unsafe-inline' because the client renders via inline style={{}} objects throughout, not a CSS-in-JS nonce setup; scriptSrc stays locked to 'self' since nothing here needs inline scripts. googleapis/gstatic are the Google Fonts CDN the client actually loads; connectSrc is 'self' only since every external API call (Steam/RAWG/Cloudinary) is proxied server-side, the browser never calls them directly.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

app.use(pinoHttp({ logger }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting: generous default for reads, tight on auth to blunt brute-force login attempts. auth is skipped here to avoid double-limiting, and health is skipped so Docker's healthcheck traffic doesn't eat into real users' quota.
// `|| default` would silently ignore an explicit RATE_LIMIT_MAX_REQUESTS=0 (a legitimate incident lockdown); this only falls back when the var is genuinely unset.
// A typo'd value (e.g. "abc") would parse to NaN, and express-rate-limit's `totalHits > NaN` is always false — that silently disables the limiter, so NaN falls back to `fallback` too, with a loud warning instead of a silent misconfiguration.
const envInt = (name, fallback) => {
  if (process.env[name] === undefined) return fallback;
  const parsed = Number(process.env[name]);
  if (Number.isNaN(parsed)) {
    logger.warn(`${name}="${process.env[name]}" is not a number, falling back to ${fallback}`);
    return fallback;
  }
  return parsed;
};
const RATE_LIMIT_WINDOW_MS = envInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
app.use('/api', rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: envInt('RATE_LIMIT_MAX_REQUESTS', 100),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/auth') || req.path === '/health' || req.path.startsWith('/steam'),
}));
app.use('/api/auth', rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
}));
// Steam proxy routes are public, read-only, and already cached server-side
// (steam.js's own in-memory TTL cache) — cheap to serve, but naturally
// chattier than typical API traffic since a single game page fires 2+
// requests. Sharing the general 100/15min budget meant a normal browsing
// session (~50 game pages) could exhaust it and start silently failing.
app.use('/api/steam', rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: envInt('STEAM_RATE_LIMIT_MAX_REQUESTS', 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many Steam requests, please try again shortly' },
}));

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/games/:gameId/reviews', reviewRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/steam', steamRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'IndieGamer Hub API is running' });
});

// Named (not inline) so tests can call it directly with fake req/res, without needing a real Mongo-backed route to throw the errors we want to cover.
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDuplicateKeyError = err.code === 11000 && err.keyPattern;

  if (isDuplicateKeyError) {
    const field = Object.keys(err.keyPattern)[0];
    logger.error({ err, field }, `Duplicate key error on field: ${field}`);
    return res.status(400).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  logger.error({ err, statusCode }, `Error: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Exported (rather than only side-effecting) so tests can hit the app over real HTTP and close the listener afterwards without leaving it open.
module.exports = { app, errorHandler, server };
