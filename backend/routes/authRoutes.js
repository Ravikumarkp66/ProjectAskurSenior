const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    switchBranch
} = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/switch-branch', authMiddleware, switchBranch);

module.exports = router;
