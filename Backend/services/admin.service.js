const supabase = require('../config/supabase');

class AdminService {
  /**
   * Create a new fee structure for the admin's college
   */
  async createFeeStructure(adminCollegeId, data) {
    const { course_type, stream, year, accommodation, total_fee, academic_year } = data;

    const { data: newFee, error } = await supabase
      .from('fee_structures')
      .insert([
        {
          college_id: adminCollegeId,
          course_type,
          stream,
          year,
          accommodation,
          total_fee,
          academic_year,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw Object.assign(new Error('A fee structure for these exact parameters already exists.'), { statusCode: 409 });
      }
      throw Object.assign(new Error(`Failed to create fee structure: ${error.message}`), { statusCode: 500 });
    }

    return newFee;
  }

  /**
   * Get all fee structures for the admin's college
   */
  async getFeeStructures(adminCollegeId) {
    const { data, error } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('college_id', adminCollegeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw Object.assign(new Error(`Failed to fetch fee structures: ${error.message}`), { statusCode: 500 });
    }

    return data;
  }

  /**
   * Update an existing fee structure
   */
  async updateFeeStructure(adminCollegeId, feeId, updates) {
    const { data, error } = await supabase
      .from('fee_structures')
      .update(updates)
      .eq('id', feeId)
      .eq('college_id', adminCollegeId) // Ensure they only update their own college
      .select()
      .single();

    if (error) {
      throw Object.assign(new Error(`Failed to update fee structure: ${error.message}`), { statusCode: 500 });
    }

    if (!data) {
      throw Object.assign(new Error('Fee structure not found or unauthorized.'), { statusCode: 404 });
    }

    return data;
  }

  /**
   * Delete a fee structure
   */
  async deleteFeeStructure(adminCollegeId, feeId) {
    const { data, error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', feeId)
      .eq('college_id', adminCollegeId) // Ensure they only delete their own college
      .select()
      .single();

    if (error) {
      throw Object.assign(new Error(`Failed to delete fee structure: ${error.message}`), { statusCode: 500 });
    }

    if (!data) {
      throw Object.assign(new Error('Fee structure not found or unauthorized.'), { statusCode: 404 });
    }

    return true;
  }

  /**
   * Get all students for the admin's college (includes user details & payment stats)
   */
  async getStudents(adminCollegeId) {
    // We join the `users` table to get the full_name and email
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users ( full_name, email, personal_email )
      `)
      .eq('college_id', adminCollegeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw Object.assign(new Error(`Failed to fetch students: ${error.message}`), { statusCode: 500 });
    }

    return data;
  }

  /**
   * Get a single student by ID
   */
  async getStudentById(adminCollegeId, studentId) {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, users(full_name, email, personal_email, profile_picture)')
      .eq('id', studentId)
      .eq('college_id', adminCollegeId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { ...student, payments: payments || [] };
  }

  /**
   * Update student details
   */
  async updateStudent(adminCollegeId, studentId, updates) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .eq('college_id', adminCollegeId)
      .select()
      .single();

    if (error) throw Object.assign(new Error(error.message), { statusCode: 500 });
    return data;
  }

  /**
   * Delete a student
   */
  async deleteStudent(adminCollegeId, studentId) {
    const { data, error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId)
      .eq('college_id', adminCollegeId)
      .select()
      .single();

    if (error) throw Object.assign(new Error(error.message), { statusCode: 500 });
    
    // Attempt deleting user from users table (cascades)
    if (data && data.user_id) {
      await supabase.from('users').delete().eq('id', data.user_id);
    }
    
    return true;
  }

  /**
   * Get all payments across the college
   */
  async getAllPayments(adminCollegeId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(college_id_number, course_type, stream, users(full_name))')
      .eq('college_id', adminCollegeId)
      .order('created_at', { ascending: false });
      
    if (error) throw Object.assign(new Error(error.message), { statusCode: 500 });
    return data;
  }

  /**
   * Get KPI Stats for Dashboard
   */
  async getAdminStats(adminCollegeId) {
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', adminCollegeId);

    const { count: activeFeeStructures } = await supabase
      .from('fee_structures')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', adminCollegeId);

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('college_id', adminCollegeId);

    let totalCollected = 0;
    let totalPendingAmount = 0; // Requires aggregating remaining fees from students
    let recentPaymentsCount = 0;

    if (payments) {
      totalCollected = payments
        .filter(p => p.status === 'success' || p.status === 'paid' || p.status === 'captured')
        .reduce((sum, p) => sum + Number(p.amount), 0);
    }

    const { data: students } = await supabase
      .from('students')
      .select('remaining_fee, total_fee')
      .eq('college_id', adminCollegeId);

    if (students) {
      totalPendingAmount = students.reduce((sum, s) => sum + Number(s.remaining_fee), 0);
    }

    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*, students(users(full_name))')
      .eq('college_id', adminCollegeId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      total_students: totalStudents || 0,
      active_fee_structures: activeFeeStructures || 0,
      total_collected: totalCollected,
      total_pending: totalPendingAmount,
      recent_payments: recentPayments || []
    };
  }

  /**

   * Create an admin user manually (seeded directly into DB + Supabase Auth)
   */
  async createAdmin(data) {
    const { full_name, email, password, college_id } = data;
    const targetCollegeId = college_id || process.env.DEFAULT_COLLEGE_ID;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw Object.assign(new Error(`Auth Error: ${authError.message}`), { statusCode: 400 });
    }

    const authId = authData.user.id;

    // 2. Insert into `users` table as 'admin'
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          auth_id: authId,
          college_id: targetCollegeId,
          email,
          full_name,
          role: 'admin',
        },
      ])
      .select()
      .single();

    if (userError) {
      await supabase.auth.admin.deleteUser(authId);
      throw Object.assign(new Error(`DB Error: ${userError.message}`), { statusCode: 500 });
    }

    return newUser;
  }
}

module.exports = new AdminService();
