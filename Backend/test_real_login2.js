require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const college_id_number = '2401326340';
  const targetCollegeId = process.env.DEFAULT_COLLEGE_ID;
  console.log("DEFAULT_COLLEGE_ID is:", targetCollegeId);
  
  console.log("1. Finding student...");
  const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id, profile_complete, personal_email, student_phone, stream, course_type, accommodation, year, registration_number')
      .eq('college_id_number', college_id_number)
      .eq('college_id', targetCollegeId)
      .single();

  if (studentError || !student) {
      console.error("Student Not Found!", studentError);
      return;
  }
  
  console.log("2. Finding user record...");
  const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name, profile_picture, personal_email')
      .eq('id', student.user_id)
      .single();

  if (userError || !dbUser) {
      console.error("User Not Found!", userError);
      return;
  }
  
  console.log("3. Logging into Supabase Auth...");
  const tempClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
      email: dbUser.email,
      password: 'TestPassword123!',
  });
  
  if (authError) {
      console.error("Auth Failed!", authError.message);
  } else {
      console.log("Auth Succeeded!");
  }
}

test();
