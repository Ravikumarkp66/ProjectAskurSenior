const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token || req.query.state;

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Single Active Session Check
        const user = await User.findById(decoded.userId).select('tokenVersion');
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({
                error: 'Session expired. Logged in from another device.',
                sessionExpired: true
            });
        }

        req.userId = decoded.userId;
        req.userBranch = decoded.branch;
        req.currentBranch = decoded.currentBranch;
        req.isAdmin = !!decoded.isAdmin;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
