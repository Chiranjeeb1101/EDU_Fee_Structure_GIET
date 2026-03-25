/**
 * test-student-flow.js
 * Automated test for Phase 5 Student Dashboard
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const API_URL = 'http://localhost:5000/api';
const STUDENT_REQ = {
  full_name: 'Dashboard Tester',
  college_id_number: `STU${Date.now()}`,
  password: 'Password123!',
};

let studentToken;

async function runTests() {
  console.log('🧪 Starting Student Dashboard Test...\n');

  try {
    // 1. Register student
    console.log(`1️⃣  Registering student ${STUDENT_REQ.college_id_number}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(STUDENT_REQ),
    });
    if (!regRes.ok) throw new Error('Registration failed');

    // 2. Login
    console.log(`\n2️⃣  Logging in...`);
    const logRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id_number: STUDENT_REQ.college_id_number,
        password: STUDENT_REQ.password,
      }),
    });
    const logData = await logRes.json();
    if (!logRes.ok) throw new Error('Login failed');
    studentToken = logData.data.token;
    console.log('   ✅ Received JWT');

    // 3. Complete profile to get a fee assigned
    console.log(`\n3️⃣  Completing profile...`);
    const profRes = await fetch(`${API_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        course_type: 'B.Tech',
        stream: 'CSE',
        year: 1,
        accommodation: 'hosteler',
        academic_year: '2025-26',
      })
    });
    const profData = await profRes.json();
    if (!profRes.ok) throw new Error('Profile completion failed');
    console.log(`   ✅ Profile complete. Assigned Total Fee: ₹${profData.data.total_fee}`);

    // 4. Fetch dashboard
    console.log(`\n4️⃣  Fetching Student Dashboard...`);
    const dashRes = await fetch(`${API_URL}/students/dashboard`, {
       headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const dashData = await dashRes.json();
    if (!dashRes.ok) throw new Error('Dashboard fetch failed: ' + dashData.message);
    
    console.log('   ✅ Fetched Dashboard Data:');
    console.log(`      Total Fee: ₹${dashData.data.fee_status.total_fee}`);
    console.log(`      Paid Fee:  ₹${dashData.data.fee_status.paid_fee}`);
    console.log(`      Remaining: ₹${dashData.data.fee_status.remaining_fee}`);
    console.log(`      Payments:  ${dashData.data.payment_history.length} records`);
    
    console.log(`\n🎉 Student Dashboard test passed!`);

  } catch (err) {
    console.error(`\n❌ Test failed: ${err.message}`);
  }
}

runTests();
