-- Run this in your Supabase SQL Editor to support Push Notifications

ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Optional: Create an index if you plan to query users by token frequently
-- CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
