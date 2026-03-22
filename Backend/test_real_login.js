require('dotenv').config();
const authService = require('./services/auth.service');

async function test() {
  const collegeIdNumber = '2401326340';
  const newPassword = 'TestPassword123!';
  
  console.log('--- Testing Real Auth Service Login ---');
  try {
    const result = await authService.login(collegeIdNumber, newPassword, null);
    console.log('Login Result SUCCESS');
    console.log('Token Length:', result.token.length);
    console.log('User:', result.user.email);
  } catch (err) {
    console.error('LOGIN THREW ERROR:');
    console.error('Message:', err.message);
    console.error('Status Code:', err.statusCode);
  }
}

test();
