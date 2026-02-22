const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Admin emails that should automatically get admin access
const ADMIN_EMAILS = ['mreduactor4566@gmail.com'];
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, branch, currentBranch, isAdmin) => {
    return jwt.sign({ userId, branch, currentBranch, isAdmin: !!isAdmin }, process.env.JWT_SECRET, {
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

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

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

        if (user.registrationComplete === false) {
            user.registrationComplete = true;
            await user.save();
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

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

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
                registrationComplete: true
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

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user._id,
                usn: user.usn,
                email: user.email,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: true,
                registrationComplete: true
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

        const token = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Branch switched successfully',
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
        res.status(500).json({ error: error.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Google token is required' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID is not configured in environment variables');
            return res.status(500).json({ error: 'Google authentication is not configured on the server' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload?.email;
        const googleId = payload?.sub;

        if (!email || !googleId) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        let user = await User.findOne({ $or: [{ email: email.toLowerCase() }, { googleId }] });

        if (!user) {
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
            user = new User({
                email: email.toLowerCase(),
                name: payload?.name || '',
                profilePicture: payload?.picture || '',
                googleId,
                branch: 'CS',
                currentBranch: 'CS',
                isAdmin: isAdminEmail,
                registrationComplete: isAdminEmail // Only admins have complete registration by default
            });
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (!user.name && payload?.name) {
                user.name = payload.name;
            }
            if (!user.profilePicture && payload?.picture) {
                user.profilePicture = payload.picture;
            }
            // Check if admin email and promote to admin if needed
            const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
            if (isAdminEmail && !user.isAdmin) {
                user.isAdmin = true;
                user.registrationComplete = true; // Admins don't need to complete registration
            }
        }

        await user.save();

        const tokenJwt = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Successfully logged in with Google',
            token: tokenJwt,
            user: {
                id: user._id,
                usn: user.usn,
                username: user.username,
                email: user.email,
                name: user.name,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: user.registrationComplete
            },
            needsCompletion: !user.registrationComplete
        });
    } catch (error) {
        console.error('Google login failed - Full error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Provide more specific error messages
        if (error.message && error.message.includes('Token used too early')) {
            return res.status(400).json({ error: 'Invalid token timing. Please try again.' });
        }
        if (error.message && error.message.includes('Invalid token signature')) {
            return res.status(400).json({ error: 'Invalid token signature. Please try again.' });
        }

        res.status(500).json({
            error: 'Google login failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Complete Google registration - Add USN, Username, and Branch for new Google users
const completeGoogleRegistration = async (req, res) => {
    try {
        const { usn, username, branch } = req.body;
        const userId = req.userId;

        if (!usn || !username || !branch) {
            return res.status(400).json({ error: 'USN, Username, and Branch are required' });
        }

        // Validate USN format
        if (!/^[a-z0-9]{8,12}$/i.test(usn)) {
            return res.status(400).json({ error: 'Invalid USN format' });
        }

        // Check if USN already exists
        const existingUsn = await User.findOne({ usn: usn.toUpperCase() });
        if (existingUsn && existingUsn._id.toString() !== userId) {
            return res.status(400).json({ error: 'USN already registered' });
        }

        // Check if Username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername && existingUsername._id.toString() !== userId) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.registrationComplete) {
            return res.status(400).json({ error: 'Registration already completed' });
        }

        // Update user with USN, username, branch, and mark registration complete
        user.usn = usn.toUpperCase();
        user.username = username.toLowerCase();
        user.branch = branch;
        user.currentBranch = branch;
        user.registrationComplete = true;

        await user.save();

        // Generate new token with updated information
        const tokenJwt = generateToken(user._id, user.branch, user.currentBranch, user.isAdmin);

        res.json({
            message: 'Profile completed successfully',
            token: tokenJwt,
            user: {
                id: user._id,
                usn: user.usn,
                username: user.username,
                email: user.email,
                name: user.name,
                branch: user.branch,
                currentBranch: user.currentBranch,
                isAdmin: !!user.isAdmin,
                registrationComplete: true
            }
        });
    } catch (error) {
        console.error('Complete profile error:', error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ error: `${field} already exists` });
        }
        res.status(500).json({ error: 'Failed to complete profile' });
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
    ADMIN_EMAILS
};
