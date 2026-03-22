require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error } = await supabase
      .from('students')
      .select('user_id, profile_complete, personal_email, student_phone, stream, course_type, accommodation, year, registration_number')
      .limit(1);

  console.log(error ? error.message : "Success!");
}

test();
