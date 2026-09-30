const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { requirePlusAccess } = require('../middleware/plusAccess');
const {
  getFacultySubjects,
  getFacultyInsights,
  getSingleFacultySubjectInsight,
  submitFeedback,
  updateFeedback,
  getAdminConfig,
  updateAdminConfig,
  moderateComment,
} = require('../controllers/facultyInsightController');

// Plus-Protected Student Insight Browsing (Database access restricted to Plus members)
router.get('/subjects', authMiddleware, requirePlusAccess, getFacultySubjects);
router.get('/', authMiddleware, requirePlusAccess, getFacultyInsights);
router.get('/:facultyId', authMiddleware, requirePlusAccess, getSingleFacultySubjectInsight);
router.get('/:facultyId/:subjectCode', authMiddleware, requirePlusAccess, getSingleFacultySubjectInsight);

// Plus-Protected Student Feedback Submissions
router.post('/', authMiddleware, requirePlusAccess, submitFeedback);
router.put('/:id', authMiddleware, requirePlusAccess, updateFeedback);

// Admin Configuration & Moderation
router.get('/admin/config', authMiddleware, requireAdmin, getAdminConfig);
router.put('/admin/config', authMiddleware, requireAdmin, updateAdminConfig);
router.patch('/admin/comments/:id/status', authMiddleware, requireAdmin, moderateComment);

module.exports = router;
