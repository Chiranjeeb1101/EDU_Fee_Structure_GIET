const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// ─── Public Routes ─────────
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// ─── Protected Routes ──────
router.post('/complete-profile', authenticate, asyncHandler(authController.completeProfile));
router.get('/profile', authenticate, asyncHandler(authController.getProfile));

module.exports = router;
