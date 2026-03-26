const supabase = require('../config/supabase');

class AdminService {
  /**
   * Create a new fee structure and sync affected students
   */
  async createFeeStructure(adminCollegeId, data) {
    const { title, course_type, stream, year, accommodation, total_fee, academic_year } = data;

    const { data: newFee, error } = await supabase
      .from('fee_structures')
      .insert([
        {
          college_id: adminCollegeId,
          title,
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
        throw Object.assign(new Error('A fee structure with this title already exists for these parameters.'), { statusCode: 409 });
      }
      throw Object.assign(new Error(`Failed to create fee structure: ${error.message}`), { statusCode: 500 });
    }

    // Trigger sync for matching students
    await this.syncStudentFees(adminCollegeId, { course_type, stream, year, accommodation });

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
   * Update an existing fee structure and sync affected students
   */
  async updateFeeStructure(adminCollegeId, feeId, updates) {
    // We need old data to know who to sync
    const { data: oldFee } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('id', feeId)
      .single();

    const { data, error } = await supabase
      .from('fee_structures')
      .update(updates)
      .eq('id', feeId)
      .eq('college_id', adminCollegeId)
      .select()
      .single();

    if (error) {
      throw Object.assign(new Error(`Failed to update fee structure: ${error.message}`), { statusCode: 500 });
    }

    if (!data) {
      throw Object.assign(new Error('Fee structure not found or unauthorized.'), { statusCode: 404 });
    }

    // Sync students for both old and new criteria (if they changed)
    await this.syncStudentFees(adminCollegeId, { 
      course_type: data.course_type, 
      stream: data.stream, 
      year: data.year, 
      accommodation: data.accommodation 
    });
    
    if (oldFee && (oldFee.course_type !== data.course_type || oldFee.stream !== data.stream || oldFee.year !== data.year || oldFee.accommodation !== data.accommodation)) {
      await this.syncStudentFees(adminCollegeId, { 
        course_type: oldFee.course_type, 
        stream: oldFee.stream, 
        year: oldFee.year, 
        accommodation: oldFee.accommodation 
      });
    }

    return data;
  }

  /**
   * Delete a fee structure and sync affected students
   */
  async deleteFeeStructure(adminCollegeId, feeId) {
    const { data: feeToDelete } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('id', feeId)
      .single();

    const { data, error } = await supabase
      .from('fee_structures')
      .delete()
      .eq('id', feeId)
      .eq('college_id', adminCollegeId)
      .select()
      .single();

    if (error) {
      throw Object.assign(new Error(`Failed to delete fee structure: ${error.message}`), { statusCode: 500 });
    }

    if (!data) {
      throw Object.assign(new Error('Fee structure not found or unauthorized.'), { statusCode: 404 });
    }

    if (feeToDelete) {
      await this.syncStudentFees(adminCollegeId, { 
        course_type: feeToDelete.course_type, 
        stream: feeToDelete.stream, 
        year: feeToDelete.year, 
        accommodation: feeToDelete.accommodation 
      });
    }

    return true;
  }

  /**
   * Recalculates total_fee and remaining_fee for students matching specific criteria
   */
  async syncStudentFees(adminCollegeId, criteria) {
    const { course_type, stream, year } = criteria;

    // 1. Get all students matching the basic criteria
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, accommodation, paid_fee')
      .eq('college_id', adminCollegeId)
      .eq('course_type', course_type)
      .eq('stream', stream)
      .eq('year', year);

    if (studentError) {
      console.error('Error fetching students for sync:', studentError);
      return;
    }

    if (!students || students.length === 0) return;

    // 2. For each student, find all applicable fee items and sum them
    for (const student of students) {
      const { data: applicableFees, error: feeError } = await supabase
        .from('fee_structures')
        .select('total_fee')
        .eq('college_id', adminCollegeId)
        .eq('course_type', course_type)
        .eq('stream', stream)
        .eq('year', year)
        .or(`accommodation.eq.${student.accommodation},accommodation.eq.both`);

      if (feeError) {
        console.error(`Error fetching fees for student ${student.id}:`, feeError);
        continue;
      }

      const totalFee = (applicableFees || []).reduce((sum, f) => sum + Number(f.total_fee), 0);
      const remainingFee = totalFee - Number(student.paid_fee);

      // Only update and notify if total_fee actually changed
      const { data: currentStudent } = await supabase.from('students').select('total_fee, user_id').eq('id', student.id).single();
      
      if (currentStudent && Number(currentStudent.total_fee) !== totalFee) {
        await supabase
          .from('students')
          .update({
            total_fee: totalFee,
            remaining_fee: remainingFee
          })
          .eq('id', student.id);

        // Notify student
        await this.createNotification(
          currentStudent.user_id,
          'Fee Structure Updated',
          `Your total fee for ${course_type} ${stream} Year ${year} has been updated to ₹${totalFee.toLocaleString()}.`,
          'info'
        );
      }
    }
  }

  /**
   * Get metadata for fee creation (existing courses, streams, years)
   */
  async getFeeMetadata(adminCollegeId) {
    const { data, error } = await supabase
      .from('students')
      .select('course_type, stream, year')
      .eq('college_id', adminCollegeId);

    if (error) throw error;

    const metadata = {
      courses: [...new Set(data.map(item => item.course_type))].filter(Boolean),
      streams: [...new Set(data.map(item => item.stream))].filter(Boolean),
      years: [1, 2, 3, 4]
    };

    return metadata;
  }

  /**
   * Notification methods
   */
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createNotification(userId, title, message, type = 'info') {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, title, message, type }])
      .select()
      .single();

