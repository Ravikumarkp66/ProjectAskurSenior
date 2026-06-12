const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.state;

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify the user still exists in the db
        const user = await User.findById(decoded.userId).select('_id isSuspended registrationComplete');
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
        req.userBranch = decoded.branch;
        req.currentBranch = decoded.currentBranch;
        req.isAdmin = !!decoded.isAdmin;

        // Background update of lastActiveAt for real-time analytics
        User.findByIdAndUpdate(decoded.userId, { lastActiveAt: new Date() }).catch(() => {});

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
