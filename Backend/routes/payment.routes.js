const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

// ─── Stripe Webhook (NO auth — Stripe signs it; raw body required) ──
router.post('/webhook', paymentController.handleWebhook);

// ─── Stripe Redirect Pages (NO auth — browser redirect from Stripe) ──
router.get('/success', paymentController.handleSuccessRedirect);

router.get('/cancel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Cancelled</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #090e1c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { text-align: center; padding: 40px; max-width: 400px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #ff716c; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .hint { margin-top: 24px; color: #64748b; font-size: 12px; background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">❌</div>
        <h1>Payment Cancelled</h1>
        <p>No worries — your payment was not processed. No amount has been charged.</p>
        <div class="hint">Close this tab and return to the EDU-Fee app to try again.</div>
      </div>
    </body>
    </html>
  `);
});

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

// ─── Student: Download PDF receipt ──────────────────────────────
router.get('/:id/receipt', asyncHandler(paymentController.getReceipt));

module.exports = router;
