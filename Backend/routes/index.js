const router = require('express').Router();

// ─── Health check ──────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─── Mount feature routes ────────────────────────────────────────────
router.use('/auth',     require('./auth.routes'));
router.use('/admin',    require('./admin.routes'));
router.use('/students', require('./student.routes'));
router.use('/payments', require('./payment.routes'));

module.exports = router;
