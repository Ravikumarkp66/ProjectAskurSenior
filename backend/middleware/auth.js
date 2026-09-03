const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.state;

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior';
        const decoded = jwt.verify(token, jwtSecret);
        const userId = decoded.userId || decoded.id || decoded._id;
        const mongoose = require('mongoose');
        const StudentAccount = require('../models/StudentAccount');

        let user = null;
        let isStudentAccount = false;

        if (mongoose.isValidObjectId(userId)) {
            // Verify the student account exists (source of truth for students)
            const student = await StudentAccount.findById(userId).select('_id accountStatus registrationStatus role branch');
            
            if (student) {
                user = {
                    _id: student._id,
                    isSuspended: student.accountStatus === 'suspended',
                    registrationComplete: student.registrationStatus === 'completed' || student.registrationStatus === 'identity_completed' || student.registrationStatus === 'academic_completed',
                    role: student.role,
                    branch: student.branch,
                    currentBranch: student.branch,
                    isStudentAccount: true
                };
                isStudentAccount = true;
            } else {
                // Fallback to legacy User
                const legacyUser = await User.findById(userId).select('_id isSuspended registrationComplete role branch currentBranch');
                if (legacyUser) {
                    user = legacyUser;
                }
            }
        }

        // Check if admin email or token is admin
        if (!user && decoded.role === 'admin' && decoded.email) {
            const adminByEmail = await User.findOne({ email: decoded.email, role: 'admin' }) ||
                                 await StudentAccount.findOne({ email: decoded.email, role: 'admin' });
            if (adminByEmail) {
                user = adminByEmail;
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'User account not found', sessionExpired: true });
        }
        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        // Restrict users with incomplete registration from accessing non-profile endpoints
        if (user.registrationComplete === false &&
            !req.originalUrl.includes('/complete-google-registration') &&
            !req.originalUrl.includes('/complete-profile') &&
            !req.originalUrl.includes('/profile') &&
            !req.originalUrl.includes('/me') &&
            !req.originalUrl.includes('/heartbeat') &&
            !req.originalUrl.includes('/events')) {
            return res.status(403).json({ error: 'Please complete your profile registration first.', needsCompletion: true });
        }

        req.userId = decoded.userId;
        req.userBranch = decoded.branch || user.branch;
        req.currentBranch = decoded.currentBranch || user.currentBranch;
        req.isAdmin = decoded.isAdmin || user.role === 'admin';

        // Background update of lastActiveAt for real-time analytics
        if (isStudentAccount) {
            const StudentAccount = require('../models/StudentAccount');
            StudentAccount.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).catch(() => {});
        } else {
            User.findByIdAndUpdate(decoded.userId, { lastActiveAt: new Date() }).catch(() => {});
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
