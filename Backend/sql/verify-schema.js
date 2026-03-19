/**
 * verify-schema.js
 * Quick script to confirm all tables exist and retrieve the GIET college UUID.
 *
 * Usage:  node sql/verify-schema.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TABLES = ['colleges', 'users', 'students', 'fee_structures', 'payments'];

async function verify() {
  console.log('🔍 Verifying database schema...\n');

  let allGood = true;

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`  ❌ ${table} — ${error.message}`);
      allGood = false;
    } else {
      console.log(`  ✅ ${table} — exists`);
    }
  }

  console.log('');

  // Retrieve GIET college
  const { data: giet, error: gietError } = await supabase
    .from('colleges')
    .select('id, name, code')
    .eq('code', 'GIET')
    .single();

  if (gietError) {
    console.log('❌ Could not find GIET college:', gietError.message);
    allGood = false;
  } else {
    console.log('🏫 GIET College found:');
    console.log(`   ID   : ${giet.id}`);
    console.log(`   Name : ${giet.name}`);
    console.log(`   Code : ${giet.code}`);
    console.log('');
    console.log(`📋 Copy this UUID and set it in .env:`);
    console.log(`   DEFAULT_COLLEGE_ID=${giet.id}`);
  }

  console.log('');
  console.log(allGood ? '✅ All tables verified!' : '⚠️  Some checks failed — see above.');
}

verify().catch(console.error);
