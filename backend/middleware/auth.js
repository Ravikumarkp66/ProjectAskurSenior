const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userBranch = decoded.branch;
        req.currentBranch = decoded.currentBranch;
        req.isAdmin = !!decoded.isAdmin;

        // Update last active time (don't await to avoid slowing down requests)
        User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).exec();

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
