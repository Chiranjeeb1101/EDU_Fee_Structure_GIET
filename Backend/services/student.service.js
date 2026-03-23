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
      .select('id, amount, status, stripe_checkout_session_id, stripe_payment_intent_id, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      throw Object.assign(new Error('Failed to fetch payment history.'), { statusCode: 500 });
    }

    // 3. Fetch unread notification count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // 4. Fetch fee breakdown (individual components)
    const { data: applicableFees } = await supabase
      .from('fee_structures')
      .select('title, total_fee')
      .eq('college_id', student.college_id)
      .eq('course_type', student.course_type)
      .eq('stream', student.stream)
      .eq('year', student.year)
      .or(`accommodation.eq.${student.accommodation},accommodation.eq.both`);

    return {
      profile_complete: student.profile_complete,
      fee_status: {
        total_fee: student.total_fee,
        paid_fee: student.paid_fee,
        remaining_fee: student.remaining_fee,
      },
      unread_notifications_count: unreadCount || 0,
      fee_breakdown: applicableFees || [],
      payment_history: payments || [],
    };
  }

  async getNotifications(userId) {
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notifError) {
      throw Object.assign(new Error('Failed to fetch notifications.'), { statusCode: 500 });
    }

    return notifications;
  }

  async markNotificationRead(userId, notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw Object.assign(new Error('Failed to mark notification as read.'), { statusCode: 500 });
    }
    
    return true;
  }

  // --- Document Methods ---
  async getDocuments(userId) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false });

    if (error) {
      throw Object.assign(new Error('Failed to fetch documents.'), { statusCode: 500 });
    }
    return data;
  }

  async addDocument(userId, docData) {
    const { title, format, size, file_url, icon } = docData;
    const { data, error } = await supabase
      .from('documents')
      .insert([{ user_id: userId, title, format, size, file_url, icon }])
      .select()
      .single();

    if (error) {
      throw Object.assign(new Error('Failed to save document records.'), { statusCode: 500 });
    }
    return data;
  }

  async deleteDocument(userId, documentId) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      throw Object.assign(new Error('Failed to delete document.'), { statusCode: 500 });
    }
    return true;
  }
}

module.exports = new StudentService();
