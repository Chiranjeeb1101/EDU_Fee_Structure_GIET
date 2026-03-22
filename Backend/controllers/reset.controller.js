const resetService = require('../services/reset.service');

/**
 * Reset Controller
 */
const requestReset = async (req, res) => {
  const { college_id_number } = req.body;
  
  if (!college_id_number) {
    return res.status(400).json({ success: false, message: 'College ID is required.' });
  }

  const result = await resetService.createRequest(college_id_number.toUpperCase());
  
  res.status(201).json({
    success: true,
    message: result.alreadyExists ? 'Request status checked.' : `Request sent. Please contact GIET Admin for approval for student: ${result.student_name}`,
    data: result.request,
    alreadyExists: result.alreadyExists
  });
};

const getPendingRequests = async (req, res) => {
  const admin_college_id = req.user.college_id; 
  const requests = await resetService.getPendingRequests(admin_college_id);
  
  res.status(200).json({
    success: true,
    data: requests
  });
};

const approveOrReject = async (req, res) => {
  const { id, status } = req.body; // status: 'approved' or 'rejected'
  const admin_id = req.user.id;

  if (!id || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid ID or status.' });
  }

  const updated = await resetService.updateStatus(id, status, admin_id);

  res.status(200).json({
    success: true,
    message: `Request ${status} successfully.`,
    data: updated
  });
};

const finalizeReset = async (req, res) => {
   const { requestId, newPassword } = req.body;

   if (!requestId || !newPassword || newPassword.length < 8) {
       return res.status(400).json({ success: false, message: 'Invalid data or password too short.' });
   }

   await resetService.finalizeReset(requestId, newPassword);

   res.status(200).json({
       success: true,
       message: 'Password reset successfully. You can now login with your new password.'
   });
};

module.exports = {
  requestReset,
  getPendingRequests,
  approveOrReject,
  finalizeReset
};
