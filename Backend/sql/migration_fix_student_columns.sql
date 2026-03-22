-- 1. Add missing columns to the students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS student_phone TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_whatsapp TEXT;

-- 2. Ensure numeric fields have correct defaults if missing
DO $$
BEGIN
    ALTER TABLE students ALTER COLUMN total_fee SET DEFAULT 0;
    ALTER TABLE students ALTER COLUMN paid_fee SET DEFAULT 0;
    ALTER TABLE students ALTER COLUMN remaining_fee SET DEFAULT 0;
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if already set
END $$;

-- 3. Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
