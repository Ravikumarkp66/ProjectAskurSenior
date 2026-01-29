const User = require('../models/User');
const Progress = require('../models/Progress');
const jwt = require('jsonwebtoken');

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

        // Create new user
        const user = new User({
            usn: usn.toUpperCase(),
            email: email.toLowerCase(),
            password,
            branch,
            currentBranch: branch
        });

        await user.save();

        // Create progress record
        const progress = new Progress({
            userId: user._id,
            branch: user.currentBranch,
            subjectProgress: []
        });

        await progress.save();

        // Update user with progress reference
        user.progress = progress._id;
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
                isAdmin: !!user.isAdmin
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

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    switchBranch
};
