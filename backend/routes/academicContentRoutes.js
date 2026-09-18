const express = require('express');
const router = express.Router();
const academicContentController = require('../controllers/academicContentController');
const {
    authenticateStudent,
    requireActiveAccount
} = require('../modules/auth/middlewares/authV2.middleware');

// All content read routes require authenticated and active student account
router.use(authenticateStudent, requireActiveAccount);

// 1. Full subject content tree (modules + topics, without heavy blocks)
router.get('/:subjectSlug', academicContentController.getContentTree);

// 2. Specific topic editorial reading sheet (sections + blocks)
router.get('/:subjectSlug/:moduleSlug/:topicSlug', academicContentController.getTopicEditorial);

module.exports = router;
