require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data } = await supabase.from('students').select('college_id_number, college_id').eq('college_id_number', '2401326340');
  console.log("Student Record:", data);
  console.log("DEFAULT_COLLEGE_ID:", process.env.DEFAULT_COLLEGE_ID);
}
test();
