require('dotenv').config();
const adminService = require('./services/admin.service');

async function testUpdate() {
  try {
    // We need a real student ID. I'll fetch one first.
    const supabase = require('./config/supabase');
    const { data: student } = await supabase.from('students').select('id, college_id').limit(1).single();
    
    if (!student) {
      console.log('No student found to test with.');
      return;
    }

    console.log(`Testing update for student ${student.id}...`);
    
    const updates = {
      full_name: 'Fee Update Test',
      total_fee: 160000,
      remaining_fee: 160000
    };

    const result = await adminService.updateStudent(student.college_id, student.id, updates);
    console.log('Update Successful:', result);
  } catch (err) {
    console.error('Update Failed:', err);
  }
}

testUpdate();
