/**
 * test-admin-flow.js
 * End-to-end automated test for Phase 4 Admin System + RBAC
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const authService = require('./services/auth.service'); // for creating a test student

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const API_URL = 'http://localhost:5000/api';
const ADMIN_REQ = {
  full_name: 'Test Administrator',
  email: `admin-${Date.now()}@giet.edu`,
  password: 'AdminPassword123!',
};
const STUDENT_REQ = {
  full_name: 'Regular Student',
  college_id_number: `STU${Date.now()}`,
  password: 'StudentPassword123!',
};

let adminToken;
let studentToken;

async function seedAdmin() {
  console.log('1️⃣  Seeding initial Admin user...');
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: ADMIN_REQ.email,
    password: ADMIN_REQ.password,
    email_confirm: true,
  });
  if (authErr) throw authErr;

  const { error: dbErr } = await supabase.from('users').insert([{
    auth_id: authData.user.id,
    college_id: process.env.DEFAULT_COLLEGE_ID,
    email: ADMIN_REQ.email,
    full_name: ADMIN_REQ.full_name,
    role: 'admin',
  }]);
  if (dbErr) throw dbErr;
  console.log('   ✅ Admin user seeded successfully');
}

async function loginAdmin() {
  console.log('\n2️⃣  Logging in as Admin...');
  const tempClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await tempClient.auth.signInWithPassword({
    email: ADMIN_REQ.email,
    password: ADMIN_REQ.password,
  });
  if (error) throw error;
  adminToken = data.session.access_token;
  console.log('   ✅ Admin logged in. Received JWT.');
}

async function testAdminEndpoints() {
  console.log('\n3️⃣  Testing protected Admin endpoints...');
  
  // Create fee structure
  const feeRes = await fetch(`${API_URL}/admin/fee-structures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({
      course_type: 'B.Tech',
      stream: 'Mech',
      year: 2,
      accommodation: 'day_scholar',
      total_fee: 120000,
      academic_year: '2025-26'
    })
  });
  const feeData = await feeRes.json();
  if (!feeRes.ok && feeRes.status !== 409) throw new Error(feeData.message);
  console.log('   ✅ POST /api/admin/fee-structures (worked)');

  // Get students
  const studentRes = await fetch(`${API_URL}/admin/students`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const studentData = await studentRes.json();
  if (!studentRes.ok) throw new Error(studentData.message);
  console.log(`   ✅ GET /api/admin/students (Found ${studentData.data.length} students)`);
}

async function testRBAC() {
  console.log('\n4️⃣  Testing Role-Based Access Control (RBAC)...');
  
  // Register and login a student
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(STUDENT_REQ),
  });
  if (!regRes.ok) throw new Error('Student registration failed');

  const logRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ college_id_number: STUDENT_REQ.college_id_number, password: STUDENT_REQ.password }),
  });
  const logData = await logRes.json();
  studentToken = logData.data.token;
  console.log('   ✅ Student logged in.');

  // Try accessing admin route as student
  const failRes = await fetch(`${API_URL}/admin/students`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  
  if (failRes.status === 403) {
    console.log('   ✅ Student correctly blocked from admin route (403 Forbidden)');
  } else {
    throw new Error(`RBAC failed! Student got status ${failRes.status}`);
  }
}

async function runTests() {
  try {
    console.log('🧪 Starting Admin System E2E Tests...\n');
    await seedAdmin();
    await loginAdmin();
    await testAdminEndpoints();
    await testRBAC();
    console.log(`\n🎉 All tests passed successfully!`);
  } catch (err) {
    console.error(`\n❌ Test failed: ${err.message}`);
  }
}

runTests();
