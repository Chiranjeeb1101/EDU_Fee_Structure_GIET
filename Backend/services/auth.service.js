const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

class AuthService {
  /**
   * Register a new student (Usually done by Admin)
   * We generate a dummy email based on college_id_number because
   * Supabase Auth requires an email, but users will log in via college_id_number.
   */
  async registerStudent(data) {
    const { 
      full_name, college_id_number, password, college_id,
      personal_email, profile_picture, course_type, stream, 
      year, accommodation, student_phone, parent_name, parent_whatsapp
    } = data;
    
    // Default to environment college ID if not provided
    const targetCollegeId = college_id || process.env.DEFAULT_COLLEGE_ID;
    
    // 1. Generate artificial email for Supabase Auth
    const generatedEmail = `${college_id_number}@student.${targetCollegeId}.edu.in`;

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: generatedEmail,
      password: password,
      email_confirm: true, // Auto-confirm
    });

    if (authError) {
      const isDuplicate = authError.message.includes('already registered');
      throw Object.assign(new Error(isDuplicate ? 'College ID Number already registered.' : authError.message), { statusCode: 400 });
    }

    const authId = authData.user.id;

    // 3. Insert into `users` table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          auth_id: authId,
          college_id: targetCollegeId,
          email: generatedEmail,
          personal_email: personal_email || null,
          profile_picture: profile_picture || null,
          full_name,
          role: 'student',
        },
      ])
      .select()
      .single();

    if (userError) {
      // Rollback Auth user if DB insert fails
      await supabase.auth.admin.deleteUser(authId);
      throw Object.assign(new Error(`Failed to create user record: ${userError.message}`), { statusCode: 500 });
    }

    // 4. Insert into `students` table
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert([
        {
          user_id: newUser.id,
          college_id: targetCollegeId,
          college_id_number,
          course_type: course_type || null,
          stream: stream || null,
          year: year ? parseInt(year.toString().replace(/\D/g, ''), 10) : null, // Extract number from "1st Year" if passed
          accommodation: accommodation || null,
          student_phone: student_phone || null,
          parent_name: parent_name || null,
          parent_whatsapp: parent_whatsapp || null,
        },
      ])
      .select()
      .single();

    if (studentError) {
      // Rollback Auth user (cascade should delete `users` row)
      await supabase.auth.admin.deleteUser(authId);
      throw Object.assign(new Error(`Failed to create student record: ${studentError.message}`), { statusCode: 500 });
    }

    return {
      user: newUser,
      student: newStudent,
    };
  }

  /**
   * Login student using college_id_number + password
   */
  async login(college_id_number, password, college_id) {
    const targetCollegeId = college_id || process.env.DEFAULT_COLLEGE_ID;
    
    // 1. Lookup student to ensure they exist and get user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id, profile_complete')
      .eq('college_id_number', college_id_number)
      .eq('college_id', targetCollegeId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Invalid college ID number or password.'), { statusCode: 401 });
    }

    // 2. Fetch artificial email from `users` table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('email, role, full_name')
      .eq('id', student.user_id)
      .single();

    if (userError || !dbUser) {
      throw Object.assign(new Error('User record not found.'), { statusCode: 404 });
    }

    // 3. Authenticate with Supabase Auth using a temporary client
    // We do NOT use the global admin `supabase` client here, because
    // `signInWithPassword` would mutate its session globally for all users!
    const tempClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
      email: dbUser.email,
      password,
    });

    if (authError || !authData.session) {
      throw Object.assign(new Error('Invalid college ID number or password.'), { statusCode: 401 });
    }

    return {
      token: authData.session.access_token,
      user: {
        full_name: dbUser.full_name,
        role: dbUser.role,
        college_id_number,
        profile_complete: student.profile_complete,
      },
    };
  }

  /**
   * First-time profile setup for student
   * Looks up fee structure and updates total_fee/remaining_fee
   */
  async completeProfile(userId, profileData) {
    const { course_type, stream, year, accommodation, academic_year } = profileData;

    // 1. Get the student record for this user
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Student record not found.'), { statusCode: 404 });
    }

    if (student.profile_complete) {
      throw Object.assign(new Error('Profile is already complete.'), { statusCode: 400 });
    }

    // 2. Lookup appropriate fee structure
    const { data: feeStructure, error: feeError } = await supabase
      .from('fee_structures')
      .select('total_fee')
      .eq('college_id', student.college_id)
      .eq('course_type', course_type)
      .eq('stream', stream)
      .eq('year', year)
      .eq('accommodation', accommodation)
      .eq('academic_year', academic_year)
      .single();

    if (feeError || !feeStructure) {
      throw Object.assign(new Error('No matching fee structure found for these details.'), { statusCode: 404 });
    }

    const totalFee = feeStructure.total_fee;

    // 3. Update student record
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        course_type,
        stream,
        year,
        accommodation,
        total_fee: totalFee,
        remaining_fee: totalFee, // Initially, remaining = total
        profile_complete: true,
      })
      .eq('id', student.id)
      .select()
      .single();

    if (updateError) {
      throw Object.assign(new Error(`Failed to update profile: ${updateError.message}`), { statusCode: 500 });
    }

    return updatedStudent;
  }

  /**
   * Get full profile of the authenticated user
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id, full_name, email, role, college_id,
        students (*)
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw Object.assign(new Error('Profile not found.'), { statusCode: 404 });
    }

    return data;
  }

  /**
   * Register a user's device token for push notifications
   */
  async registerDeviceToken(userId, deviceToken) {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: deviceToken }) // Ensure this column is created in the DB!
      .eq('id', userId);

    if (error) {
      console.error('Push token DB error:', error);
      throw new Error('Failed to register device token.');
    }

    return true;
  }

  /**
   * Update profile details for a student
   */
  async updateProfile(userId, updateData) {
    const { 
      full_name, personal_email, profile_picture,
      student_phone, parent_name, parent_whatsapp
    } = updateData;

    // 1. Update `users` table
    const userUpdates = {};
    if (full_name) userUpdates.full_name = full_name;
    if (personal_email !== undefined) userUpdates.personal_email = personal_email;
    if (profile_picture !== undefined) userUpdates.profile_picture = profile_picture;

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) throw Object.assign(new Error(`Failed to update user: ${userError.message}`), { statusCode: 500 });
    }

    // 2. Update `students` table
    const studentUpdates = {};
    if (student_phone !== undefined) studentUpdates.student_phone = student_phone;
    if (parent_name !== undefined) studentUpdates.parent_name = parent_name;
    if (parent_whatsapp !== undefined) studentUpdates.parent_whatsapp = parent_whatsapp;

    if (Object.keys(studentUpdates).length > 0) {
      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdates)
        .eq('user_id', userId);

      if (studentError) throw Object.assign(new Error(`Failed to update student details: ${studentError.message}`), { statusCode: 500 });
    }

    // 3. Return full updated profile
    return this.getProfile(userId);
  }
}

module.exports = new AuthService();
