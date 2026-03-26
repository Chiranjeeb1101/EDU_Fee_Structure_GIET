const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey || stripeSecretKey.startsWith('your_')) {
  console.warn(
    '⚠️  STRIPE_SECRET_KEY not set in .env — payment features will fail until configured.'
  );
}

const stripe = new Stripe(stripeSecretKey);

module.exports = stripe;
