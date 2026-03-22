const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabase() {
  console.log('--- Supabase Health Check ---');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful. Found', data.length, 'users.');
    }

    // Try to get a user (this will fail with a dummy token, but we want to see the error TYPE)
    console.log('\n--- Auth Verification Test ---');
    const { data: authData, error: authError } = await supabase.auth.getUser('dummy_token');
    console.log('Dummy token error:', authError?.message || 'No error?');
    // For a dummy token, it should say "invalid jwt" or similar.
    // If it says "Invalid project URL" or "Missing API Key", then keys are wrong.
    
  } catch (err) {
    console.error('🔥 Unexpected error:', err.message);
  }
}

checkSupabase();
