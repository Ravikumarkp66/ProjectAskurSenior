const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    googleLogin,
    completeGoogleRegistration,
    discordCallback,
    heartbeat
} = require('../controllers/authController');


const {
    updateProfile,
    uploadProfilePicture,
    changePassword,
    upload
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.post('/google', googleLogin);
router.get('/discord/callback', discordCallback);

// Protected routes
router.get('/profile', authMiddleware, getUserProfile);
router.post('/switch-branch', authMiddleware, switchBranch);
router.post('/complete-google-registration', authMiddleware, completeGoogleRegistration);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.put('/change-password', authMiddleware, changePassword);
router.post('/heartbeat', authMiddleware, heartbeat);

// Admin routes
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
