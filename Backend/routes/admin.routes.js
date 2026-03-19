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

// ─── Admin Management ───────────────────────────────────────────
router.post('/users', asyncHandler(adminController.createAdmin));

module.exports = router;
