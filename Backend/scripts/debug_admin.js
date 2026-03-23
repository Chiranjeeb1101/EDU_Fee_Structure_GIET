require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const adminCollegeId = process.env.DEFAULT_COLLEGE_ID;

async function debug() {
  console.log('--- Debugging getStudents ---');
  console.log('College ID:', adminCollegeId);
  
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select(`
      *,
      users ( full_name, email, personal_email )
    `)
    .eq('college_id', adminCollegeId)
    .order('created_at', { ascending: false });

  if (studentError) {
    console.error('getStudents Error:', studentError);
  } else {
    console.log('getStudents Success. Count:', students.length);
    if (students.length > 0) {
      console.log('First student sample:', JSON.stringify(students[0], null, 2));
    }
  }

  console.log('\n--- Debugging getAdminStats queries ---');
  
  const { count: totalStudents, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('college_id', adminCollegeId);
    
  if (countError) console.error('Count students error:', countError);
  else console.log('Total students count:', totalStudents);

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('amount, status, created_at, students(stream)')
    .eq('college_id', adminCollegeId);

  if (paymentsError) {
    console.error('Payments fetch error:', paymentsError);
  } else {
    console.log('Payments fetch success. Count:', payments?.length);
  }
  
  const { count: pendingResetsCount, error: resetError } = await supabase
    .from('password_reset_requests')
    .select('*', { count: 'exact', head: true })
    .eq('college_id', adminCollegeId)
    .eq('status', 'pending');
    
  if (resetError) console.error('Pending resets count error:', resetError);
  else console.log('Pending resets count:', pendingResetsCount);
}

debug();
