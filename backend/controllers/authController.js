const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getPresignedUrl } = require('../utils/s3');

// Admin emails that should automatically get admin access
const ADMIN_EMAILS = ['mreduactor4566@gmail.com'];

const generateToken = (userId, branch, currentBranch, isAdmin, tokenVersion = 0) => {
    return jwt.sign({
        userId,
        branch,
        currentBranch,
        isAdmin: !!isAdmin,
        tokenVersion
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

const registerUser = async (req, res) => {
    try {
        const { usn, email, password, branch } = req.body;

        // Validate required fields
        if (!usn || !email || !password || !branch) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ usn }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Check if email should be auto-admin
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());

        // Create new user
        const user = new User({
            usn: usn.toUpperCase(),
            email: email.toLowerCase(),
            password,
            branch,
            currentBranch: branch,
            isAdmin: isAdminEmail
        });

        await user.save();

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: await getPresignedUrl(user.profilePicture)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { usn, password, branch } = req.body;

        // Validate required fields
        if (!usn || !password || !branch) {
            return res.status(400).json({ error: 'USN, password, and branch are required' });
        }

        // Find user by USN
        const user = await User.findOne({ usn: usn.toUpperCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update current branch if different
        if (user.currentBranch !== branch) {
            user.currentBranch = branch;
            await user.save();
        }

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: await getPresignedUrl(user.profilePicture)
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

        const userObj = user.toObject();
        userObj.profilePicture = await getPresignedUrl(user.profilePicture);
        res.json(userObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getAllUsers = async (req, res) => {
    try {
        console.log('Getting all users for admin...');
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`Found ${users.length} users`);
        res.json({
            users: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: error.message });
    }
};
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Auto-promote admin emails if not already admin
        const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
        if (isAdminEmail && !user.isAdmin) {
            user.isAdmin = true;
            await user.save();
        }

        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: true,
                profilePicture: await getPresignedUrl(user.profilePicture)
            }
        });
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

        // Update current branch
        user.currentBranch = newBranch;
        await user.save();

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.json({
            message: 'Branch switched successfully',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: await getPresignedUrl(user.profilePicture)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return generic message to prevent enumeration
        if (!user) {
            return res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Store hash + expiry (5 mins) + init attempts
        user.resetOtp = {
            code: hashedOtp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
            attempts: 0
        };

        await user.save();

        // Send Email
        const message = `Your password reset code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Code - AskUrSenior',
                message
            });
            res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
        } catch (err) {
            console.error('Email send failed:', err);
            user.resetOtp = undefined;
            await user.save();
            return res.status(500).json({ error: 'Email could not be sent' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Reset Password - Verify OTP
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.resetOtp || !user.resetOtp.code) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Check expiry
        if (user.resetOtp.expiresAt < Date.now()) {
            user.resetOtp = undefined; // Clear expired OTP
            await user.save();
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Check attempts
        if (user.resetOtp.attempts >= 5) {
            user.resetOtp = undefined; // Invalidated due to too many attempts
            await user.save();
            return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, user.resetOtp.code);

        if (!isMatch) {
            user.resetOtp.attempts += 1;
            await user.save();
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Valid OTP - Reset Password
        // hashing is handled by User.js pre-save hook
        user.password = newPassword;
        user.resetOtp = undefined; // Clear used OTP

        // Invalidate all existing sessions
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        res.json({ message: 'Password reset successful. You can now login with your new password.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    adminLogin,
    getUserProfile,
    getAllUsers,
    getAllUsers,
    switchBranch,
    forgotPassword,
    resetPassword,
    ADMIN_EMAILS
};
