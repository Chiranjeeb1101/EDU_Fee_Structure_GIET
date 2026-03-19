const studentService = require('../services/student.service');

exports.getDashboard = async (req, res) => {
  // `req.user.id` is the `id` from the `users` table, populated by our auth middleware
  const userId = req.user.id;

  const dashboardData = await studentService.getDashboardData(userId);

  res.status(200).json({
    success: true,
    data: dashboardData,
  });
};
