const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { createBug, listBugs, updateBugStatus, deleteBug } = require('../controllers/bugController');

// Soft auth for bug reporting: attach user if token is present, but allow submission without failure if token is absent
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (token) {
        return authMiddleware(req, res, next);
    }
    next();
};

router.post('/', optionalAuth, createBug);
router.get('/', authMiddleware, adminMiddleware, listBugs);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateBugStatus);
router.delete('/:id', authMiddleware, adminMiddleware, deleteBug);

module.exports = router;

