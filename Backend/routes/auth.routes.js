const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

// ─── Public Routes (rate-limited + validated) ──────────────────
router.post(
  '/register',
  authLimiter,
  validate({ body: ['full_name', 'college_id_number', 'password'] }),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  authLimiter,
  validate({ body: ['college_id_number', 'password'] }),
  asyncHandler(authController.login)
);

// ─── Protected Routes ──────────────────────────────────────────
router.post(
  '/complete-profile',
  authenticate,
  validate({ body: ['course_type', 'stream', 'year', 'accommodation', 'academic_year'] }),
  asyncHandler(authController.completeProfile)
);

router.post(
  '/register-device',
  authenticate,
  validate({ body: ['device_token'] }),
  asyncHandler(authController.registerDevice)
);

router.get('/profile', authenticate, asyncHandler(authController.getProfile));

module.exports = router;
