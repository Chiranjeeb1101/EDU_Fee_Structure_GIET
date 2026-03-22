const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function testPaymentAuth() {
  console.log('--- Testing Payment Auth ---');
  
  // 1. Log in as a student to get a fresh token
  const collegeIdNum = '2401326348';
  const password = 'password123'; // Assuming this is the password
  
  console.log(`Logging in as ${collegeIdNum}...`);
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      college_id_number: collegeIdNum,
      password: password
    });
    
    const token = loginRes.data.data.token;
    console.log('✅ Logged in. Token received.');

    // 2. Try Dashboard (GET)
    console.log('\nTesting Dashboard (GET)...');
    const dashRes = await axios.get(`${API_URL}/students/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard status:', dashRes.status);

    // 3. Try Payment Session (POST)
    console.log('\nTesting Create Checkout Session (POST)...');
    try {
      const payRes = await axios.post(`${API_URL}/payments/create-checkout-session`, 
        { amount: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Payment Session status:', payRes.status);
    } catch (err) {
      console.error('❌ Payment Session failed:', err.response?.status, err.response?.data?.message);
    }

  } catch (err) {
    console.error('🔥 Login failed:', err.response?.data?.message || err.message);
  }
}

testPaymentAuth();
