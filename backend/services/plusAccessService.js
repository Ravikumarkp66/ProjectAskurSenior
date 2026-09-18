/**
 * AskUrSenior Plus Access & Entitlement Service (STEP-01 Foundation)
 *
 * Centralized Single Source of Truth for Plus entitlement:
 * 
 *                  Access Resolver
 *                         │
 *            ┌────────────┼────────────┐
 *            ↓            ↓            ↓
 *          ADMIN       TEST USER     NORMAL
 *            │            │            │
 *            ↓            ↓            ↓
 *           PLUS         PLUS         FREE
 *      (source: ADMIN) (source: TEST_USER) (source: NONE)
 *                         │
 *                         │ (Later plugged in: Razorpay / Subscription)
 *                         ↓
 *                    SUBSCRIPTION
 *               (source: SUBSCRIPTION)
 *
 * Deterministic Priority Rule:
 * 1. ADMIN > TEST_USER > NONE
 * 2. An Admin who is also flagged as a Test User deterministically receives source = 'ADMIN'.
 * 3. Unauthenticated requests resolve to FREE / NONE with hasPlusAccess = false.
 */

const CANONICAL_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();

/**
 * Evaluates whether a user represents an Administrator.
 * Checks role flags, legacy isAdmin, Admin document status, and canonical admin credentials.
 *
 * @param {Object|null|undefined} user
 * @returns {boolean}
 */
const isUserAdmin = (user) => {
    if (!user || typeof user !== 'object') return false;

    // Direct admin / super admin flags
    if (user.isAdmin === true || user.isSuperAdmin === true) {
        return true;
    }

    // Role-based administrative checks
    const roleStr = String(user.role || '').toLowerCase();
    if (['admin', 'super_admin', 'superadmin'].includes(roleStr)) {
        return true;
    }

    // Associated Admin document populated on req.user or req.admin
    if (user.admin && (user.admin.status === 'ACTIVE' || !user.admin.status)) {
        return true;
    }

    // Canonical master admin email fallback
    const email = String(user.email || '').toLowerCase().trim();
    if (email && email === CANONICAL_ADMIN_EMAIL) {
        return true;
    }

    return false;
};

/**
 * Evaluates whether a user is an explicitly designated test user.
 *
 * @param {Object|null|undefined} user
 * @returns {boolean}
 */
const isUserTestUser = (user) => {
    if (!user || typeof user !== 'object') return false;
    return user.isTestUser === true || user.isTestAccount === true;
};

/**
 * Resolves the full Plus access entitlement and origin source for any user context.
 *
 * @param {Object|null|undefined} user - User document, StudentAccount, Admin, or session user object
 * @returns {{ hasPlusAccess: boolean, plan: 'PLUS' | 'FREE', source: 'ADMIN' | 'TEST_USER' | 'SUBSCRIPTION' | 'NONE' }}
 */
const resolvePlusAccess = (user) => {
    if (!user) {
        return {
            hasPlusAccess: false,
            plan: 'FREE',
            source: 'NONE'
        };
    }

    // 1. ADMIN PRIORITY: Admins automatically receive Plus entitlement through administrative role
    if (isUserAdmin(user)) {
        return {
            hasPlusAccess: true,
            plan: 'PLUS',
            source: 'ADMIN'
        };
    }

    // 2. TEST USER PRIORITY: Explicitly marked test users receive Plus entitlement for pre-launch testing
    if (isUserTestUser(user)) {
        return {
            hasPlusAccess: true,
            plan: 'PLUS',
            source: 'TEST_USER'
        };
    }

    // 3. FUTURE EXTENSION: Paid subscription / Razorpay hook will be plugged in here
    // Example future logic:
    // if (user.hasActiveSubscription || user.subscriptionStatus === 'ACTIVE') {
    //     return { hasPlusAccess: true, plan: 'PLUS', source: 'SUBSCRIPTION' };
    // }

    // 4. NORMAL USER: Standard users remain Free
    return {
        hasPlusAccess: false,
        plan: 'FREE',
        source: 'NONE'
    };
};

/**
 * Single reliable boolean check for backend endpoints and services.
 *
 * @param {Object|null|undefined} user
 * @returns {boolean}
 */
const canAccessPlus = (user) => {
    return resolvePlusAccess(user).hasPlusAccess;
};

/**
 * Formats the standard access payload for API responses and DTOs.
 *
 * @param {Object|null|undefined} user
 * @returns {{ plan: 'PLUS' | 'FREE', source: 'ADMIN' | 'TEST_USER' | 'SUBSCRIPTION' | 'NONE' }}
 */
const getAccessPayload = (user) => {
    const { plan, source } = resolvePlusAccess(user);
    return { plan, source };
};

/**
 * Utility helper to designate or revoke test-user status for a given account.
 * Updates both StudentAccount and legacy User collections if present.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {boolean} isTestUser
 * @returns {Promise<{ success: boolean, updated: boolean }>}
 */
const setTestUserStatus = async (userId, isTestUser = true) => {
    const StudentAccount = require('../models/StudentAccount');
    const User = require('../models/User');

    const [studentUpdate, userUpdate] = await Promise.all([
        StudentAccount.findByIdAndUpdate(userId, { isTestUser: Boolean(isTestUser) }, { new: true }).catch(() => null),
        User.findByIdAndUpdate(userId, { isTestUser: Boolean(isTestUser) }, { new: true }).catch(() => null)
    ]);

    const updatedUser = studentUpdate || userUpdate;

    return {
        success: true,
        updated: !!updatedUser,
        user: updatedUser
    };
};

module.exports = {
    resolvePlusAccess,
    canAccessPlus,
    getAccessPayload,
    isUserAdmin,
    isUserTestUser,
    setTestUserStatus
};
