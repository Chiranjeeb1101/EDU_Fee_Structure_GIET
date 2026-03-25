const axios = require('axios');

async function testEmail() {
  try {
    // 1. Login as admin
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin-17739434403295@giet.edu',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully');

    // 2. Fetch students to get some IDs (or just send to all)
    const studentsRes = await axios.get('http://localhost:5000/api/admin/students', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Fetched ${studentsRes.data.data.length} students`);

    // 3. Send broadcast
    console.log('⏳ Sending broadcast email...');
    const broadcastRes = await axios.post('http://localhost:5000/api/admin/email/broadcast', {
      subject: 'Test Broadcast from Backend API',
      message: 'This is a test broadcast to verify the NodeMailer integration is working properly.'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Broadcast response:', broadcastRes.data);
  } catch (err) {
    console.error('❌ Test failed:', err.response ? err.response.data : err.message);
  }
}

testEmail();
