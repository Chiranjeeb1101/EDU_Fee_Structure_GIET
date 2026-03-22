-- Step 1: Add 'title' column if it doesn't exist
ALTER TABLE fee_structures 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Step 2: Assign a default value to existing rows (important!)
UPDATE fee_structures SET title = 'Tuition Fee' WHERE title IS NULL;

-- Step 3: Make it NOT NULL
ALTER TABLE fee_structures ALTER COLUMN title SET NOT NULL;

-- Step 4: Drop old unique constraint
-- (Checks for multiple common default name formats)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_college_id_course_type_stream_year_ac_key') THEN
        ALTER TABLE fee_structures DROP CONSTRAINT fee_structures_college_id_course_type_stream_year_ac_key;
    END IF;
    
    -- In case it was created with a shorter name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_structures_college_id_course_type_stream_year_key') THEN
        ALTER TABLE fee_structures DROP CONSTRAINT fee_structures_college_id_course_type_stream_year_key;
    END IF;
END $$;

-- Step 5: Add new expanded unique constraint
ALTER TABLE fee_structures 
ADD CONSTRAINT fee_structures_full_unique 
UNIQUE (college_id, course_type, stream, year, accommodation, academic_year, title);

-- Step 6: Fix the index
DROP INDEX IF EXISTS idx_fee_structures_lookup;
CREATE INDEX idx_fee_structures_lookup 
ON fee_structures(college_id, course_type, stream, year, accommodation, academic_year, title);

-- Step 7: Reload cache
NOTIFY pgrst, 'reload schema';
