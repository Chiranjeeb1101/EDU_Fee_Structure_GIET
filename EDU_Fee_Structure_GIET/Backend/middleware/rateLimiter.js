const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});

/**
 * Strict limiter for auth endpoints (login/register) — 10 per 15 mins per IP.
 * Prevents brute-force attacks on passwords.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many login/register attempts. Please try again after 15 minutes.',
  },
});

/**
 * Payment limiter — 5 per 15 mins per IP.
 * Prevents abuse of checkout session creation.
 */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.',
  },
});

module.exports = { generalLimiter, authLimiter, paymentLimiter };
