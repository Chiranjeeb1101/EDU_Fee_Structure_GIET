const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findAdmin() {
  const { data, error } = await supabase.from('users').select('email').eq('role', 'admin').limit(1);
  if (error) console.error(error);
  else console.log('Admin email:', data[0]?.email);
}

findAdmin();
