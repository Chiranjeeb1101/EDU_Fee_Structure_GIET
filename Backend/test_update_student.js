require('dotenv').config();
const adminService = require('./services/admin.service');

async function testUpdate() {
  const adminCollegeId = process.env.DEFAULT_COLLEGE_ID;
  const studentId = '77dae814-1647-4951-8418-8aba3049e9ce'; // Sonu's ID from previous logs

  console.log('--- Testing Updated Student Service ---');
  
  try {
    const updates = {
      full_name: 'Sonu Kumar Updated',
      personal_email: 'sonu.updated@example.com',
      course_type: 'B.Tech',
      stream: 'CSE',
      year: 1,
      accommodation: 'hosteler',
      remaining_fee: 140000
    };

    console.log('Sending updates...', updates);
    const result = await adminService.updateStudent(adminCollegeId, studentId, updates);
    console.log('Update result:', result);
    
    // Verify double check
    const student = await adminService.getStudentById(adminCollegeId, studentId);
    console.log('Verification check (Student):', student.users.full_name, student.users.personal_email, student.accommodation);
    
    if (student.users.full_name === 'Sonu Kumar Updated' && student.accommodation === 'hosteler') {
      console.log('SUCCESS: Student and User tables both updated correctly!');
    } else {
      console.log('FAILURE: Update mismatch.');
    }

  } catch (error) {
    console.error('Update failed:', error.message);
  }
}

testUpdate();
