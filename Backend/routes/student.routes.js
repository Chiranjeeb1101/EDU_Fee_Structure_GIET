const router = require('express').Router();
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// ─── Protected Routes (Requires JWT + 'student' role) ───────────
router.use(authenticate, authorize('student'));

router.get('/dashboard', asyncHandler(studentController.getDashboard));

module.exports = router;
