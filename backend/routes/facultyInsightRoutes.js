const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
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

// Soft auth middleware to optionally resolve userId for GET requests without failing if unauthenticated
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior'
      );
      req.userId = decoded.userId || decoded.id || decoded._id;
    } catch (_) {}
  }
  next();
};

// Public / Student Insight Browsing
router.get('/subjects', optionalAuth, getFacultySubjects);
router.get('/', optionalAuth, getFacultyInsights);
router.get('/:facultyId', optionalAuth, getSingleFacultySubjectInsight);
router.get('/:facultyId/:subjectCode', optionalAuth, getSingleFacultySubjectInsight);

// Authenticated Student Feedback Submissions
router.post('/', authMiddleware, submitFeedback);
router.put('/:id', authMiddleware, updateFeedback);

// Admin Configuration & Moderation
router.get('/admin/config', authMiddleware, requireAdmin, getAdminConfig);
router.put('/admin/config', authMiddleware, requireAdmin, updateAdminConfig);
router.patch('/admin/comments/:id/status', authMiddleware, requireAdmin, moderateComment);

module.exports = router;
