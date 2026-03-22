const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStudentAuth() {
  const collegeIdNum = '2401326348';
  
  // 1. Find user in the `users` table
  const { data: dbUser } = await supabase
    .from('students')
    .select('user_id')
    .eq('college_id_number', collegeIdNum)
    .single();

  if (!dbUser) {
    console.log('Student not found in DB.');
    return;
  }

  const { data: user } = await supabase
    .from('users')
    .select('auth_id, email')
    .eq('id', dbUser.user_id)
    .single();

  console.log('User Auth ID:', user.auth_id);
  console.log('User Email:', user.email);

  // 2. Check Supabase Auth
  const { data: authUser, error } = await supabase.auth.admin.getUserById(user.auth_id);
  
  if (error) {
    console.error('❌ Supabase Auth error:', error.message);
  } else {
    console.log('✅ Supabase Auth user found.');
    console.log('Email confirmed at:', authUser.user.email_confirmed_at);
    console.log('Last sign in:', authUser.user.last_sign_in_at);
  }
}

checkStudentAuth();
