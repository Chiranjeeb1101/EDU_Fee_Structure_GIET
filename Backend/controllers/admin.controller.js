const adminService = require('../services/admin.service');

// ─── Fee Structures ─────────────────────────────────────────────

exports.createFeeStructure = async (req, res) => {
  const { course_type, stream, year, accommodation, total_fee, academic_year } = req.body;
  const adminCollegeId = req.user.college_id; // extracted by auth middleware

  if (!course_type || !stream || !year || !accommodation || !total_fee || !academic_year) {
    return res.status(400).json({
      success: false,
      message: 'All fee structure fields are required (course_type, stream, year, accommodation, total_fee, academic_year)',
    });
  }

  const newFee = await adminService.createFeeStructure(adminCollegeId, {
    course_type, stream, year, accommodation, total_fee, academic_year
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
