const authService = require('../services/authService');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');
const usnParser = require('../modules/auth/utils/usnParser');

const ADMIN_EMAILS = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase())
    : [];
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
    try {
        const { usn, email, password, branch } = req.body;
        const { user, token } = await authService.registerStudent({ usn, email, password, branch });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { usn, password, branch } = req.body;
        const { user, student, token } = await authService.loginStudent({ usn, password, branch });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: true,
                onboardingCompleted: student ? !!student.onboardingCompleted : true,
                registrationStatus: student ? student.registrationStatus : 'completed'
            }
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail, isAdmin: true });

        if (!user) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, true);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                usn: user.usn,
                branch: user.branch,
                isAdmin: true
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const switchBranch = async (req, res) => {
    try {
        const { newBranch } = req.body;
        if (!newBranch) {
            return res.status(400).json({ error: 'New branch is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.currentBranch = newBranch;
        await user.save();

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Branch switched successfully',
            token,
            currentBranch: user.currentBranch
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Google authorization token is required.' });
        }

        let payload;

        // 1. Attempt ID token verification
        try {
            if (process.env.GOOGLE_CLIENT_ID) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: token,
                    audience: process.env.GOOGLE_CLIENT_ID
                });
                payload = ticket.getPayload();
            }
        } catch (idTokenErr) {
            // ID Token verification skipped/failed - token may be an OAuth2 access_token
        }

        // 2. Fallback to Google UserInfo endpoint for OAuth2 Access Tokens
        if (!payload) {
            try {
                const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                payload = {
                    email: response.data.email,
                    email_verified: response.data.email_verified,
                    sub: response.data.sub,
                    picture: response.data.picture,
                    name: response.data.name
                };
            } catch (userInfoErr) {
                console.error('Google userinfo fetch failed:', userInfoErr.response?.data || userInfoErr.message);
                return res.status(401).json({ error: 'Invalid or expired Google authorization token.' });
            }
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Unable to retrieve valid Google user profile.' });
        }

        const email = payload.email.toLowerCase();

        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                email,
                name: payload.name || email.split('@')[0],
                authProvider: 'google',
                googleId: payload.sub,
                registrationComplete: false
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = payload.sub;
            user.authProvider = 'google';
            await user.save();
        }

        const authToken = authService.generateToken(user._id, user.branch || 'CS', user.currentBranch || 'CS', user.isAdmin);
        return res.json({
            token: authToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name || user.email.split('@')[0],
                registrationComplete: user.registrationComplete
            }
        });
    } catch (error) {
        console.error('googleLogin server error:', error);
        return res.status(500).json({ error: error.message || 'Google authentication error' });
    }
};

const completeGoogleRegistration = async (req, res) => {
    try {
        const { usn, branch } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.usn = usn.toUpperCase();
        user.branch = branch;
        user.currentBranch = branch;
        user.registrationComplete = true;
        await user.save();

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);
        res.json({ message: 'Registration completed', token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const heartbeat = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, { lastActiveAt: new Date() });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await OTP.create({ email: email.toLowerCase(), otp: otpCode, expiresAt });
        await sendEmail({ email, subject: 'Your OTP Code', message: `Your OTP code is: ${otpCode}` });
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp }).sort({ createdAt: -1 });

        if (!otpRecord || (otpRecord.expiresAt && otpRecord.expiresAt < new Date())) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const token = authService.generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);
        res.json({ success: true, token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSemesterTimeline = async (req, res) => {
    try {
        res.json({ success: true, message: 'Timeline updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    switchBranch,
    googleLogin,
    completeGoogleRegistration,
    heartbeat,
    ADMIN_EMAILS,
    sendOtp,
    verifyOtp,
    updateSemesterTimeline
};
