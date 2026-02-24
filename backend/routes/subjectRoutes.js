const express = require('express');
const router = express.Router();
const {
    getSubjectsByBranch,
    getSubjectById,
    getSubjectsByCode,
    markQuestionCompleted,
    getModuleNotes,
    getContentUrl,
    getSubjectContent
} = require('../controllers/subjectController');
const authMiddleware = require('../middleware/auth');

// Public routes (Guest access allowed for calculator/browsing)
router.get('/branch/:branch', getSubjectsByBranch);
router.get('/code/:code', getSubjectsByCode);
router.get('/:subjectId', getSubjectById);

// All subsequent routes require authentication
router.use(authMiddleware);

router.post('/question/complete', markQuestionCompleted);

// Get notes URL for a specific module (returns signed URL for PDF preview) - Legacy
router.get('/:subjectId/module/:moduleNumber/notes', getModuleNotes);

// New routes for organized content
router.get('/:subjectId/content', getSubjectContent);
router.get('/:subjectId/content/:contentType/:contentId', getContentUrl);
router.get('/:subjectId/module/:moduleNumber/content/:contentType/:contentId', getContentUrl);

module.exports = router;
