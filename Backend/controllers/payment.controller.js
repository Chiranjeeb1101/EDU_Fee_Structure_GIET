const paymentService = require('../services/payment.service');

/**
 * Create a Stripe Checkout Session (student-facing)
 */
exports.createCheckoutSession = async (req, res) => {
  const userId = req.user.id;
  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: 'A valid "amount" is required.',
    });
  }

  const session = await paymentService.createCheckoutSession(userId, parseFloat(amount));

  res.status(201).json({
    success: true,
    message: 'Stripe Checkout session created.',
    data: session,
  });
};

/**
 * Stripe Webhook Handler
 * ⚠️ This route receives RAW body (not JSON-parsed) for signature verification.
 * It is mounted BEFORE express.json() in server.js.
 */
exports.handleWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature.' });
  }

  try {
    const result = await paymentService.handleWebhookEvent(req.body, signature);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
};

/**
 * Handle Stripe Success Redirect
 * This includes a fallback trigger to verify the session because local environments
 * usually don't receive webhooks.
 */
exports.handleSuccessRedirect = async (req, res) => {
  const { session_id } = req.query;

  if (session_id) {
    // Attempt to manually fulfill the payment
    console.log(`[Fallback] Verifying session: ${session_id}`);
    await paymentService.verifyAndFulfillLocalPayment(session_id);
  }

  // Render the success page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #090e1c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { text-align: center; padding: 40px; max-width: 400px; }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #10b981; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        .hint { margin-top: 24px; color: #64748b; font-size: 12px; background: rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your fee payment has been processed securely via Stripe.</p>
        <div class="hint">You can now close this tab and return to the EDU-Fee app. Your dashboard will update automatically.</div>
      </div>
    </body>
    </html>
  `);
};

/**
 * Get payment history for the authenticated student
 */
exports.getPaymentHistory = async (req, res) => {
  const userId = req.user.id;
  const payments = await paymentService.getPaymentHistory(userId);

  res.status(200).json({
    success: true,
    data: payments,
  });
};

/**
 * Get status of a single payment
 */
exports.getPaymentStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const payment = await paymentService.getPaymentStatus(id, userId);

  res.status(200).json({
    success: true,
    data: payment,
  });
};

/**
 * Generate a PDF receipt for a payment — EXACT REPLICA of GIET physical receipt
 */
exports.getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Retrieve payment details securely
    const payment = await paymentService.getPaymentStatus(id, userId);
    if (payment.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment is not completed' });
    }

    // 2. Fetch student + user details for receipt fields
    const supabase = require('../config/supabase');
    const { data: student } = await supabase
      .from('students')
      .select('college_id_number, stream, year, remaining_fee, course_type')
      .eq('user_id', userId)
      .single();

    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    // 3. Prepare helpers
    const PDFDocument = require('pdfkit');
    const { amountToWords } = require('../utils/numberToWords');
    const path = require('path');
    const fs = require('fs');

    const pageW = 780;
    const pageH = 420;
    const margin = 30;

    const doc = new PDFDocument({
      size: [pageW, pageH],
      margins: { top: 25, bottom: 20, left: margin, right: margin },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-GIET-${payment.id}.pdf`);
    doc.pipe(res);

    // Helper: draw dotted line
    const dottedLine = (x1, y1, x2, y2) => {
      doc.save().moveTo(x1, y1).lineTo(x2, y2)
         .dash(3, { space: 3 }).lineWidth(0.5).stroke('#888').restore();
    };

    // ─── OUTER BORDER ──────────────────────────────────────────────
    doc.rect(10, 10, pageW - 20, pageH - 20).lineWidth(1.5).stroke('#000');
    doc.rect(13, 13, pageW - 26, pageH - 26).lineWidth(0.5).stroke('#000');

    // ─── HEADER SECTION ────────────────────────────────────────────
    let y = 22;
    const left = margin;
    const right = pageW - margin;
    const contentW = right - left;

    // Logo (top-left)
    const logoPath = path.join(__dirname, '..', 'assets', 'giet-logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, left + 5, y + 2, { width: 55, height: 55 });
      } catch (imgErr) {
        console.warn('Logo image failed to load:', imgErr.message);
      }
    }

    // Receipt number (top-right)
    doc.font('Times-Bold').fontSize(9).fillColor('#000')
       .text(`No.: GIET/CLG/${payment.id}`, right - 180, y, { width: 180, align: 'right' });

    // College Name (centered, next to logo)
    y += 5;
    doc.font('Times-Bold').fontSize(15)
       .text('Gandhi Institute for Education and Technology', left + 68, y, {
         width: contentW - 68, align: 'center',
       });

    // Address line
    y += 20;
    doc.font('Times-Roman').fontSize(8)
       .text('At: Baniatangi, Po: Balugur, Dist: Khurda, 752060', left + 68, y, {
         width: contentW - 68, align: 'center',
       });

    // Contact numbers
    y += 11;
    doc.text('Contact: 06755-243603/9437132059/9437094759/9437092059', left + 68, y, {
      width: contentW - 68, align: 'center',
    });

    // Email
    y += 11;
    doc.text('E-Mail : accounts@giet.edu.in', left + 68, y, {
      width: contentW - 68, align: 'center',
    });

    // Website
    y += 11;
    doc.text('www.giet.edu.in', left + 68, y, {
      width: contentW - 68, align: 'center',
    });

    // Print date (right-aligned, below header)
    y += 14;
    const printDate = new Date(payment.created_at);
    const dd = String(printDate.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mon = months[printDate.getMonth()];
    const yyyy = printDate.getFullYear();
    const hh = String(printDate.getHours()).padStart(2, '0');
    const mmTime = String(printDate.getMinutes()).padStart(2, '0');
    doc.font('Times-Roman').fontSize(8)
       .text(`Printed on ${dd}-${mon}-${yyyy} ${hh}:${mmTime}`, left, y, { width: contentW, align: 'right' });

    // ─── SEPARATOR LINE ───────────────────────────────────────────
    y += 14;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).stroke('#000');

    // ─── TITLE: MONEY RECEIPT ──────────────────────────────────────
    y += 8;
    doc.font('Times-Bold').fontSize(18)
       .text('MONEY RECEIPT', left, y, { width: contentW, align: 'center' });

    // ─── FORM FIELDS ───────────────────────────────────────────────
    y += 30;
    const labelX = left + 10;
    const colonX = left + 210;
    const valueX = colonX + 15;
    const lineEnd = right - 15;
    const rowH = 24;

    const studentName = userData?.full_name || 'N/A';
    const collegeId = student?.college_id_number || 'N/A';
    const branch = `${student?.stream || 'N/A'} ${student?.year || ''}`.trim();
    const amtWords = amountToWords(Number(payment.amount));
    const remarks = payment.remarks || 'Being the amount received towards fee payment';

    // Row 1: Received with thanks from
    doc.font('Times-Roman').fontSize(11).text('Received with thanks from', labelX, y);
    doc.font('Times-Roman').fontSize(11).text(':', colonX, y);
    doc.font('Times-Bold').fontSize(11).text(`${collegeId}  ${studentName}`, valueX, y);
    dottedLine(valueX, y + 14, lineEnd, y + 14);

    // Row 2: Branch Name
    y += rowH;
    doc.font('Times-Roman').fontSize(11).text('Branch Name', labelX, y);
    doc.font('Times-Roman').fontSize(11).text(':', colonX, y);
    doc.font('Times-Bold').fontSize(11).text(branch, valueX, y);
    dottedLine(valueX, y + 14, lineEnd, y + 14);

    // Row 3: The sum of
    y += rowH;
    doc.font('Times-Roman').fontSize(11).text('The sum of', labelX, y);
    doc.font('Times-Roman').fontSize(11).text(':', colonX, y);
    doc.font('Times-Bold').fontSize(11).text(amtWords, valueX, y, { width: lineEnd - valueX });
    dottedLine(valueX, y + 14, lineEnd, y + 14);

    // Row 4: Payment method
    y += rowH;
    doc.font('Times-Roman').fontSize(11).text('By Cash/Chq/Draft/Online', labelX, y);
    doc.font('Times-Roman').fontSize(11).text(':', colonX, y);
    doc.font('Times-Bold').fontSize(11).text('Online', valueX, y);
    dottedLine(valueX, y + 14, lineEnd, y + 14);

    // Row 5: Remarks
    y += rowH;
    doc.font('Times-Roman').fontSize(11).text('Remarks', labelX, y);
    doc.font('Times-Roman').fontSize(11).text(':', colonX, y);
    doc.font('Times-Bold').fontSize(11).text(remarks, valueX, y, { width: lineEnd - valueX });
    dottedLine(valueX, y + 14, lineEnd, y + 14);

    // ─── AMOUNT SECTION ────────────────────────────────────────────
    y += 32;
    const amountStr = Number(payment.amount).toFixed(2);
    doc.font('Times-Bold').fontSize(14).text(`Rs. ${amountStr}/-`, labelX, y);

    // Total Due
    y += 18;
    const remainingAmt = Number(student?.remaining_fee || 0).toFixed(2);
    doc.font('Times-Roman').fontSize(10).text('Total Due Rs.', labelX, y);
    doc.font('Times-Bold').fontSize(12).text(`${remainingAmt} Cr`, labelX + 85, y);

    // ─── DIGITAL STAMP (bottom-left) ──────────────────────────────
    const stampCX = left + 80;
    const stampCY = pageH - 55;
    const stampR = 28;

    // Outer circle
    doc.circle(stampCX, stampCY, stampR).lineWidth(2).stroke('#1a3a7b');
    // Inner circle
    doc.circle(stampCX, stampCY, stampR - 4).lineWidth(1).stroke('#1a3a7b');

    // Stamp center text
    doc.font('Times-Bold').fontSize(10).fillColor('#1a3a7b')
       .text('GIET', stampCX - 14, stampCY - 8, { width: 28, align: 'center' });
    doc.font('Times-Bold').fontSize(7).fillColor('#1a3a7b')
       .text('BBSR', stampCX - 14, stampCY + 3, { width: 28, align: 'center' });

    // ─── AUTHORISED SIGNATURE (bottom-right) ──────────────────────
    doc.fillColor('#000');
    dottedLine(right - 180, pageH - 42, right - 20, pageH - 42);
    doc.font('Times-Roman').fontSize(9)
       .text('Authorised Signature', right - 180, pageH - 38, { width: 160, align: 'center' });

    doc.end();

  } catch (err) {
    console.error('Receipt generation error:', err);
    // If headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate receipt. Please try again.',
        error: err.message
      });
    }
  }
};

