const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const { data: student, error } = await supabase
    .from('students')
    .select('college_id_number, total_fee, paid_fee, remaining_fee, profile_complete, registration_number')
    .eq('college_id_number', '2401326348')
    .single();

  if (error) {
    console.error('Error fetching student:', error.message);
    return;
  }

  console.log('Result for 2401326348:');
  console.log(JSON.stringify(student, null, 2));
}

inspect();
