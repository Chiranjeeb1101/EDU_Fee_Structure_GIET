const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');

class AuthService {
  /**
   * Internal helper to normalize academic fields for DB matching.
   */
  normalizeAcademicDetails(course_type, stream, year, accommodation) {
    const normalizedYear = year ? parseInt(year.toString().replace(/\D/g, ''), 10) : null;
    let normalizedAccommodation = accommodation ? accommodation.toLowerCase().trim() : null;
    
    // Map common spelling variations to DB enum: 'hosteler', 'day_scholar'
    if (normalizedAccommodation) {
      if (normalizedAccommodation.includes('hosteller') || normalizedAccommodation === 'hostel') {
        normalizedAccommodation = 'hosteler';
      } else if (normalizedAccommodation.includes('day-scholar') || normalizedAccommodation === 'day scholar') {
        normalizedAccommodation = 'day_scholar';
      }
    }

    return {
      course_type: course_type?.trim(),
      stream: stream?.trim(),
      year: normalizedYear,
      accommodation: normalizedAccommodation
    };
  }

  /**
   * Register a new student (Usually done by Admin)
   * We generate a dummy email based on college_id_number because
   * Supabase Auth requires an email, but users will log in via college_id_number.
   */
  async registerStudent(data) {
    const { 
      full_name, college_id_number, password, college_id,
      personal_email, profile_picture, course_type, stream, 
      year, accommodation, student_phone, parent_name, parent_whatsapp,
      registration_number
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
          registration_number: registration_number || null,
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
      await supabase.auth.admin.deleteUser(authId);
      throw Object.assign(new Error(`Failed to create student record: ${studentError.message}`), { statusCode: 500 });
    }

    // 5. Automatically Sync Fees if details are provided
    if (course_type && stream && year && accommodation) {
      const normalized = this.normalizeAcademicDetails(course_type, stream, year, accommodation);
      
      // Select ALL matching components for this student (e.g. Tuition + Hostel)
      const { data: feeComponents } = await supabase
        .from('fee_structures')
        .select('total_fee')
        .eq('college_id', targetCollegeId)
        .eq('course_type', normalized.course_type)
        .eq('stream', normalized.stream)
        .eq('year', normalized.year)
        .eq('accommodation', normalized.accommodation);

      if (feeComponents && feeComponents.length > 0) {
        const totalFee = feeComponents.reduce((sum, item) => sum + Number(item.total_fee), 0);
        
        await supabase
          .from('students')
          .update({ 
            total_fee: totalFee, 
            remaining_fee: totalFee,
            profile_complete: true 
          })
          .eq('id', newStudent.id);
        
        // Update the local object for response
        newStudent.total_fee = totalFee;
        newStudent.remaining_fee = totalFee;
        newStudent.profile_complete = true;
      }
    }

    // 6. Generate Token for the new user (Self-Login)
    const tempClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: signInData } = await tempClient.auth.signInWithPassword({
      email: generatedEmail,
      password: password,
    });

