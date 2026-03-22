require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('password_reset_requests').select('id, status, created_at, student_id, college_id').order('created_at', { ascending: false });
  fs.writeFileSync('requests_dump.json', JSON.stringify(data, null, 2));
}
test();
