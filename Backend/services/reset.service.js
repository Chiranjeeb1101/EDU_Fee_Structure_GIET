const supabase = require('../config/supabase');

/**
 * Reset Service
 */
const createRequest = async (college_id_number) => {
  // 1. Find the student by college_id_number
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, college_id, users(full_name)')
    .eq('college_id_number', college_id_number)
    .single();

  if (studentError || !student) {
    throw Object.assign(new Error('Student with this College ID not found.'), { statusCode: 404 });
  }

  // 2. Check for an existing request that is pending or approved
  const { data: existing } = await supabase
    .from('password_reset_requests')
    .select('*')
    .eq('student_id', student.id)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return { 
      request: existing, 
      student_name: student.users.full_name,
      alreadyExists: true 
    };
  }

  // 3. Create the request
  const { data, error } = await supabase
    .from('password_reset_requests')
    .insert([{
      student_id: student.id,
      college_id: student.college_id,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;

  return { request: data, student_name: student.users.full_name };
};

const getPendingRequests = async (college_id) => {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .select(`
      id,
      status,
      created_at,
      students (
        college_id_number,
        users (full_name)
      )
    `)
    .eq('college_id', college_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

const updateStatus = async (id, status, admin_id) => {
  const { data, error } = await supabase
    .from('password_reset_requests')
    .update({ 
      status, 
      admin_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*, students(user_id)')
    .single();

  if (error) throw error;

  // Create notification for student
  if (data && data.students && data.students.user_id) {
    const title = status === 'approved' ? 'Password Reset Approved' : 'Password Reset Rejected';
    const message = status === 'approved' 
      ? 'Your password reset request has been approved. Please go to the Forgot Password screen and enter your ID to set a new password.'
      : 'Your password reset request was rejected by the Admin. Please contact the office for more information.';
    
    await supabase.from('notifications').insert([{
      user_id: data.students.user_id,
      title,
      message,
      type: status === 'approved' ? 'success' : 'error'
    }]);
  }

  return data;
};

const finalizeReset = async (requestId, newPassword) => {
    // 1. Verify the request is approved and get the auth_id
    const { data: request, error: reqError } = await supabase
      .from('password_reset_requests')
      .select(`
        student_id, 
        status, 
        students (
          user_id,
          users (auth_id)
        )
      `)
      .eq('id', requestId)
      .single();

    if (reqError || !request) throw new Error('Invalid request.');
    if (request.status !== 'approved') throw new Error('Request has not been approved by Admin yet.');

    const authId = request.students.users.auth_id;
    if (!authId) throw new Error('User has no linked authentication record.');

    // 2. Update the user's password in Supabase Auth using the auth_id
    const { error: authError } = await supabase.auth.admin.updateUserById(
      authId,
      { password: newPassword }
    );

    if (authError) throw authError;

    // 3. Mark request as resolved
    await supabase
      .from('password_reset_requests')
      .update({ status: 'resolved' })
      .eq('id', requestId);

    return { success: true };
};

module.exports = {
  createRequest,
  getPendingRequests,
  updateStatus,
  finalizeReset
};
