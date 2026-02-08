const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getPresignedUrl } = require('../utils/s3');

const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to check OTP rate limits
const checkOtpRateLimit = (user) => {
    const now = Date.now();
    const cooldown = 60 * 1000; // 60 seconds
    const maxRequests = 3;

    if (!user.signupOtp || !user.signupOtp.code) return { allowed: true };

    // Reset if OTP is expired (User requested reset after expiration)
    if (user.signupOtp.expiresAt < now) {
        return { allowed: true, reset: true };
    }

    // Check cooldown
    if (user.signupOtp.lastRequestAt && (now - user.signupOtp.lastRequestAt < cooldown)) {
        return { allowed: false, error: 'Please wait 60 seconds before requesting another code.' };
    }

    // Check max requests
    if (user.signupOtp.requestCount >= maxRequests) {
        return { allowed: false, error: 'Verification failed or limit exceeded' };
    }

    return { allowed: true };
};

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
            console.log('Registration failed: Missing fields', { usn, email, branch });
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { usn: usn.toUpperCase() },
                { email: email.toLowerCase() }
            ]
        });

        let user;
        let otp;

        if (existingUser) {
            if (existingUser.isVerified) {
                console.log(`Registration failed: Verified user exists - ${usn} / ${email}`);
                return res.status(400).json({ error: 'User already exists' });
            }

            // Allow "re-registration" for unverified users to avoid 400 bad request deadlock
            console.log(`Re-registering unverified user - ${usn} / ${email}`);
            existingUser.password = password;
            existingUser.branch = branch;
            existingUser.currentBranch = branch;

            // Generate new OTP
            otp = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            existingUser.signupOtp = {
                code: await bcrypt.hash(otp, salt),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                requestCount: 1,
                lastRequestAt: Date.now()
            };

            await existingUser.save();
            user = existingUser;
        } else {
            // Check if email should be auto-admin
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());

            // Create new user
            user = new User({
                usn: usn.toUpperCase(),
                email: email.toLowerCase(),
                password,
                branch: branch,
                currentBranch: branch,
                isAdmin: isAdminEmail
            });

            // Generate 6-digit OTP for signup
            otp = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);

            user.signupOtp = {
                code: hashedOtp,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
                requestCount: 1,
                lastRequestAt: Date.now()
            };

            await user.save();
            console.log(`New user created: ${usn} / ${email}`);
        }

        // Send Email
        const message = `Welcome to AskUrSenior!\n\nYour verification code is: ${otp}\n\nPlease enter this code to complete your registration.\n\nIf you did not request this, please ignore this email.`;

        try {
            console.log(`Attempting to send OTP to ${user.email}...`);
            await sendEmail({
                email: user.email,
                subject: 'Verify Your Email - AskUrSenior',
                message
            });

            res.status(201).json({
                message: 'Registration successful. Please verify your email with the OTP sent.',
                email: user.email
            });
        } catch (err) {
            console.error('Signup email failed:', err);
            res.status(201).json({
                message: 'Registration successful but email failed to send. Please contact support.',
                email: user.email
            });
        }

    } catch (error) {
        console.error('Registration server error:', error);
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

        // Check if verified
        if (!user.isVerified) {
            // Auto-trigger resend OTP so they have it immediately
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            const hashedOtp = await bcrypt.hash(otp, salt);

            user.signupOtp = {
                code: hashedOtp,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            };
            await user.save();

            const message = `Your verification code is: ${otp}\n\nPlease enter this code to complete your registration.`;

            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify Your Email - AskUrSenior',
                    message
                });
            } catch (emailErr) {
                console.error('Auto-OTP sending failed:', emailErr);
            }

            return res.status(401).json({
                error: 'Please verify your email before logging in. A new OTP has been sent to your email.',
                needsVerification: true,
                email: user.email
            });
        }

        // Increment token version for single active session
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        // Update current branch if different
        if (user.currentBranch !== branch) {
            user.currentBranch = branch;
        }
        await user.save();

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

// Verify Signup OTP
const verifySignup = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.signupOtp || !user.signupOtp.code) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Check expiry
        if (user.signupOtp.expiresAt < Date.now()) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, user.signupOtp.code);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Valid OTP
        user.isVerified = true;
        // Reset OTP fields as requested: "Reset OTP request counters only after successful OTP verification"
        user.signupOtp = {
            code: undefined,
            expiresAt: undefined,
            requestCount: 0,
            lastRequestAt: undefined
        };

        // Success - increment token version for their first session
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.json({
            message: 'Email verified successfully!',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: await getPresignedUrl(user.profilePicture)
            }
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Google Login
const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, picture, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create new user if they don't exist
            user = new User({
                email: email.toLowerCase(),
                name: name,
                profilePicture: picture,
                authProvider: 'google',
                isVerified: true // Google users are pre-verified
            });
            await user.save();
        } else {
            // Update existing user's name and picture if they were local
            let updated = false;
            if (user.authProvider === 'local') {
                user.authProvider = 'google';
                user.isVerified = true;
                if (!user.name) user.name = name;
                if (!user.profilePicture) user.profilePicture = picture;
                updated = true;
            }

            // Always increment version for new Google login session
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            updated = true;

            if (updated) await user.save();
        }

        const jwtToken = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin, user.tokenVersion);

        res.json({
            message: 'Google login successful',
            token: jwtToken,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                name: user.name,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                profilePicture: user.profilePicture.startsWith('http') ? user.profilePicture : await getPresignedUrl(user.profilePicture)
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
};

// Resend Verification OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User is already verified' });
        }

        // Check rate limits
        const rateLimit = checkOtpRateLimit(user);
        if (!rateLimit.allowed) {
            return res.status(400).json({ error: rateLimit.error });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        user.signupOtp = {
            code: hashedOtp,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            requestCount: rateLimit.reset ? 1 : (user.signupOtp.requestCount || 0) + 1,
            lastRequestAt: Date.now()
        };

        await user.save();

        // Send Email
        const message = `Your new verification code is: ${otp}\n\nPlease enter this code to complete your registration.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'New Verification Code - AskUrSenior',
                message
            });
            res.json({ message: 'A new OTP has been sent to your email.' });
        } catch (err) {
            console.error('Resend email failed:', err);
            return res.status(500).json({ error: 'Email could not be sent' });
        }

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Cleanup: Delete all non-admin users (one-time use)
const migrateUsers = async (req, res) => {
    try {
        const result = await User.deleteMany({ isAdmin: { $ne: true } });
        res.json({ message: `Cleanup successful. Deleted ${result.deletedCount} non-admin users. Admins were preserved.` });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ error: 'Cleanup failed' });
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
    googleLogin,
    verifySignup,
    resendOtp,
    migrateUsers,
    ADMIN_EMAILS
};
