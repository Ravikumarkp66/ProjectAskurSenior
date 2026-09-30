const test = require('node:test');
const assert = require('node:assert/strict');
const {
    resolvePlusAccess,
    canAccessPlus,
    getAccessPayload
} = require('../plusAccessService');
const StudentAccount = require('../../models/StudentAccount');
const User = require('../../models/User');
const AdminLog = require('../../models/AdminLog');
const { grantUserManualPlusAccess, revokeUserManualPlusAccess } = require('../../controllers/analyticsController');

// ============================================================================
// STEP-04 TEST SUITE: Manual Admin Plus Grant Lifecycle & Expiration
// ============================================================================

test('CASE 1: Active Manual Grant within valid dates resolves to PLUS with source MANUAL', () => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const studentWithManualGrant = {
        _id: 'student_manual_01',
        email: 'scholarship.student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: false,
        plusGrant: {
            source: 'MANUAL',
            validFrom: today,
            validUntil: nextMonth,
            reason: 'Academic Excellence Scholarship',
            grantedByName: 'Super Administrator',
            grantedAt: today,
            isActive: true
        }
    };

    const access = resolvePlusAccess(studentWithManualGrant);

    assert.strictEqual(access.hasPlusAccess, true, 'Student with active manual grant must have Plus access');
    assert.strictEqual(access.plan, 'PLUS', 'Plan must be PLUS');
    assert.strictEqual(access.source, 'MANUAL', 'Source must be explicitly MANUAL');
    assert.strictEqual(access.reason, 'Academic Excellence Scholarship');
    assert.strictEqual(access.isExpired, false);
    assert.strictEqual(canAccessPlus(studentWithManualGrant), true);

    const payload = getAccessPayload(studentWithManualGrant);
    assert.strictEqual(payload.plan, 'PLUS');
    assert.strictEqual(payload.source, 'MANUAL');
});

test('CASE 2: Expired Manual Grant resolves to FREE with source NONE', () => {
    const pastStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const pastExpiry = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // Expired 5 days ago

    const studentWithExpiredGrant = {
        _id: 'student_expired_01',
        email: 'expired.student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: false,
        plusGrant: {
            source: 'MANUAL',
            validFrom: pastStart,
            validUntil: pastExpiry,
            reason: 'Hackathon 1-Month Winner',
            grantedByName: 'Dept Head',
            grantedAt: pastStart,
            isActive: true
        }
    };

    const access = resolvePlusAccess(studentWithExpiredGrant);

    assert.strictEqual(access.hasPlusAccess, false, 'Expired grant must not have Plus access');
    assert.strictEqual(access.plan, 'FREE', 'Plan must revert to FREE upon expiration');
    assert.strictEqual(access.source, 'NONE', 'Source must revert to NONE');
    assert.strictEqual(canAccessPlus(studentWithExpiredGrant), false);
});

test('CASE 3: Future-dated Manual Grant (validFrom > now) resolves to FREE until start date arrives', () => {
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Starts in 7 days
    const futureExpiry = new Date(Date.now() + 37 * 24 * 60 * 60 * 1000);

    const studentWithFutureGrant = {
        _id: 'student_future_01',
        email: 'future.student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: false,
        plusGrant: {
            source: 'MANUAL',
            validFrom: futureStart,
            validUntil: futureExpiry,
            reason: 'Next Semester Pass',
            isActive: true
        }
    };

    const access = resolvePlusAccess(studentWithFutureGrant);

    assert.strictEqual(access.hasPlusAccess, false, 'Future grant should not be active before validFrom');
    assert.strictEqual(access.plan, 'FREE');
    assert.strictEqual(access.source, 'NONE');
});

test('CASE 4: Revoked Manual Grant (isActive: false) resolves to FREE', () => {
    const today = new Date();
    const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const studentWithRevokedGrant = {
        _id: 'student_revoked_01',
        email: 'revoked.student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: false,
        plusGrant: {
            source: 'MANUAL',
            validFrom: today,
            validUntil: futureExpiry,
            reason: 'Revoked by Admin',
            isActive: false, // Explicitly revoked
            revokedAt: today
        }
    };

    const access = resolvePlusAccess(studentWithRevokedGrant);

    assert.strictEqual(access.hasPlusAccess, false, 'Revoked grant must not give Plus access');
    assert.strictEqual(access.plan, 'FREE');
    assert.strictEqual(access.source, 'NONE');
});

test('CASE 5: Deterministic priority with ADMIN and MANUAL grant: ADMIN > TEST_USER > MANUAL > NONE', () => {
    const today = new Date();
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const adminWithManualGrant = {
        _id: 'admin_manual_combo',
        email: 'admin.combo@askursenior.org',
        role: 'admin',
        isAdmin: true,
        plusGrant: {
            source: 'MANUAL',
            validFrom: today,
            validUntil: nextMonth,
            isActive: true
        }
    };

    const access = resolvePlusAccess(adminWithManualGrant);
    assert.strictEqual(access.hasPlusAccess, true);
    assert.strictEqual(access.source, 'ADMIN', 'ADMIN role takes absolute precedence');

    const testUserWithManualGrant = {
        _id: 'tester_manual_combo',
        email: 'tester.combo@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: true,
        plusGrant: {
            source: 'MANUAL',
            validFrom: today,
            validUntil: nextMonth,
            isActive: true
        }
    };

    const accessTest = resolvePlusAccess(testUserWithManualGrant);
    assert.strictEqual(accessTest.hasPlusAccess, true);
    assert.strictEqual(accessTest.source, 'TEST_USER', 'TEST_USER takes precedence over normal MANUAL');
});

test('CASE 6: StudentAccount and User schemas include plusGrant structure', () => {
    const userPath = User.schema.path('plusGrant.source');
    assert.ok(userPath, 'User model must have plusGrant.source');

    const studentPath = StudentAccount.schema.path('plusGrant.validUntil');
    assert.ok(studentPath, 'StudentAccount model must have plusGrant.validUntil');

    const studentIsActive = StudentAccount.schema.path('plusGrant.isActive');
    assert.ok(studentIsActive, 'StudentAccount model must have plusGrant.isActive');
    assert.strictEqual(studentIsActive.defaultValue, false);
});

test('CASE 7: AdminLog supports MANUAL_PLUS_GRANTED and MANUAL_PLUS_REVOKED', () => {
    const actionEnum = AdminLog.schema.path('action').enumValues;
    assert.ok(actionEnum.includes('MANUAL_PLUS_GRANTED'), 'AdminLog must include MANUAL_PLUS_GRANTED');
    assert.ok(actionEnum.includes('MANUAL_PLUS_REVOKED'), 'AdminLog must include MANUAL_PLUS_REVOKED');
});

test('CASE 8: grantUserManualPlusAccess validates required validUntil and date ranges', async () => {
    // 8a. Missing validUntil
    let statusCode = null;
    let responseBody = null;
    const reqMissingExpiry = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: { validFrom: new Date().toISOString() }
    };
    const res = {
        status: (code) => {
            statusCode = code;
            return { json: (body) => { responseBody = body; } };
        }
    };

    await grantUserManualPlusAccess(reqMissingExpiry, res);
    assert.strictEqual(statusCode, 400);
    assert.match(responseBody.error, /Expiry Date .* required/i);

    // 8b. Expiry date before start date
    const reqInvalidRange = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: {
            validFrom: '2026-10-10',
            validUntil: '2026-10-01'
        }
    };
    await grantUserManualPlusAccess(reqInvalidRange, res);
    assert.strictEqual(statusCode, 400);
    assert.match(responseBody.error, /Expiry Date must be after Start Date/i);
});
