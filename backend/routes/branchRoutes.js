const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
    getPublicBranches,
    getAdminBranches,
    createBranch,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');

// Public endpoints
router.get('/public', getPublicBranches);

// Admin-only endpoints
router.get('/admin', authMiddleware, adminMiddleware, getAdminBranches);
router.post('/admin', authMiddleware, adminMiddleware, createBranch);
router.put('/admin/:id', authMiddleware, adminMiddleware, updateBranch);
router.delete('/admin/:id', authMiddleware, adminMiddleware, deleteBranch);

module.exports = router;
