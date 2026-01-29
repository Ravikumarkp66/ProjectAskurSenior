const adminMiddleware = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
};

module.exports = adminMiddleware;
