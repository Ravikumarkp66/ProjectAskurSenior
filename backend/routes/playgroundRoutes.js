const express = require('express');
const router = express.Router();
const playgroundController = require('../controllers/playgroundController');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Optional auth middleware for read operations
const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.userId) {
                req.userId = decoded.userId;
            }
        }
    } catch (e) {
        // Proceed unauthenticated
    }
    next();
};

// Curriculum tree
router.get('/tree', optionalAuth, playgroundController.getPlaygroundTree);

// Student progress
router.get('/progress', optionalAuth, playgroundController.getStudentProgress);

// Problem details and language starter code
router.get('/problems/:slugOrId', optionalAuth, playgroundController.getProblemDetails);

// Public sample test cases
router.get('/problems/:slugOrId/testcases', optionalAuth, playgroundController.getProblemTestCases);

// Editorial (or honest empty state)
router.get('/problems/:slugOrId/editorial', optionalAuth, playgroundController.getProblemEditorial);

// Discussions
router.get('/problems/:slugOrId/discussions', optionalAuth, playgroundController.getProblemDiscussions);
router.post('/problems/:slugOrId/discussions', authMiddleware, playgroundController.postDiscussion);
router.post('/discussions/:id/upvote', authMiddleware, playgroundController.toggleUpvoteDiscussion);

// Submissions
router.get('/problems/:slugOrId/submissions', optionalAuth, playgroundController.getProblemSubmissions);
router.post('/problems/:slugOrId/submit', authMiddleware, playgroundController.submitProblem);

// Code Execution (Milestone 3 Docker Runner)
router.post('/execute', optionalAuth, playgroundController.executeCode);

// Problem Test Cases Evaluation (Milestone 5)
router.post('/problems/:slugOrId/evaluate', optionalAuth, playgroundController.evaluateProblem);

module.exports = router;
