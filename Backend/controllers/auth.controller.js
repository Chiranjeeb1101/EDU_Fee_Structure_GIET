const authService = require('../services/auth.service');

exports.register = async (req, res) => {
  const { full_name, college_id_number, password, college_id } = req.body;

  if (!full_name || !college_id_number || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, college_id_number, and password are required.',
    });
  }

  const result = await authService.registerStudent({
    full_name,
    college_id_number,
    password,
    college_id,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: result,
  });
};

exports.login = async (req, res) => {
  const { college_id_number, password, college_id } = req.body;

  if (!college_id_number || !password) {
    return res.status(400).json({
      success: false,
      message: 'college_id_number and password are required.',
    });
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
