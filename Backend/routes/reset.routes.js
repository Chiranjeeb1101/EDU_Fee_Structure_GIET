const router = require('express').Router();
const resetController = require('../controllers/reset.controller');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// ─── Public: Student Requests Reset ───────────────────────────
router.post('/request', asyncHandler(resetController.requestReset));

// ─── Public: Student Set New Password (after approval) ────────
router.post('/finalize', asyncHandler(resetController.finalizeReset));

// ─── Admin Only: Fetch & Update Requests ──────────────────────
router.get('/pending', authenticate, authorize('admin'), asyncHandler(resetController.getPendingRequests));
router.post('/status', authenticate, authorize('admin'), asyncHandler(resetController.approveOrReject));

module.exports = router;
