-- ============================================================
-- SMART FEE MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Multi-tenant ready | Supabase (PostgreSQL)
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COLLEGES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. USERS  (linked to Supabase Auth)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     UUID UNIQUE,                          -- FK to auth.users(id)
  college_id  UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT NOT NULL,
  profile_picture TEXT,         -- New: store base64 or URL
  personal_email  TEXT,         -- New: user's provided email
  role        TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 3. STUDENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_id         UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  college_id_number  TEXT NOT NULL,                  -- e.g. "GIET2024001"
  registration_number TEXT,                          -- e.g. "2024CSE001"
  course_type        TEXT,                           -- e.g. "B.Tech", "M.Tech"
  stream             TEXT,                           -- e.g. "CSE", "ECE"
  year               INTEGER,                       -- 1–4
  accommodation      TEXT CHECK (accommodation IN ('hosteler', 'day_scholar')),
  total_fee          NUMERIC(12,2) DEFAULT 0,
  paid_fee           NUMERIC(12,2) DEFAULT 0,
  remaining_fee      NUMERIC(12,2) DEFAULT 0,
  student_phone      TEXT,                           -- New field
  parent_name        TEXT,                           -- New field
  parent_whatsapp    TEXT,                           -- New field
  profile_complete   BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now(),

  -- Same ID number can exist across different colleges
  UNIQUE (college_id, college_id_number)
);

-- ────────────────────────────────────────────────────────────
-- 4. FEE STRUCTURES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,                    -- Added: e.g. "Tution Fee"
  course_type     TEXT NOT NULL,
  stream          TEXT NOT NULL,
  year            INTEGER NOT NULL,
  accommodation   TEXT NOT NULL CHECK (accommodation IN ('hosteler', 'day_scholar', 'both')), -- Added 'both' for generic fees
  total_fee       NUMERIC(12,2) NOT NULL,
  academic_year   TEXT NOT NULL,                    -- e.g. "2025-26"
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate fee rules (now includes title)
  UNIQUE (college_id, course_type, stream, year, accommodation, academic_year, title)
);

-- ────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  type            TEXT DEFAULT 'info',              -- info, warning, success
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. PAYMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id                   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  amount                       NUMERIC(12,2) NOT NULL,
  stripe_checkout_session_id   TEXT,
  stripe_payment_intent_id     TEXT,
  status                       TEXT NOT NULL DEFAULT 'created'
                               CHECK (status IN ('created', 'paid', 'failed')),
  created_at                   TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. INDEXES  (performance)
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_auth_id        ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_college_id     ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_students_college_id  ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id     ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_lookup
  ON fee_structures(college_id, course_type, stream, year, accommodation, academic_year, title);
CREATE INDEX IF NOT EXISTS idx_payments_student_id  ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_college_id  ON payments(college_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session  ON payments(stripe_checkout_session_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ── Enable RLS on all tables ────────────────────────────────
ALTER TABLE colleges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- ── Helper: get the current user's row from the users table ─
-- (used inside policies to check role & college_id)
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_user_college_id()
RETURNS UUID AS $$
  SELECT college_id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── COLLEGES policies ───────────────────────────────────────
CREATE POLICY "colleges_select_authenticated"
  ON colleges FOR SELECT
  TO authenticated
  USING (true);

-- ── USERS policies ──────────────────────────────────────────
-- Users can read their own record
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Admins can read all users in their college
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- ── STUDENTS policies ──────────────────────────────────────
-- Students can read their own record
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Admins can read all students in their college
CREATE POLICY "students_select_admin"
  ON students FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Admins can insert students in their college
CREATE POLICY "students_insert_admin"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Admins can update students in their college
CREATE POLICY "students_update_admin"
  ON students FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Students can update their own profile (first-time setup)
CREATE POLICY "students_update_own"
  ON students FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ── FEE_STRUCTURES policies ────────────────────────────────
-- Anyone authenticated can read fee structures
CREATE POLICY "fee_structures_select_authenticated"
  ON fee_structures FOR SELECT
  TO authenticated
  USING (true);

-- Admins can insert fee structures for their college
CREATE POLICY "fee_structures_insert_admin"
  ON fee_structures FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Admins can update fee structures in their college
CREATE POLICY "fee_structures_update_admin"
  ON fee_structures FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Admins can delete fee structures in their college
CREATE POLICY "fee_structures_delete_admin"
  ON fee_structures FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- ── NOTIFICATIONS policies ────────────────────────────────
-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Users can update their own notifications (to mark as read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Admins can create notifications for any user in their college
CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
    AND (SELECT college_id FROM users WHERE id = user_id) = get_current_user_college_id()
  );

-- ── PAYMENTS policies ──────────────────────────────────────
-- Students can read their own payments
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  TO authenticated
  USING (
    student_id = (
      SELECT s.id FROM students s
      JOIN users u ON u.id = s.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Admins can read all payments in their college
CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- ============================================================
-- 8. SEED DATA  — Insert GIET as the default college
-- ============================================================
INSERT INTO colleges (name, code, address)
VALUES ('GIET University', 'GIET', 'Gunupur, Odisha, India')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- DONE! Copy the UUID printed below and set it as
-- DEFAULT_COLLEGE_ID in your Backend/.env file.
-- ============================================================
SELECT id AS "GIET_COLLEGE_ID", name, code FROM colleges WHERE code = 'GIET';
