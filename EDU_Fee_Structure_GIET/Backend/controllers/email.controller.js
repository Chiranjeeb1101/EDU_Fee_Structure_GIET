const emailService = require('../services/email.service');
const supabase = require('../config/supabase');

/**
 * Send fee reminders to students with pending fees
 * POST /api/admin/email/reminder
 * Body: { studentIds?: string[], dueDate?: string }
 *   - studentIds: optional array; if omitted, all students with remaining_fee > 0
 *   - dueDate: optional display string like "31 Mar 2026"
 */
exports.sendReminders = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const { studentIds, dueDate } = req.body;

  // 1. Fetch target students
  let query = supabase
    .from('students')
    .select('id, college_id_number, stream, year, remaining_fee, user_id, users(full_name, email, personal_email)')
    .eq('college_id', adminCollegeId)
    .gt('remaining_fee', 0);

  if (studentIds && studentIds.length > 0) {
    query = query.in('id', studentIds);
  }

  const { data: students, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  if (!students || students.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No students with pending fees found.',
      data: { sent: 0, failed: 0 },
    });
  }

  // 2. Send emails
  let sent = 0;
  let failed = 0;
  const results = [];

  for (const s of students) {
    const recipientEmail = s.users?.personal_email || s.users?.email;
    if (!recipientEmail) {
      failed++;
      results.push({ studentId: s.id, status: 'skipped', reason: 'No email' });
      continue;
    }

    const result = await emailService.sendFeeReminder({
      to: recipientEmail,
      studentName: s.users?.full_name || 'Student',
      collegeId: s.college_id_number,
      remainingFee: s.remaining_fee,
      stream: s.stream,
      year: s.year,
      dueDate,
    });

    if (result && result.success) {
      sent++;
      results.push({ studentId: s.id, status: 'sent' });
    } else {
      failed++;
      results.push({ studentId: s.id, status: 'failed', reason: result?.error || 'Unknown' });
    }
  }

  // 3. Log to notifications table
  for (const s of students) {
    try {
      await supabase.from('notifications').insert([{
        user_id: s.user_id,
        title: 'Fee Reminder Sent',
        message: `A fee reminder has been sent to your email. Pending: ₹${Number(s.remaining_fee).toLocaleString('en-IN')}`,
        type: 'warning',
      }]);
    } catch (_) { /* non-critical */ }
  }

  res.status(200).json({
    success: true,
    message: `Reminders sent: ${sent}, Failed: ${failed}`,
    data: { sent, failed, total: students.length, results },
  });
};

/**
 * Send broadcast email to students
 * POST /api/admin/email/broadcast
 * Body: { subject, message, studentIds?: string[] }
 *   - studentIds: optional; if omitted, sends to ALL students
 */
exports.sendBroadcast = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const { subject, message, studentIds } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Both "subject" and "message" are required.',
    });
  }

  // 1. Fetch target students
  let query = supabase
    .from('students')
    .select('id, user_id, users(full_name, email, personal_email)')
    .eq('college_id', adminCollegeId);

  if (studentIds && studentIds.length > 0) {
    query = query.in('id', studentIds);
  }

  const { data: students, error } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  if (!students || students.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No students found.',
      data: { sent: 0, failed: 0 },
    });
  }

  // 2. Send emails
  let sent = 0;
  let failed = 0;

  for (const s of students) {
    const recipientEmail = s.users?.personal_email || s.users?.email;
    if (!recipientEmail) {
      failed++;
      continue;
    }

    const result = await emailService.sendBroadcast({
      to: recipientEmail,
      studentName: s.users?.full_name || 'Student',
      subject,
      message,
    });

    if (result && result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  // 3. Log notifications
  for (const s of students) {
    try {
      await supabase.from('notifications').insert([{
        user_id: s.user_id,
        title: subject,
        message: message.substring(0, 200),
        type: 'info',
      }]);
    } catch (_) { /* non-critical */ }
  }

  res.status(200).json({
    success: true,
    message: `Broadcast sent: ${sent}, Failed: ${failed}`,
    data: { sent, failed, total: students.length },
  });
};
