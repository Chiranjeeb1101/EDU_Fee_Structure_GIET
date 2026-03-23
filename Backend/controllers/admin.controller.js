const adminService = require('../services/admin.service');

// ─── Fee Structures ─────────────────────────────────────────────

exports.createFeeStructure = async (req, res) => {
  const { title, course_type, stream, year, accommodation, total_fee, academic_year } = req.body;
  const adminCollegeId = req.user.college_id; // extracted by auth middleware

  if (!title || !course_type || !stream || !year || !accommodation || !total_fee || !academic_year) {
    return res.status(400).json({
      success: false,
      message: 'All fee structure fields are required (title, course_type, stream, year, accommodation, total_fee, academic_year)',
    });
  }

  const newFee = await adminService.createFeeStructure(adminCollegeId, {
    title, course_type, stream, year, accommodation, total_fee, academic_year
  });

  res.status(201).json({
    success: true,
    message: 'Fee structure created successfully',
    data: newFee,
  });
};

exports.getFeeStructures = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const fees = await adminService.getFeeStructures(adminCollegeId);

  res.status(200).json({
    success: true,
    data: fees,
  });
};

exports.updateFeeStructure = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const adminCollegeId = req.user.college_id;

  const updatedFee = await adminService.updateFeeStructure(adminCollegeId, id, updates);

  res.status(200).json({
    success: true,
    message: 'Fee structure updated successfully',
    data: updatedFee,
  });
};

exports.deleteFeeStructure = async (req, res) => {
  const { id } = req.params;
  const adminCollegeId = req.user.college_id;

  await adminService.deleteFeeStructure(adminCollegeId, id);

  res.status(200).json({
    success: true,
    message: 'Fee structure deleted successfully',
  });
};

// ─── Students ───────────────────────────────────────────────────

exports.getStudents = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const students = await adminService.getStudents(adminCollegeId);

  res.status(200).json({
    success: true,
    data: students,
  });
};

exports.getStudentById = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const { id } = req.params;
  const student = await adminService.getStudentById(adminCollegeId, id);

  res.status(200).json({
    success: true,
    data: student,
  });
};

exports.updateStudent = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const { id } = req.params;
  const updates = req.body;
  
  const updatedStudent = await adminService.updateStudent(adminCollegeId, id, updates);

  res.status(200).json({
    success: true,
    message: 'Student updated successfully',
    data: updatedStudent,
  });
};

exports.deleteStudent = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const { id } = req.params;
  
  await adminService.deleteStudent(adminCollegeId, id);

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully',
  });
};

// ─── Analytics & Payments ─────────────────────────────────────────

exports.getAdminStats = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const adminUserId = req.user.id;
  const stats = await adminService.getAdminStats(adminCollegeId, adminUserId);

  res.status(200).json({
    success: true,
    data: stats,
  });
};

exports.getAllPayments = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const payments = await adminService.getAllPayments(adminCollegeId);

  res.status(200).json({
    success: true,
    data: payments,
  });
};

exports.getFeeMetadata = async (req, res) => {
  const adminCollegeId = req.user.college_id;
  const metadata = await adminService.getFeeMetadata(adminCollegeId);

  res.status(200).json({
    success: true,
    data: metadata,
  });
};

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;
  const notifications = await adminService.getNotifications(userId);

  res.status(200).json({
    success: true,
    data: notifications,
  });
};

// ─── Admins ─────────────────────────────────────────────────────
// Seed endpoint (could be restricted to super-admins in the future)
exports.createAdmin = async (req, res) => {
  const { full_name, email, password } = req.body;
  const adminCollegeId = req.user.college_id; // Seed admin for the same college

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, email, and password are required',
    });
  }

  const newAdmin = await adminService.createAdmin({ full_name, email, password, college_id: adminCollegeId });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: newAdmin,
  });
};
