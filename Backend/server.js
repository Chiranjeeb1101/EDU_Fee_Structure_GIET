// ─── Load environment variables ─────────────────────────────────────
require('dotenv').config({ override: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// ─── Import route aggregator ───────────────────────────────────────
const routes = require('./routes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sanitize } = require('./middleware/validate');

// ─── Initialise Express ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security middleware ───────────────────────────────────────────
app.use(helmet());                   // Secure HTTP headers
app.use(cors());                     // Cross-Origin Resource Sharing
app.use(generalLimiter);             // 100 req / 15 min per IP

// ─── Stripe webhook needs RAW body — mount BEFORE express.json() ───
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' })
);

// ─── Body parsing for all other routes ─────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);                   // Strip XSS from string inputs

// ─── Mount routes ──────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const fs = require('fs');
const path = require('path');
const logStream = fs.createWriteStream(path.join(__dirname, 'api-debug.log'), { flags: 'a' });

// ─── Global error handler ──────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const logMsg = `[ERROR] ${new Date().toISOString()} | ${req.method} ${req.url} | ${err.stack || err}\n`;
  console.error('🔥 Unhandled error:', err.stack || err);
  logStream.write(logMsg);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function (data) {
    if (req.url.includes('/auth/update-profile')) {
      const logBody = typeof data === 'string' ? data : JSON.stringify(data);
      logStream.write(`[RES] ${new Date().toISOString()} | ${req.method} ${req.url} | STATUS: ${res.statusCode} | BODY: ${logBody.substring(0, 200)}\n`);
    }
    oldSend.apply(res, arguments);
  };
  next();
});

// ─── Start server ──────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (all interfaces)`);
  console.log(`📡 Health check → http://localhost:${PORT}/api/health`);
});
