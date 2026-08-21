const mobileGuard = (req, res, next) => {
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const isMobileClient = req.headers['x-client-type'] === 'mobile' ||
        req.headers['x-mobile-app'] ||
        userAgent.includes('expo') ||
        userAgent.includes('okhttp') ||
        userAgent.includes('cfnetwork') ||
        userAgent.includes('react-native') ||
        userAgent.includes('askurseniormobile');

    if (isMobileClient) {
        return res.status(403).json({
            success: false,
            message: 'Mobile API access is currently disabled.'
        });
    }
    next();
};

module.exports = mobileGuard;
