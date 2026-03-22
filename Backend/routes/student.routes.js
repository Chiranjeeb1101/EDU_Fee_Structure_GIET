const router = require('express').Router();
const studentController = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ─── Protected Routes (Requires JWT + 'student' role) ───────────
router.use(authenticate, authorize('student'));

router.get('/dashboard', asyncHandler(studentController.getDashboard));
router.get('/notifications', asyncHandler(studentController.getNotifications));
router.put('/notifications/:id/read', asyncHandler(studentController.markNotificationRead));
router.get('/documents', asyncHandler(studentController.getDocuments));
router.post('/documents', upload.single('file'), asyncHandler(studentController.addDocument));
router.delete('/documents/:id', asyncHandler(studentController.deleteDocument));

module.exports = router;
