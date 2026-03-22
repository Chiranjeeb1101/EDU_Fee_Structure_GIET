-- ─── 1. DROP EXISTING ──────────────────────────────────────────────
-- Since this is a brand new feature and you are getting setup errors,
-- we will drop everything and start fresh to avoid any conflicts.
DROP TABLE IF EXISTS password_reset_requests CASCADE;

-- ─── 2. CREATE TABLE ─────────────────────────────────────────────
CREATE TABLE password_reset_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' 
               CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  admin_id     UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. INDEXES ──────────────────────────────────────────────────
CREATE INDEX idx_reset_requests_status ON password_reset_requests(status);
CREATE INDEX idx_reset_requests_student ON password_reset_requests(student_id);

-- ─── 4. ENABLE RLS ───────────────────────────────────────────────
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- ─── 5. CREATE POLICIES ──────────────────────────────────────────

-- Admins can read all requests in their college
CREATE POLICY "reset_requests_select_admin"
  ON password_reset_requests FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND college_id = get_current_user_college_id()
  );

-- Students can read their own requests
CREATE POLICY "reset_requests_select_student"
  ON password_reset_requests FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  );

-- Students can create requests
CREATE POLICY "reset_requests_insert_student"
  ON password_reset_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);
