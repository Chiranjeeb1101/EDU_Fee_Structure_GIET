require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectAdmins() {
  console.log('--- Inspecting Admins ---');
  const { data: admins, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching admins:', error);
  } else {
    console.log('Admins count:', admins.length);
    console.log(JSON.stringify(admins, null, 2));
  }
}

inspectAdmins();