    if (error) throw error;
    return data;
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
   * Update student details (and linked user details)
   */
  async updateStudent(adminCollegeId, studentId, updates) {
    const { full_name, personal_email, ...studentUpdates } = updates;

    // 1. Fetch current student state for comparison
    const { data: currentStudent, error: fetchError } = await supabase
      .from('students')
      .select('total_fee, paid_fee, remaining_fee, user_id, users(full_name, personal_email)')
      .eq('id', studentId)
      .single();

    if (fetchError || !currentStudent) {
      throw Object.assign(new Error('Student not found.'), { statusCode: 404 });
    }

    // 2. Handle User Profile Updates
    if (full_name || personal_email) {
      const userUpdates = {};
      let profileChanged = false;

      if (full_name && full_name !== currentStudent.users?.full_name) {
        userUpdates.full_name = full_name;
        profileChanged = true;
      }
      if (personal_email && personal_email !== currentStudent.users?.personal_email) {
        userUpdates.personal_email = personal_email;
        profileChanged = true;
      }

      if (profileChanged) {
        await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', currentStudent.user_id);

        // Notify student about profile update (non-critical)
        try {
          await this.createNotification(
            currentStudent.user_id,
            'Profile Updated',
            'Admin has updated your profile details (Name/Email).',
            'info'
          );
        } catch (err) {
          console.warn('⚠️  Notification failed for profile update:', err.message);
        }
      }
    }

    // 3. Handle Fee Updates
    let feeChanged = false;
    const currentTotal = Number(currentStudent.total_fee) || 0;
    const currentRemaining = Number(currentStudent.remaining_fee) || 0;
    const paid = Number(currentStudent.paid_fee) || 0;

    if (studentUpdates.total_fee !== undefined || studentUpdates.remaining_fee !== undefined) {
      if (studentUpdates.total_fee !== undefined && studentUpdates.remaining_fee === undefined) {
        // Admin updated Total, we auto-calculate Remaining
        const total = parseFloat(studentUpdates.total_fee) || 0;
        if (total !== currentTotal) {
          feeChanged = true;
          studentUpdates.remaining_fee = Math.max(0, total - paid);
        }
      } else if (studentUpdates.remaining_fee !== undefined && studentUpdates.total_fee === undefined) {
        // Admin updated Remaining, we auto-calculate Total
        const remaining = parseFloat(studentUpdates.remaining_fee) || 0;
        if (remaining !== currentRemaining) {
          feeChanged = true;
          studentUpdates.total_fee = paid + remaining;
        }
      } else if (studentUpdates.total_fee !== undefined && studentUpdates.remaining_fee !== undefined) {
        // Admin updated both
        const total = parseFloat(studentUpdates.total_fee) || 0;
        const remaining = parseFloat(studentUpdates.remaining_fee) || 0;
        if (total !== currentTotal || remaining !== currentRemaining) {
          feeChanged = true;
        }
      }

      if (feeChanged) {
        // Notify student about fee update (non-critical)
        try {
          await this.createNotification(
            currentStudent.user_id,
            'Fees Updated',
            `Admin has updated your fee details. New Total: ₹${Number(studentUpdates.total_fee).toLocaleString()}`,
            'warning'
          );
        } catch (err) {
          console.warn('⚠️  Notification failed for fee update:', err.message);
        }
      }
    }

    // 4. Update the students table
    const { data, error } = await supabase
      .from('students')
      .update(studentUpdates)
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
   * Get KPI Stats for Dashboard & Detailed Analytics
   */
  async getAdminStats(adminCollegeId, adminUserId) {
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
      .select('amount, status, created_at, students(stream)')
      .eq('college_id', adminCollegeId);

    let totalCollected = 0;
    const statusDistribution = { success: 0, pending: 0, failed: 0 };
    const streamMap = {};
    const monthlyMap = {};

    if (payments) {
      payments.forEach(p => {
        const isSuccess = ['success', 'paid', 'captured'].includes(p.status);
        
        // Status Distribution
        if (isSuccess) statusDistribution.success++;
        else if (['failed', 'error'].includes(p.status)) statusDistribution.failed++;
        else statusDistribution.pending++;

        if (isSuccess) {
          const amt = Number(p.amount);
          totalCollected += amt;

          // Stream Breakdown
          const stream = p.students?.stream || 'Other';
          streamMap[stream] = (streamMap[stream] || 0) + amt;

          // Monthly Trend
          const date = new Date(p.created_at);
          const monthKey = date.toLocaleString('default', { month: 'short' }); // e.g., 'Jan'
          monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amt;
        }
      });
    }

    const { data: students } = await supabase
      .from('students')
      .select('remaining_fee, total_fee')
      .eq('college_id', adminCollegeId);

    let totalPendingAmount = 0;
    if (students) {
      totalPendingAmount = students.reduce((sum, s) => sum + Number(s.remaining_fee), 0);
    }

    const collectionByStream = Object.keys(streamMap).map(name => ({
      name,
      amount: streamMap[name],
    }));

    const monthlyRevenue = Object.keys(monthlyMap).map(month => ({
      month,
      amount: monthlyMap[month],
    }));

    const { data: recentPayments } = await supabase
      .from('payments')
      .select('*, students(users(full_name))')
      .eq('college_id', adminCollegeId)
      .order('created_at', { ascending: false })
      .limit(5);

    const { count: pendingResetsCount } = await supabase
      .from('password_reset_requests')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', adminCollegeId)
      .eq('status', 'pending');

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', adminUserId)
      .eq('is_read', false);

    return {
      total_students: totalStudents || 0,
      active_fee_structures: activeFeeStructures || 0,
      total_collected: totalCollected,
      total_pending: totalPendingAmount,
      recent_payments: recentPayments || [],
      collection_by_stream: collectionByStream,
      monthly_revenue: monthlyRevenue,
      status_distribution: statusDistribution,
      pending_resets_count: pendingResetsCount || 0,
      unread_notifications_count: unreadCount || 0
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
