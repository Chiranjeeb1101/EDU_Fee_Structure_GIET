const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

// ─── Stripe Webhook (NO auth — Stripe signs it; raw body required) ──
router.post('/webhook', paymentController.handleWebhook);

// ─── All other payment routes require authentication ────────────
router.use(authenticate);

// ─── Student: Create Stripe Checkout Session (rate-limited) ─────
router.post(
  '/create-checkout-session',
  authorize('student'),
  paymentLimiter,
  validate({ body: ['amount'] }),
  asyncHandler(paymentController.createCheckoutSession)
);

// ─── Student or Admin: View payment history ─────────────────────
router.get('/history', asyncHandler(paymentController.getPaymentHistory));

// ─── Student: Check single payment status ───────────────────────
router.get('/status/:id', asyncHandler(paymentController.getPaymentStatus));

module.exports = router;
