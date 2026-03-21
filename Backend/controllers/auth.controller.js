const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  const { full_name, password, personal_email, student_phone, parent_whatsapp, registration_number } = req.body;
  let { college_id_number } = req.body;

  if (!full_name || !college_id_number || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, college_id_number, and password are required.',
    });
  }

  // ── Normalize & Validate College ID ──
  college_id_number = college_id_number.trim().toUpperCase();
  const idRegex = /^[A-Z0-9]+$/;
  if (!idRegex.test(college_id_number) || college_id_number.length < 5 || college_id_number.length > 20) {
    return res.status(400).json({
      success: false,
      message: 'College ID must be 5-20 alphanumeric characters without spaces or special characters.',
    });
  }

  // ── Duplicate College ID Check ──
  const supabase = require('../config/supabase');
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('college_id_number', college_id_number)
    .maybeSingle();
  if (existingStudent) {
    return res.status(409).json({
      success: false,
      message: 'This College ID Number is already registered. Each student can only have one account.',
    });
  }

  // ── Duplicate Email Check (if provided) ──
  if (personal_email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personal_email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    
    // Block disposable domains
    const blockedDomains = ['test.com', 'example.com', 'demo.com', 'fake.com', 'temp.com', 'mailinator.com', 'guerrillamail.com', 'yopmail.com', 'sharklasers.com', 'trashmail.com'];
    const emailDomain = personal_email.trim().split('@')[1]?.toLowerCase();
    if (blockedDomains.includes(emailDomain)) {
      return res.status(400).json({ success: false, message: 'Disposable or demo email addresses are not allowed.' });
    }
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('personal_email', personal_email.trim())
      .maybeSingle();
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email is already linked to another account.',
      });
    }
  }

  // ── Strong Password Validation ──
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one number.' });
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ success: false, message: 'Password must contain at least one special character (!@#$%^&*...).' });
  }

  // ── Phone Number Validation (10 digits) ──
  const phoneDigitsRegex = /^\d{10}$/;
  if (student_phone) {
    const cleanPhone = student_phone.replace(/\D/g, '');
    if (!phoneDigitsRegex.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Student phone must be exactly 10 digits.' });
    }
  }
  if (parent_whatsapp) {
    const cleanWhatsapp = parent_whatsapp.replace(/\D/g, '');
    if (!phoneDigitsRegex.test(cleanWhatsapp)) {
      return res.status(400).json({ success: false, message: 'Parent WhatsApp must be exactly 10 digits.' });
    }
  }

  // ── Full Name Validation ──
  if (full_name.trim().length < 2 || full_name.trim().length > 100) {
    return res.status(400).json({ success: false, message: 'Full name must be between 2 and 100 characters.' });
  }

  // Pass normalized college_id_number to service
  const result = await authService.registerStudent({ ...req.body, college_id_number });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: result,
  });
};

exports.login = async (req, res) => {
  let { college_id_number } = req.body;
  const { password, college_id } = req.body;

  if (!college_id_number || !password) {
    return res.status(400).json({
      success: false,
      message: 'college_id_number and password are required.',
    });
  }

  // Normalize college_id_number (but don't force uppercase if it's an admin email)
  const isEmail = college_id_number.includes('@');
  if (!isEmail) {
    college_id_number = college_id_number.trim().toUpperCase();
  } else {
    college_id_number = college_id_number.trim().toLowerCase();
  }

  try {
    const { token, user } = await authService.login(college_id_number, password, college_id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

/**
 * Register a device token for push notifications
 */
exports.registerDevice = async (req, res) => {
  try {
    const { device_token } = req.body;
    const userId = req.user.id; // from JWT auth middleware

    if (!device_token) {
      return res.status(400).json({ success: false, message: 'Device token required' });
    }

    // Call service to update the user record
    await authService.registerDeviceToken(userId, device_token);

    res.status(200).json({ success: true, message: 'Device registered for notifications' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeProfile = async (req, res) => {
  const { course_type, stream, year, accommodation, academic_year } = req.body;
  const userId = req.user.id; // from auth middleware

  if (!course_type || !stream || !year || !accommodation || !academic_year) {
    return res.status(400).json({
      success: false,
      message: 'course_type, stream, year, accommodation, and academic_year are required.',
    });
  }

  const updatedStudent = await authService.completeProfile(userId, {
    course_type,
    stream,
    year,
    accommodation,
    academic_year,
  });

  res.status(200).json({
    success: true,
    message: 'Profile completed successfully.',
    data: updatedStudent,
  });
};

exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  const profile = await authService.getProfile(userId);

  res.status(200).json({
    success: true,
    data: profile,
  });
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const updatedProfile = await authService.updateProfile(userId, req.body);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: updatedProfile,
  });
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'old_password and new_password are required.' });
    }

    await authService.changePassword(userId, old_password, new_password);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
