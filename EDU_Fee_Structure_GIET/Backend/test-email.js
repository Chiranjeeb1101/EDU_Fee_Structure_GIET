require('dotenv').config();
const nodemailer = require('nodemailer');

const email = process.env.SMTP_EMAIL || 'chiranjeeb.innovatexgiet@gmail.com';
const pass = process.env.SMTP_APP_PASSWORD || 'eqzqrzjjpzodpoji';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: email, pass },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Connection Successful!');
  }
});
