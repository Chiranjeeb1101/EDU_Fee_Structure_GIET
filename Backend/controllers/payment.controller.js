const paymentService = require('../services/payment.service');

/**
 * Create a Stripe Checkout Session (student-facing)
 */
exports.createCheckoutSession = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: 'A valid "amount" is required.',
    });
  }

  const session = await paymentService.createCheckoutSession(userId, parseFloat(amount));

  res.status(201).json({
    success: true,
    message: 'Stripe Checkout session created.',
    data: session,
  });
};

/**
 * Stripe Webhook Handler
 * ⚠️ This route receives RAW body (not JSON-parsed) for signature verification.
 * It is mounted BEFORE express.json() in server.js.
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature.' });
  }

  try {
    const result = await paymentService.handleWebhookEvent(req.body, signature);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

/**
 * Get payment history for the authenticated student
 */
exports.getPaymentHistory = async (req, res) => {
  const userId = req.user.id;
  const payments = await paymentService.getPaymentHistory(userId);

  res.status(200).json({
    success: true,
    data: payments,
  });
};

/**
 * Get status of a single payment
 */
exports.getPaymentStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const payment = await paymentService.getPaymentStatus(id, userId);

  res.status(200).json({
    success: true,
    data: payment,
  });
};
