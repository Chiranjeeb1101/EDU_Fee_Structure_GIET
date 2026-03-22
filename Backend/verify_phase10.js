const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const adminService = require('./services/admin.service');
const authService = require('./services/auth.service');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runVerification() {
  const studentCollegeIdNum = '2401326348';
  
  console.log('--- 1. Verification: Fee Sync ---');
  // Get student from DB
  const { data: student } = await supabase
    .from('students')
    .select('id, college_id, total_fee, remaining_fee, paid_fee')
    .eq('college_id_number', studentCollegeIdNum)
    .single();

  if (!student) {
    console.error('Student not found for verification.');
    return;
  }

  console.log('Initial fees:', { total: student.total_fee, remaining: student.remaining_fee, paid: student.paid_fee });

  // Update remaining fee to 150000
  console.log('Update: Setting remaining_fee to 150000...');
  await adminService.updateStudent(student.college_id, student.id, { remaining_fee: 150000 });
  
  const { data: updatedStudent } = await supabase
    .from('students')
    .select('total_fee, remaining_fee, paid_fee')
    .eq('id', student.id)
    .single();

  console.log('Updated fees (sync test):', updatedStudent);
  if (parseFloat(updatedStudent.total_fee) === (parseFloat(updatedStudent.paid_fee) + 150000)) {
    console.log('✅ Fee Sync Success!');
  } else {
    console.log('❌ Fee Sync Failed!');
  }

  console.log('\n--- 2. Verification: Profile Completion ---');
  // Check profile_complete status
  const { data: profileCheck } = await supabase
    .from('students')
    .select('user_id, profile_complete')
    .eq('id', student.id)
    .single();

  console.log('Initial profile_complete:', profileCheck.profile_complete);

  // Fill profile fields
  console.log('Update: Filling mandatory profile fields...');
  await authService.updateProfile(profileCheck.user_id, {
    registration_number: '2024REGTEST001',
    student_phone: '9876543210',
    parent_name: 'Verification Parent',
    parent_whatsapp: '9876543210'
  });

  const { data: finalStudent } = await supabase
    .from('students')
    .select('profile_complete, registration_number')
    .eq('id', student.id)
    .single();

  console.log('Final profile_complete:', finalStudent.profile_complete);
  console.log('Final registration_number:', finalStudent.registration_number);

  if (finalStudent.profile_complete === true) {
    console.log('✅ Profile Completion Success!');
  } else {
    console.log('❌ Profile Completion Failed!');
  }
}

runVerification();
