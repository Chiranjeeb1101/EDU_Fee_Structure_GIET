// ─── Load environment variables ─────────────────────────────────────
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ─── Import route aggregator ───────────────────────────────────────
const routes = require('./routes');

// ─── Initialise Express ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Mount routes ──────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global error handler ──────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err.stack || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check → http://localhost:${PORT}/api/health`);
});
