const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env'
  );
  process.exit(1);
}

/**
 * Supabase Admin Client
 * Uses the service-role key so it bypasses RLS.
 * Only use in trusted server-side code.
 */
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;
