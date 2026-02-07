const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const {
    updateProfile,
    uploadProfilePicture,
    changePassword,
    upload
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const rateLimit = require('express-rate-limit');

// Rate limiters for password reset
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { error: 'Too many password reset requests. Please try again after an hour.' }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: 'Too many password reset attempts. Please try again after an hour.' }
});

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/switch-branch', authMiddleware, switchBranch);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', authMiddleware, changePassword);

// Admin routes
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
