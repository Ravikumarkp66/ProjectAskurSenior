const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    googleLogin,
    completeGoogleRegistration,
    heartbeat,
    sendOtp,
    verifyOtp,
    updateSemesterTimeline
} = require('../controllers/authController');

const {
    updateProfile,
    uploadProfilePicture,
    changePassword,
    upload
} = require('../controllers/profileController');

const authMiddleware = require('../middleware/auth');
const { requireAdmin, requirePermission, enforceDepartmentScope } = require('../middleware/adminAuth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/admin-google', googleLogin);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/logout', authMiddleware, logoutUser);
router.post('/switch-branch', authMiddleware, switchBranch);
router.post('/complete-google-registration', authMiddleware, completeGoogleRegistration);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', authMiddleware, changePassword);
router.post('/heartbeat', authMiddleware, heartbeat);
router.put('/timeline', authMiddleware, updateSemesterTimeline);

// Admin routes
router.get('/users', authMiddleware, requireAdmin, requirePermission('users.view'), enforceDepartmentScope, getAllUsers);

module.exports = router;
