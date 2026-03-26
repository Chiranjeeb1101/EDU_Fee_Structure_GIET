const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution to prevent ENETUNREACH in Render/Docker environments
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

class EmailService {
  constructor() {
    this.transporter = null;
    this._init();
  }

  _init() {
    const email = process.env.SMTP_EMAIL;
    const pass  = process.env.SMTP_APP_PASSWORD;

    if (!email || !pass) {
      console.warn('⚠️  SMTP_EMAIL or SMTP_APP_PASSWORD not set — email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: email, pass },
    });

    console.log(`📧 Email service ready (${email})`);
  }

  // ─── Shared HTML wrapper ────────────────────────────────────────
  _wrapHtml(bodyContent) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Roboto,sans-serif}
  .container{max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 24px;text-align:center}
  .header img{width:48px;height:48px;margin-bottom:8px}
  .header h1{color:#fff;font-size:22px;margin:0;font-weight:800;letter-spacing:-.5px}
  .header p{color:rgba(255,255,255,.8);font-size:13px;margin:6px 0 0}
  .body{padding:28px 24px;color:#e2e8f0}
  .body h2{color:#fff;font-size:18px;margin:0 0 16px;font-weight:700}
  .body p{font-size:14px;line-height:1.7;margin:0 0 12px;color:#cbd5e1}
  .info-card{background:#0f172a;border:1px solid #334155;border-radius:12px;padding:20px;margin:16px 0}
  .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b}
  .info-row:last-child{border-bottom:none}
  .info-label{color:#94a3b8;font-size:13px}
  .info-value{color:#f1f5f9;font-size:14px;font-weight:600}
  .highlight{color:#22d3ee;font-weight:700;font-size:24px}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin-top:16px}
  .footer{padding:20px 24px;text-align:center;border-top:1px solid #334155}
  .footer p{color:#64748b;font-size:11px;margin:0;line-height:1.6}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
  .badge-success{background:rgba(16,185,129,.15);color:#10b981}
  .badge-warning{background:rgba(245,158,11,.15);color:#f59e0b}
</style></head><body>
<div style="padding:20px">
<div class="container">
  ${bodyContent}
  <div class="footer">
    <p>© ${new Date().getFullYear()} EDU-Fee Management System — GIET, Bhubaneswar<br>
    This is an automated message. Please do not reply.</p>
  </div>
</div>
</div>
</body></html>`;
  }

  // ─── Payment Confirmation Email ─────────────────────────────────
  async sendPaymentConfirmation({ to, studentName, collegeId, amount, remainingFee, paymentId, stream, year }) {
    if (!this.transporter) return null;

    const html = this._wrapHtml(`
      <div class="header">
        <h1>💳 Payment Confirmed</h1>
        <p>Your fee payment has been processed successfully</p>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>We have received your fee payment. Here are the details:</p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Student ID</span>
            <span class="info-value">${collegeId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Program</span>
            <span class="info-value">${stream || 'N/A'} — Year ${year || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Amount Paid</span>
            <span class="info-value" style="color:#10b981">₹${Number(amount).toLocaleString('en-IN')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Remaining Balance</span>
            <span class="info-value" style="color:${Number(remainingFee) > 0 ? '#f59e0b' : '#10b981'}">₹${Number(remainingFee).toLocaleString('en-IN')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Ref</span>
            <span class="info-value">#${paymentId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status</span>
            <span class="badge badge-success">✓ PAID</span>
          </div>
        </div>

        <p>You can download your receipt from the EDU-Fee app at any time.</p>
      </div>
    `);

    return this._send({
      to,
      subject: `✅ Payment Confirmed — ₹${Number(amount).toLocaleString('en-IN')} received`,
      html,
    });
  }

  // ─── Fee Reminder Email ─────────────────────────────────────────
  async sendFeeReminder({ to, studentName, collegeId, remainingFee, stream, year, dueDate }) {
    if (!this.transporter) return null;

    const dueLine = dueDate
      ? `<p style="color:#f59e0b;font-weight:600">⏰ Due Date: ${dueDate}</p>`
      : '';

    const html = this._wrapHtml(`
      <div class="header" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">
        <h1>🔔 Fee Payment Reminder</h1>
        <p>You have pending fee dues</p>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is a friendly reminder that you have an outstanding fee balance:</p>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Student ID</span>
            <span class="info-value">${collegeId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Program</span>
            <span class="info-value">${stream || 'N/A'} — Year ${year || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Pending Amount</span>
            <span class="info-value highlight">₹${Number(remainingFee).toLocaleString('en-IN')}</span>
          </div>
        </div>

        ${dueLine}

        <p>Please clear your dues at the earliest to avoid any late fees or academic holds.</p>
        <p>You can pay securely through the EDU-Fee app.</p>
      </div>
    `);

    return this._send({
      to,
      subject: `🔔 Fee Reminder — ₹${Number(remainingFee).toLocaleString('en-IN')} pending`,
      html,
    });
  }

  // ─── Admin Broadcast Email ──────────────────────────────────────
  async sendBroadcast({ to, studentName, subject, message }) {
    if (!this.transporter) return null;

    // Convert newlines to <br> for HTML rendering
    const htmlMessage = message.replace(/\n/g, '<br>');

    const html = this._wrapHtml(`
      <div class="header">
        <h1>📢 ${subject}</h1>
        <p>Important notice from your institution</p>
      </div>
      <div class="body">
        <p>Dear <strong>${studentName}</strong>,</p>
        <div style="background:#0f172a;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:8px;margin:16px 0">
          <p style="margin:0;color:#e2e8f0;font-size:14px;line-height:1.8">${htmlMessage}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px">This message was sent by the admin of your institution via the EDU-Fee Management System.</p>
      </div>
    `);

    return this._send({ to, subject: `📢 ${subject}`, html });
  }

  // ─── Core Send Method ───────────────────────────────────────────
  async _send({ to, subject, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: `"EDU-Fee GIET" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`📧 Email sent to ${to} — ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`❌ Email failed to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = new EmailService();
