const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('./config/supabase');

async function testStripeFlow() {
  console.log('--- STRIPE E2E TEST ---');

  // 1. Create a student user or login
  const studentData = {
    full_name: 'Stripe Tester',
    college_id_number: `STRIPE_${Date.now()}`,
    password: 'Password123!',
  };

  const API = 'http://localhost:5000/api';
  
  console.log('1️⃣ Registering student...');
  let res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });
  
  if (!res.ok) throw new Error('Registration failed' + await res.text());
  
  console.log('2️⃣ Logging in...');
  res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college_id_number: studentData.college_id_number,
      password: studentData.password
    })
  });
  const loginData = await res.json();
  const token = loginData.data.token;

  console.log('3️⃣ Completing profile...');
  res = await fetch(`${API}/auth/complete-profile`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      course_type: 'B.Tech',
      stream: 'CSE',
      year: 1,
      accommodation: 'day_scholar',
      academic_year: '2025-26'
    })
  });
  
  if (!res.ok) throw new Error('Profile completion failed: ' + await res.text());

  // 4. Create Checkout Session
  console.log('4️⃣ Creating Stripe Checkout Session...');
  res = await fetch(`${API}/payments/create-checkout-session`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount: 5000 })
  });

  const sessionData = await res.json();
  if (!sessionData.success) {
    console.error('Failed to create checkout session:', sessionData);
    console.log('NOTE: If this failed due to DB insertion, the Supabase Migration has not been applied yet!');
    return;
  }

  const sessionId = sessionData.data.session_id;
  const paymentId = sessionData.data.payment_id;
  console.log(`✅ Session created: ${sessionId}`);

  // 5. Simulate Webhook
  console.log('5️⃣ Simulating Stripe Webhook (checkout.session.completed)...');
  
  const payload = {
    id: `evt_test_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        payment_intent: `pi_test_${Date.now()}`,
      }
    }
  };

  const payloadString = JSON.stringify(payload);
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Generate signature
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret,
  });

  res = await fetch(`${API}/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': header
    },
    body: payloadString
  });

  const webhookResult = await res.json();
  console.log('Webhook Response:', res.status, webhookResult);

  // 6. Verify Database
  console.log('6️⃣ Verifying Database...');
  const { data: checkPayment } = await supabase
    .from('payments')
    .select('status, stripe_payment_intent_id')
    .eq('id', paymentId)
    .single();

  console.log('Payment Record Status:', checkPayment?.status);
  console.log('Payment Intent ID:', checkPayment?.stripe_payment_intent_id);

  if (checkPayment?.status === 'paid') {
    console.log('🎉 TEST PASSED END-TO-END! (Webhook processed and DB updated)');
  } else {
    console.log('❌ TEST FAILED - Status is not paid');
  }
}

testStripeFlow().catch(console.error);
