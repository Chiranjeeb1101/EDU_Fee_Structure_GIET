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

  const result = await authService.login(college_id_number, password, college_id);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: result,
  });
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
