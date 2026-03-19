const supabase = require('../config/supabase');

class StudentService {
  /**
   * Fetch the dashboard data for the authenticated student.
   * Includes total_fee, paid_fee, remaining_fee and payment_history.
   * 
   * @param {string} userId - the `id` from the `users` table
   */
  async getDashboardData(userId) {
    // 1. Fetch student's core fee metrics
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, total_fee, paid_fee, remaining_fee, profile_complete')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Student record not found.'), { statusCode: 404 });
    }

    // 2. Fetch all payment history for this student
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, razorpay_order_id, razorpay_payment_id, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      throw Object.assign(new Error('Failed to fetch payment history.'), { statusCode: 500 });
    }

    return {
      profile_complete: student.profile_complete,
      fee_status: {
        total_fee: student.total_fee,
        paid_fee: student.paid_fee,
        remaining_fee: student.remaining_fee,
      },
      payment_history: payments || [],
    };
  }
}

module.exports = new StudentService();