    return {
      token: signInData?.session?.access_token || null,
      user: {
        ...newUser,
        college_id_number, // Include this for frontend mapping
        profile_complete: newStudent.profile_complete,
      },
      student: newStudent,
    };
  }

  /**
   * Login student using college_id_number + password
   * Or login admin using email + password
   */
  async login(college_id_number, password, college_id) {
    const targetCollegeId = college_id || process.env.DEFAULT_COLLEGE_ID;
    const isEmail = college_id_number.includes('@');

    // ── Admin login path (email-based) ──────────────────────────
    if (isEmail) {
      // Look up admin user by email
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, email, role, full_name, college_id')
        .eq('email', college_id_number)
        .eq('role', 'admin')
        .single();

      if (adminError || !adminUser) {
        throw Object.assign(new Error('Invalid college ID number or password.'), { statusCode: 401 });
      }

      // Authenticate with Supabase Auth
      const tempClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data: authData, error: authError } = await tempClient.auth.signInWithPassword({
        email: adminUser.email,
        password,
      });

      if (authError || !authData.session) {
        throw Object.assign(new Error('Invalid college ID number or password.'), { statusCode: 401 });
      }

      return {
        token: authData.session.access_token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role,
          college_id_number: adminUser.email,
          college_id: adminUser.college_id,
          profile_picture: adminUser.profile_picture,
          profile_complete: true,
        },
      };
    }

    // ── Student login path (college_id_number) ──────────────────
    // 1. Lookup student to ensure they exist and get user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id, profile_complete, student_phone, stream, course_type, accommodation, year, registration_number')
      .eq('college_id_number', college_id_number)
      .eq('college_id', targetCollegeId)
      .single();

    if (studentError || !student) {
      throw Object.assign(new Error('Invalid college ID number or password.'), { statusCode: 401 });
    }

    // 2. Fetch artificial email from `users` table
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name, profile_picture, personal_email')
      .eq('id', student.user_id)
      .single();

    if (userError || !dbUser) {
      throw Object.assign(new Error('User record not found.'), { statusCode: 404 });
    }

    // 3. Authenticate with Supabase Auth using a temporary client
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
        id: dbUser.id,
        email: dbUser.email,
        full_name: dbUser.full_name,
        role: dbUser.role,
        college_id_number,
        profile_picture: dbUser.profile_picture,
        profile_complete: student.profile_complete,
        personal_email: student.personal_email || dbUser.personal_email,
        student_phone: student.student_phone,
        stream: student.stream,
        course_type: student.course_type,
        accommodation: student.accommodation,
        year: student.year,
        registration_number: student.registration_number,
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

    // 2. Lookup appropriate fee structure components
    const normalized = this.normalizeAcademicDetails(course_type, stream, year, accommodation);
    
    const { data: feeComponents, error: feeError } = await supabase
      .from('fee_structures')
      .select('total_fee')
      .eq('college_id', student.college_id)
      .eq('course_type', normalized.course_type)
      .eq('stream', normalized.stream)
      .eq('year', normalized.year)
      .eq('accommodation', normalized.accommodation)
      .eq('academic_year', academic_year);

    if (feeError || !feeComponents || feeComponents.length === 0) {
      throw Object.assign(new Error('No matching fee structure found for these details.'), { statusCode: 404 });
    }

    const totalFee = feeComponents.reduce((sum, item) => sum + Number(item.total_fee), 0);

    // 3. Update student record
    const { data: updatedStudent, error: updateError } = await supabase
      .from('students')
      .update({
        course_type: normalized.course_type,
        stream: normalized.stream,
        year: normalized.year,
        accommodation: normalized.accommodation,
        total_fee: totalFee,
        remaining_fee: totalFee,
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
        profile_picture, personal_email, fcm_token,
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
      registration_number, student_phone, parent_name, parent_whatsapp
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
    if (registration_number !== undefined) studentUpdates.registration_number = registration_number;
    if (student_phone !== undefined) studentUpdates.student_phone = student_phone;
    if (parent_name !== undefined) studentUpdates.parent_name = parent_name;
    if (parent_whatsapp !== undefined) studentUpdates.parent_whatsapp = parent_whatsapp;

    if (Object.keys(studentUpdates).length > 0) {
      // Fetch current student for "profile_complete" check
      const { data: currentStudent } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (currentStudent) {
        // Evaluate completeness: use existing values as fallback for missing fields in current update
        const finalReg = studentUpdates.registration_number ?? currentStudent.registration_number;
        const finalPhone = studentUpdates.student_phone ?? currentStudent.student_phone;
        const finalPName = studentUpdates.parent_name ?? currentStudent.parent_name;
        const finalPWa = studentUpdates.parent_whatsapp ?? currentStudent.parent_whatsapp;

        if (finalReg && finalPhone && finalPName && finalPWa) {
          studentUpdates.profile_complete = true;
          console.log(`✅ Profile completed for user: ${userId}`);
        }
      }

      const { error: studentError } = await supabase
        .from('students')
        .update(studentUpdates)
        .eq('user_id', userId);

      if (studentError) throw Object.assign(new Error(`Failed to update student details: ${studentError.message}`), { statusCode: 500 });
    }

    // 3. Return full updated profile
    return this.getProfile(userId);
  }
  
  /**
   * Change password for the authenticated user
   */
  async changePassword(userId, oldPassword, newPassword) {
    // 1. Get the user email + auth_id from the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, auth_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    }

    // 2. Verify old password by attempting a sign-in
    const tempClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error: signInError } = await tempClient.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      throw Object.assign(new Error('Invalid old password.'), { statusCode: 401 });
    }

    // 3. Update the password in Supabase Auth using admin client
    const { error: authError } = await supabase.auth.admin.updateUserById(
      user.auth_id,
      { password: newPassword }
    );

    if (authError) {
      throw Object.assign(new Error(`Failed to update password: ${authError.message}`), { statusCode: 500 });
    }

    return true;
  }
}

module.exports = new AuthService();
