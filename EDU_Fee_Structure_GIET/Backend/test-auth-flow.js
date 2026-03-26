/**
 * test-auth-flow.js
 * End-to-end automated test for Phase 3 Auth Flow
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const API_URL = 'http://localhost:5000/api';
const TEST_STUDENT = {
  full_name: 'Test Student',
  college_id_number: `TST${Date.now()}`,
  password: 'Password123!',
};

async function insertTestFeeStructure() {
  console.log('📝 Inserting mock fee structure for testing...');
  const { data, error } = await supabase
    .from('fee_structures')
    .insert([{
      college_id: process.env.DEFAULT_COLLEGE_ID,
      course_type: 'B.Tech',
      stream: 'CSE',
      year: 1,
      accommodation: 'hosteler',
      total_fee: 150000,
      academic_year: '2025-26'
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return; // Already exists, that's fine
    console.error('❌ Failed to insert fee structure:', error.message);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Starting Auth Flow E2E Tests...\n');

  await insertTestFeeStructure();

  try {
    // 1. Register test student
    console.log(`1️⃣  Registering student: ${TEST_STUDENT.college_id_number}...`);
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_STUDENT),
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.message || 'Registration failed');
    console.log('   ✅ Registration successful');

    // 2. Login
    console.log(`\n2️⃣  Logging in...`);
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        college_id_number: TEST_STUDENT.college_id_number,
        password: TEST_STUDENT.password,
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
    console.log('   ✅ Login successful');
    const token = loginData.data.token;
    console.log(`   🔑 Received JWT token`);

    // 3. Complete Profile
    console.log(`\n3️⃣  Completing first-time profile setup...`);
    const profileRes = await fetch(`${API_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        course_type: 'B.Tech',
        stream: 'CSE',
        year: 1,
        accommodation: 'hosteler',
        academic_year: '2025-26',
      }),
    });
    const profileData = await profileRes.json();
    if (!profileRes.ok) throw new Error(profileData.message || 'Profile completion failed');
    console.log('   ✅ Profile setup successful');
    
    const feeAssigned = profileData.data.total_fee;
    console.log(`   💰 Fee dynamically assigned based on profile: ₹${feeAssigned}`);
    if (feeAssigned !== 150000) throw new Error('Fee calculation mismatch!');

    // 4. Get Profile
    console.log(`\n4️⃣  Fetching full profile...`);
    const getProfileRes = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const getProfileData = await getProfileRes.json();
    if (!getProfileRes.ok) throw new Error(getProfileData.message || 'Get profile failed');
    console.log('   ✅ Full profile fetched');
    console.log(`      Role: ${getProfileData.data.role}`);
    console.log(`      Profile Complete: ${getProfileData.data.students[0].profile_complete}`);

    console.log(`\n🎉 All tests passed successfully!`);

  } catch (err) {
    console.error(`\n❌ Test failed: ${err.message}`);
  }
}

runTests();
