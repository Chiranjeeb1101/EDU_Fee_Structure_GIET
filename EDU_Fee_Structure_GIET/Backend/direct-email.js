require('dotenv').config();
const emailService = require('./services/email.service');

async function directTest() {
  console.log('Testing Email Service explicitly...');
  const res = await emailService.sendBroadcast({
    to: 'chiranjeeb.innovatexgiet@gmail.com', // sending it to the user's own email to test
    studentName: 'Test Admin',
    subject: 'SMTP Configuration Success',
    message: 'Your Nodemailer and Gmail App Password setup is working perfectly. You can now use the Email Center in the Admin Dashboard to send broadcasts and fee reminders to students.'
  });
  console.log('Result:', res);
}

directTest();
