const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// ─── All admin routes require authentication and 'admin' role ──
router.use(authenticate, authorize('admin'));

// ─── Fee Structures ─────────────────────────────────────────────
router.post('/fee-structures', asyncHandler(adminController.createFeeStructure));
router.get('/fee-structures', asyncHandler(adminController.getFeeStructures));
router.put('/fee-structures/:id', asyncHandler(adminController.updateFeeStructure));
router.delete('/fee-structures/:id', asyncHandler(adminController.deleteFeeStructure));

// ─── Students ───────────────────────────────────────────────────
router.get('/students', asyncHandler(adminController.getStudents));
router.get('/students/:id', asyncHandler(adminController.getStudentById));
router.put('/students/:id', asyncHandler(adminController.updateStudent));
router.delete('/students/:id', asyncHandler(adminController.deleteStudent));

// ─── Analytics & Payments ─────────────────────────────────────────
router.get('/stats', asyncHandler(adminController.getAdminStats));
router.get('/payments', asyncHandler(adminController.getAllPayments));

// ─── Admin Management ───────────────────────────────────────────
router.post('/users', asyncHandler(adminController.createAdmin));

module.exports = router;
