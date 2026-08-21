const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.state;

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify the student account exists (source of truth for students)
        const StudentAccount = require('../models/StudentAccount');
        const student = await StudentAccount.findById(decoded.userId).select('_id accountStatus registrationStatus role branch');
        
        let user = null;
        let isStudentAccount = false;

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
            // Fallback to legacy User (only if they are an admin or haven't migrated yet)
            const legacyUser = await User.findById(decoded.userId).select('_id isSuspended registrationComplete role branch currentBranch');
            if (legacyUser) {
                // If they are a student, they MUST have a StudentAccount. If not, they are considered deleted.
                // Exception: incomplete registrations (registrationComplete === false) have not created a StudentAccount yet.
                if (legacyUser.role === 'student' && legacyUser.registrationComplete !== false) {
                    return res.status(401).json({ error: 'User account not found', sessionExpired: true });
                }
                user = legacyUser;
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'User account not found', sessionExpired: true });
        }
        if (user.isSuspended) {
            return res.status(403).json({ error: 'Your account has been suspended. Contact AskUrSenior support.' });
        }

        // Restrict users with incomplete registration from accessing any endpoints other than completion and basic profile metadata
        if (user.registrationComplete === false &&
            !req.originalUrl.includes('/complete-google-registration') &&
            !req.originalUrl.includes('/profile') &&
            !req.originalUrl.includes('/heartbeat')) {
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
