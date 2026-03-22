-- ==========================================
-- Phase 15: Documents & Calendar Schema
-- ==========================================

-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format TEXT NOT NULL,
  size TEXT NOT NULL,
  file_url TEXT NOT NULL,
  icon TEXT DEFAULT 'description',
  is_verified BOOLEAN DEFAULT false,
  upload_date TIMESTAMPTZ DEFAULT NOW()
);

-- Note: You also need to create a Storage Bucket named 'attachments'
-- You can do this in the Supabase Dashboard -> Storage -> New Bucket

-- 2. Create Calendar Events Table (Optional, for admin-driven events)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  amount DECIMAL(10,2),
  type TEXT DEFAULT 'info',
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE
);
