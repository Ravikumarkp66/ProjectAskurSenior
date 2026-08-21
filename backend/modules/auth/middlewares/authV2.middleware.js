const rateLimit = require('express-rate-limit');
const studentAccountRepository = require('../repositories/studentAccount.repository');
const tokenUtil = require('../utils/token');

const authenticateStudent = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = authHeader && authHeader.split(' ')[1];
        if (!token && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
                data: null,
                errors: null
            });
        }

        const decoded = tokenUtil.verifyToken(token);
        
        if (decoded.type === 'refresh' || decoded.type === 'registration' || decoded.type === 'recovery') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type provided',
                data: null,
                errors: null
            });
        }

        const student = await studentAccountRepository.findById(decoded.userId);

        if (!student) {
            const refreshTokenRepository = require('../repositories/refreshToken.repository');
            await refreshTokenRepository.revokeAllForUser(decoded.userId);
            res.clearCookie('v2_refresh_token');
            return res.status(401).json({
                success: false,
                message: 'Student account not found',
                data: null,
                errors: null
            });
        }

        req.student = student;
        req.userId = student._id.toString();
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token',
            data: null,
            errors: null
        });
    }
};

const requireActiveAccount = (req, res, next) => {
    if (!req.student) {
        return res.status(500).json({
            success: false,
            message: 'authenticateStudent middleware is required before this check',
            data: null,
            errors: null
        });
    }

    if (req.student.isDeleted || req.student.deletedAt) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been deleted',
            data: null,
            errors: null
        });
    }

    if (req.student.accountStatus === 'suspended') {
        return res.status(403).json({
            success: false,
            message: 'Your account has been suspended. Please contact support.',
            data: null,
            errors: null
        });
    }

    if (req.student.accountStatus !== 'active') {
        return res.status(403).json({
            success: false,
            message: `Account is inactive (status: ${req.student.accountStatus})`,
            data: null,
            errors: null
        });
    }

    next();
};

const requireRegistrationCompleted = (req, res, next) => {
    if (!req.student) {
        return res.status(500).json({
            success: false,
            message: 'authenticateStudent middleware is required before this check',
            data: null,
            errors: null
        });
    }

    if (req.student.registrationStatus !== 'completed') {
        return res.status(403).json({
            success: false,
            message: 'Please complete your profile onboarding registration first.',
            data: null,
            errors: null
        });
    }

    next();
};

const v2AuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        data: null,
        errors: null
    },
    standardHeaders: true,
    legacyHeaders: false
});

const v2OtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many OTP requests. Please wait 15 minutes before trying again.',
        data: null,
        errors: null
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    authenticateStudent,
    requireActiveAccount,
    requireRegistrationCompleted,
    v2AuthLimiter,
    v2OtpLimiter
};
