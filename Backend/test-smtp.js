require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSmtp() {
  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_APP_PASSWORD;

  console.log(`Testing SMTP for: ${email}`);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: email, pass },
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP Connection Successful!');
  } catch (err) {
    console.error('❌ SMTP Connection Failed:', err.message);
    if (err.message.includes('535 5.7.8')) {
      console.log('💡 TIP: This usually means the App Password is wrong or 2-Step Verification is not enabled.');
    }
  }
}

testSmtp();
