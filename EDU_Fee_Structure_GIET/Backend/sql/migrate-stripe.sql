-- ============================================================
-- STRIPE MIGRATION — Run this in Supabase SQL Editor
-- Replaces Razorpay columns with Stripe columns
-- ============================================================

-- Drop old Razorpay columns
ALTER TABLE payments DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE payments DROP COLUMN IF EXISTS razorpay_payment_id;
ALTER TABLE payments DROP COLUMN IF EXISTS razorpay_signature;

-- Add Stripe columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Drop old index, create new one
DROP INDEX IF EXISTS idx_payments_order_id;
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
