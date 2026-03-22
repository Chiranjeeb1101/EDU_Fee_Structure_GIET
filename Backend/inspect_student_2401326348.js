require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectStudent() {
  const { data, error } = await supabase
    .from('students')
    .select('*, users(*)')
    .eq('college_id_number', '2401326348')
    .single();

  if (error) {
    console.error('Error fetching student:', error.message);
    return;
  }

  console.log('--- Student Data (2401326348) ---');
  console.log('ID:', data.id);
  console.log('Full Name:', data.users.full_name);
  console.log('Total Fee:', data.total_fee);
  console.log('Paid Fee:', data.paid_fee);
  console.log('Remaining Fee:', data.remaining_fee);
  console.log('Profile Complete:', data.profile_complete);
  console.log('Student Phone:', data.student_phone);
  console.log('Parent Name:', data.parent_name);
  console.log('Parent WhatsApp:', data.parent_whatsapp);
  console.log('Registration Number:', data.registration_number);
  console.log('Personal Email:', data.users.personal_email);
}

inspectStudent();
