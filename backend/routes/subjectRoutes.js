const express = require('express');
const router = express.Router();
const {
    getSubjectsByBranch,
    getSubjectById,
    markQuestionCompleted
} = require('../controllers/subjectController');
const authMiddleware = require('../middleware/auth');

// All subject routes are protected
router.use(authMiddleware);

router.get('/branch/:branch', getSubjectsByBranch);
router.get('/:subjectId', getSubjectById);
router.post('/question/complete', markQuestionCompleted);

module.exports = router;
