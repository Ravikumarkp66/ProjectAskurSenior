/**
 * AskUrSenior Plus Access Authorization Middleware
 *
 * Enforces server-side Plus access on protected routes.
 * The backend is the single authoritative source of truth.
 */

const { resolvePlusAccess, getAccessPayload } = require('../services/plusAccessService');

/**
 * Middleware that strictly verifies the requesting user has Plus entitlement.
 * Blocks non-Plus users with HTTP 403.
 * Blocks unauthenticated users with HTTP 401.
 */
const requirePlusAccess = (req, res, next) => {
    const user = req.user || req.student || req.admin;

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required to access AskUrSenior Plus features.',
            code: 'AUTHENTICATION_REQUIRED',
            access: {
                plan: 'FREE',
                source: 'NONE'
            }
        });
    }

    const access = resolvePlusAccess(user);
    req.access = access;

    if (!access.hasPlusAccess) {
        return res.status(403).json({
            success: false,
            error: 'AskUrSenior Plus subscription or entitlement required.',
            code: 'PLUS_ACCESS_REQUIRED',
            access: {
                plan: access.plan,
                source: access.source
            }
        });
    }

    next();
};

/**
 * Non-blocking middleware that resolves and attaches Plus access state to req.access.
 */
const attachPlusAccess = (req, res, next) => {
    const user = req.user || req.student || req.admin;
    req.access = resolvePlusAccess(user);
    next();
};

module.exports = {
    requirePlusAccess,
    attachPlusAccess
};
