-- 1. Drop the old accommodation check constraint
ALTER TABLE fee_structures 
DROP CONSTRAINT IF EXISTS fee_structures_accommodation_check;

-- 2. Add the updated constraint including 'both'
ALTER TABLE fee_structures 
ADD CONSTRAINT fee_structures_accommodation_check 
CHECK (accommodation IN ('hosteler', 'day_scholar', 'both'));

-- 3. Just to be safe, reload PostgREST cache
NOTIFY pgrst, 'reload schema';
