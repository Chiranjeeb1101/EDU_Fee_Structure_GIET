const supabase = require('../config/supabase');
const stripe = require('../config/stripe');

class PaymentService {
  /**
   * Create a Stripe Checkout Session for a partial or full payment.
   * Supports installments — student can pay any amount ≤ remaining_fee.
   *
   * @param {string} userId - authenticated user's id from `users` table
   * @param {number} amount - amount in INR (can be a partial installment)
   * @returns {object} { session_url, session_id, payment_id }
   */
  async createCheckoutSession(userId, amount) {
    // 1. Fetch the student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, college_id, remaining_fee, profile_complete, college_id_number')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Student record not found.'), { statusCode: 404 });
    }

    if (!student.profile_complete) {
      throw Object.assign(
        new Error('Please complete your profile before making a payment.'),
        { statusCode: 400 }
      );
    }

    // 2. Validate: amount > 0 and ≤ remaining_fee (overpayment prevention)
    if (!amount || amount <= 0) {
      throw Object.assign(new Error('Payment amount must be greater than 0.'), { statusCode: 400 });
    }

    if (amount > parseFloat(student.remaining_fee)) {
      throw Object.assign(
        new Error(
          `Amount (₹${amount}) exceeds remaining fee (₹${student.remaining_fee}). Cannot overpay.`
        ),
        { statusCode: 400 }
      );
    }

    // 3. Fetch student's name for the checkout page
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'upi'],
      mode: 'payment',
      currency: 'inr',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            unit_amount: Math.round(amount * 100), // Stripe expects paise
            product_data: {
              name: 'College Fee Payment',
              description: `Fee payment for ${user?.full_name || 'Student'} (${student.college_id_number})`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        student_id: student.id,
        college_id: student.college_id,
        user_id: userId,
      },
      success_url: `${process.env.BACKEND_URL}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BACKEND_URL}/api/payments/cancel`,
    });

    // 5. Insert a 'created' payment record in DB
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          student_id: student.id,
          college_id: student.college_id,
          amount: amount,
          stripe_checkout_session_id: session.id,
          status: 'created',
        },
      ])
      .select()
      .single();

    if (paymentError) {
      throw Object.assign(new Error('Failed to create payment record.'), { statusCode: 500 });
    }

    console.log(`💳 Checkout session created: ${session.id} for ₹${amount}`);

    return {
      session_url: session.url,
      session_id: session.id,
      payment_id: payment.id,
      amount,
      currency: 'INR',
    };
  }

  /**
   * Handle Stripe webhook event.
   * Verifies signature and processes `checkout.session.completed`.
   * ⚠️ NEVER trust frontend — only webhooks update payment status.
   *
   * @param {Buffer} rawBody - raw request body for signature verification
   * @param {string} signature - Stripe-Signature header value
   */
  async handleWebhookEvent(rawBody, signature) {
    let event;

    // 1. Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      throw Object.assign(new Error(`Webhook signature verification failed: ${err.message}`), {
        statusCode: 400,
      });
    }

    console.log(`📩 Webhook received: ${event.type}`);

    // 2. Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await this._handleSuccessfulPayment(event.data.object);
        break;

      case 'checkout.session.expired':
        await this._handleExpiredSession(event.data.object);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return { received: true, type: event.type };
  }

  /**
   * Manual fallback: Verify a session with Stripe and fulfill it.
   * Useful for local development when webhooks can't reach the server.
   */
  async verifyAndFulfillLocalPayment(sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === 'paid') {
        await this._handleSuccessfulPayment(session);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Manual fulfillment error:', err.message);
      return false;
    }
  }

  /**
   * Process a successful Stripe Checkout Session.
   * Updates payment record and student fee balances.
   */
  async _handleSuccessfulPayment(session) {
    const sessionId = session.id;

    // 1. Find the payment record (idempotency check)
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_checkout_session_id', sessionId)
      .single();

    if (fetchError || !payment) {
      console.error(`⚠️  No payment record found for session: ${sessionId}`);
      return;
    }

    // Idempotency: skip if already processed
    if (payment.status === 'paid') {
      console.log(`ℹ️  Payment ${payment.id} already processed. Skipping.`);
      return;
    }

    // 2. Update payment record
    const { error: updatePaymentError } = await supabase
      .from('payments')
      .update({
        stripe_payment_intent_id: session.payment_intent,
        status: 'paid',
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('❌ Failed to update payment record:', updatePaymentError.message);
      return;
    }

    // 3. Update student's paid_fee and remaining_fee
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('paid_fee, remaining_fee')
      .eq('id', payment.student_id)
      .single();

    if (studentError || !student) {
      console.error('❌ Student not found for fee update.');
      return;
    }

    const newPaidFee = parseFloat(student.paid_fee) + parseFloat(payment.amount);
    const newRemainingFee = parseFloat(student.remaining_fee) - parseFloat(payment.amount);

    const { error: updateStudentError } = await supabase
      .from('students')
      .update({
        paid_fee: newPaidFee,
        remaining_fee: Math.max(0, newRemainingFee), // Safety: never go negative
      })
      .eq('id', payment.student_id);

    if (updateStudentError) {
      console.error('❌ Failed to update student fee records:', updateStudentError.message);
      return;
    }

    console.log(
      `✅ Payment ${payment.id} verified. Paid: ₹${newPaidFee}, Remaining: ₹${Math.max(0, newRemainingFee)}`
    );

    // 4. Send confirmation email
    try {
      const emailService = require('./email.service');
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email, personal_email')
        .eq('id', session.metadata?.user_id)
        .single();

      const { data: studentData } = await supabase
        .from('students')
        .select('college_id_number, stream, year')
        .eq('id', payment.student_id)
        .single();

      const recipientEmail = userData?.personal_email || userData?.email;
      if (recipientEmail) {
        await emailService.sendPaymentConfirmation({
          to: recipientEmail,
          studentName: userData?.full_name || 'Student',
          collegeId: studentData?.college_id_number || 'N/A',
          amount: payment.amount,
          remainingFee: Math.max(0, newRemainingFee),
          paymentId: payment.id,
          stream: studentData?.stream,
          year: studentData?.year,
        });
      }
    } catch (emailErr) {
      console.error('📧 Confirmation email failed (non-critical):', emailErr.message);
    }
  }

  /**
   * Handle expired checkout session — mark payment as failed.
   */
  async _handleExpiredSession(session) {
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_checkout_session_id', session.id);

    console.log(`⏰ Session ${session.id} expired — payment marked as failed.`);
  }

  /**
   * Get payment history for a student
   */
  async getPaymentHistory(userId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, amount, status, stripe_checkout_session_id, stripe_payment_intent_id, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw Object.assign(new Error('Failed to fetch payments.'), { statusCode: 500 });
    }

    return payments;
  }

  /**
   * Get status of a single payment by its ID
   */
  async getPaymentStatus(paymentId, userId) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('student_id', student.id) // Ensure student can only see their own
      .single();

    if (error || !payment) {
      throw Object.assign(new Error('Payment not found.'), { statusCode: 404 });
    }

    return payment;
  }
}

module.exports = new PaymentService();
