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

    // 3. MANUAL ADMIN GRANT PRIORITY: Explicit administrative overrides with start & expiry dates
    if (user.plusGrant && user.plusGrant.isActive) {
        const now = new Date();
        const validFrom = user.plusGrant.validFrom ? new Date(user.plusGrant.validFrom) : null;
        const validUntil = user.plusGrant.validUntil ? new Date(user.plusGrant.validUntil) : null;

        const isStarted = !validFrom || validFrom <= now;
        const isNotExpired = !validUntil || validUntil > now;

        if (isStarted && isNotExpired) {
            return {
                hasPlusAccess: true,
                plan: 'PLUS',
                source: 'MANUAL',
                validFrom: user.plusGrant.validFrom,
                validUntil: user.plusGrant.validUntil,
                reason: user.plusGrant.reason || '',
                grantedAt: user.plusGrant.grantedAt,
                grantedByName: user.plusGrant.grantedByName || 'Administrator',
                isExpired: false
            };
        }
    }

    // 4. ACTIVE SUBSCRIPTION PRIORITY: Users with an active paid semester subscription
    if (
        user.hasActiveSubscription === true ||
        user.isPlus === true ||
        user.plan === 'plus' ||
        user.plan === 'PLUS' ||
        user.subscription === 'plus' ||
        user.subscription === 'askplus' ||
        user.subscriptionStatus === 'ACTIVE'
    ) {
        return {
            hasPlusAccess: true,
            plan: 'PLUS',
            source: 'SUBSCRIPTION'
        };
    }

    // 5. NORMAL USER: Standard users remain Free
    return {
        hasPlusAccess: false,
        plan: 'FREE',
        source: 'NONE'
    };
};

/**
 * Resolves Plus access asynchronously with direct database check against StudentAccount/User collections and Subscription collection.
 *
 * @param {Object|string} userOrUserId
 * @returns {Promise<{ hasPlusAccess: boolean, plan: 'PLUS' | 'FREE', source: 'ADMIN' | 'TEST_USER' | 'MANUAL' | 'SUBSCRIPTION' | 'NONE' }>}
 */
const resolvePlusAccessAsync = async (userOrUserId) => {
    if (!userOrUserId) {
        return { hasPlusAccess: false, plan: 'FREE', source: 'NONE' };
    }

    if (typeof userOrUserId === 'object') {
        const syncResult = resolvePlusAccess(userOrUserId);
        if (syncResult.hasPlusAccess) return syncResult;
    }

    const userId = typeof userOrUserId === 'object' ? (userOrUserId._id || userOrUserId.id) : userOrUserId;
    if (!userId) {
        return { hasPlusAccess: false, plan: 'FREE', source: 'NONE' };
    }

    try {
        const StudentAccount = require('../models/StudentAccount');
        const User = require('../models/User');

        const dbUser = await StudentAccount.findById(userId) || await User.findById(userId);
        if (dbUser) {
            const dbSyncResult = resolvePlusAccess(dbUser);
            if (dbSyncResult.hasPlusAccess) return dbSyncResult;
        }

        const Subscription = require('../models/Subscription');
        const activeSub = await Subscription.findOne({
            userId,
            status: 'ACTIVE',
            endDate: { $gte: new Date() }
        });
        if (activeSub) {
            return {
                hasPlusAccess: true,
                plan: 'PLUS',
                source: 'SUBSCRIPTION',
                subscription: activeSub
            };
        }
    } catch (err) {
        console.error('Error in resolvePlusAccessAsync:', err);
    }

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
 * @returns {{ plan: 'PLUS' | 'FREE', source: 'ADMIN' | 'TEST_USER' | 'MANUAL' | 'SUBSCRIPTION' | 'NONE' }}
 */
const getAccessPayload = (user) => {
    const { plan, source } = resolvePlusAccess(user);
    return { plan, source };
};

/**
 * Helper to grant manual AskUrSenior Plus access with explicit validity dates and administrative rationale.
 * Updates both StudentAccount and legacy User collections.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ validFrom?: Date|string, validUntil: Date|string, reason?: string, adminId?: any, adminName?: string }} grantParams
 * @returns {Promise<{ success: boolean, updated: boolean, user: Object|null, access: Object }>}
 */
const grantManualPlusAccess = async (userId, { validFrom, validUntil, reason = '', adminId = null, adminName = 'Administrator' } = {}) => {
    const StudentAccount = require('../models/StudentAccount');
    const User = require('../models/User');

    const fromDate = validFrom ? new Date(validFrom) : new Date();
    const untilDate = validUntil ? new Date(validUntil) : null;

    const plusGrant = {
        source: 'MANUAL',
        validFrom: fromDate,
        validUntil: untilDate,
        reason: (reason || '').trim(),
        grantedBy: adminId,
        grantedByName: adminName,
        grantedAt: new Date(),
        revokedAt: null,
        revokedBy: null,
        isActive: true
    };

    const updatePayload = {
        plusGrant
    };

    const [studentUpdate, userUpdate] = await Promise.all([
        StudentAccount.findByIdAndUpdate(userId, updatePayload, { new: true }).catch(() => null),
        User.findByIdAndUpdate(userId, updatePayload, { new: true }).catch(() => null)
    ]);

    const updatedUser = studentUpdate || userUpdate;
    const access = resolvePlusAccess(updatedUser);

    return {
        success: true,
        updated: !!updatedUser,
        user: updatedUser,
        access
    };
};

/**
 * Helper to revoke manual AskUrSenior Plus access for a user.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {{ adminId?: any, adminName?: string, reason?: string }} revokeParams
 * @returns {Promise<{ success: boolean, updated: boolean, user: Object|null, access: Object }>}
 */
const revokeManualPlusAccess = async (userId, { adminId = null, adminName = 'Administrator', reason = '' } = {}) => {
    const StudentAccount = require('../models/StudentAccount');
    const User = require('../models/User');

    const updatePayload = {
        'plusGrant.isActive': false,
        'plusGrant.revokedAt': new Date(),
        'plusGrant.revokedBy': adminId
    };

    const [studentUpdate, userUpdate] = await Promise.all([
        StudentAccount.findByIdAndUpdate(userId, updatePayload, { new: true }).catch(() => null),
        User.findByIdAndUpdate(userId, updatePayload, { new: true }).catch(() => null)
    ]);

    const updatedUser = studentUpdate || userUpdate;
    const access = resolvePlusAccess(updatedUser);

    return {
        success: true,
        updated: !!updatedUser,
        user: updatedUser,
        access
    };
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
    resolvePlusAccessAsync,
    canAccessPlus,
    getAccessPayload,
    isUserAdmin,
    isUserTestUser,
    setTestUserStatus,
    grantManualPlusAccess,
    revokeManualPlusAccess
};
