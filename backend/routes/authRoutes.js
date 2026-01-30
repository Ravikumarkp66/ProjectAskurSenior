const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/switch-branch', authMiddleware, switchBranch);

// Admin routes
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
