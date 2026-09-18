const test = require('node:test');
const assert = require('node:assert/strict');
const {
    resolvePlusAccess,
    canAccessPlus,
    getAccessPayload,
    isUserAdmin,
    isUserTestUser
} = require('../plusAccessService');
const { requirePlusAccess, attachPlusAccess } = require('../../middleware/plusAccess');
const authV2Dto = require('../../modules/auth/dtos/authV2.dto');

// ============================================================================
// STEP-01 TEST SUITE: Plus Access Foundation & Entitlement
// ============================================================================

test('CASE 1: Normal authenticated user resolves to FREE with source NONE', () => {
    const normalUser = {
        _id: 'user_12345',
        email: 'student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: false
    };

    const access = resolvePlusAccess(normalUser);

    assert.strictEqual(access.hasPlusAccess, false, 'Normal user should not have Plus access');
    assert.strictEqual(access.plan, 'FREE', 'Normal user plan must be FREE');
    assert.strictEqual(access.source, 'NONE', 'Normal user access source must be NONE');
    assert.strictEqual(canAccessPlus(normalUser), false, 'canAccessPlus must return false for normal user');

    const payload = getAccessPayload(normalUser);
    assert.deepStrictEqual(payload, { plan: 'FREE', source: 'NONE' });
});

test('CASE 2: Admin authenticated user resolves to PLUS with source ADMIN', () => {
    // 2a. Admin via role 'admin'
    const adminUser1 = {
        _id: 'admin_1',
        email: 'admin1@askursenior.org',
        role: 'admin',
        isAdmin: true
    };
    const access1 = resolvePlusAccess(adminUser1);
    assert.strictEqual(access1.hasPlusAccess, true);
    assert.strictEqual(access1.plan, 'PLUS');
    assert.strictEqual(access1.source, 'ADMIN');
    assert.strictEqual(canAccessPlus(adminUser1), true);

    // 2b. Super Admin via role 'SUPER_ADMIN'
    const superAdmin = {
        _id: 'super_admin_1',
        email: 'superadmin@askursenior.org',
        role: 'SUPER_ADMIN',
        isAdmin: true
    };
    const access2 = resolvePlusAccess(superAdmin);
    assert.strictEqual(access2.hasPlusAccess, true);
    assert.strictEqual(access2.plan, 'PLUS');
    assert.strictEqual(access2.source, 'ADMIN');

    // 2c. Canonical admin email
    const canonicalAdmin = {
        _id: 'canonical_1',
        email: 'mreducator4566@gmail.com',
        role: 'student', // Even if role says student in student_accounts
        isAdmin: false
    };
    const access3 = resolvePlusAccess(canonicalAdmin);
    assert.strictEqual(access3.hasPlusAccess, true);
    assert.strictEqual(access3.plan, 'PLUS');
    assert.strictEqual(access3.source, 'ADMIN');

    // 2d. Populated admin record (Admin model doc)
    const adminDocUser = {
        _id: 'admin_doc_1',
        email: 'deptadmin@askursenior.org',
        admin: {
            status: 'ACTIVE',
            role: 'ADMIN'
        }
    };
    const access4 = resolvePlusAccess(adminDocUser);
    assert.strictEqual(access4.hasPlusAccess, true);
    assert.strictEqual(access4.plan, 'PLUS');
    assert.strictEqual(access4.source, 'ADMIN');
});

test('CASE 3: Test user authenticated resolves to PLUS with source TEST_USER', () => {
    const testUser = {
        _id: 'test_user_99',
        email: 'tester.student@sit.ac.in',
        role: 'student',
        isAdmin: false,
        isTestUser: true
    };

    const access = resolvePlusAccess(testUser);

    assert.strictEqual(access.hasPlusAccess, true, 'Test user must have Plus access');
    assert.strictEqual(access.plan, 'PLUS', 'Test user plan must be PLUS');
    assert.strictEqual(access.source, 'TEST_USER', 'Test user source must be TEST_USER');
    assert.strictEqual(canAccessPlus(testUser), true, 'canAccessPlus must return true for test user');

    const payload = getAccessPayload(testUser);
    assert.deepStrictEqual(payload, { plan: 'PLUS', source: 'TEST_USER' });
});

test('CASE 4: Admin + Test user follows deterministic priority (ADMIN > TEST_USER > NONE)', () => {
    const adminAndTestUser = {
        _id: 'admin_test_combo',
        email: 'admin.tester@askursenior.org',
        role: 'admin',
        isAdmin: true,
        isTestUser: true // Both flags set simultaneously
    };

    const access = resolvePlusAccess(adminAndTestUser);

    assert.strictEqual(access.hasPlusAccess, true, 'Must have Plus access');
    assert.strictEqual(access.plan, 'PLUS', 'Plan must be PLUS');
    assert.strictEqual(access.source, 'ADMIN', 'ADMIN must take priority over TEST_USER (ADMIN > TEST_USER > NONE)');
});

test('CASE 5: Unauthenticated request resolves to FREE with source NONE', () => {
    const nullAccess = resolvePlusAccess(null);
    assert.strictEqual(nullAccess.hasPlusAccess, false);
    assert.strictEqual(nullAccess.plan, 'FREE');
    assert.strictEqual(nullAccess.source, 'NONE');
    assert.strictEqual(canAccessPlus(null), false);

    const undefinedAccess = resolvePlusAccess(undefined);
    assert.strictEqual(undefinedAccess.hasPlusAccess, false);
    assert.strictEqual(undefinedAccess.plan, 'FREE');
    assert.strictEqual(undefinedAccess.source, 'NONE');
    assert.strictEqual(canAccessPlus(undefined), false);

    const emptyObjAccess = resolvePlusAccess({});
    assert.strictEqual(emptyObjAccess.hasPlusAccess, false);
    assert.strictEqual(emptyObjAccess.plan, 'FREE');
    assert.strictEqual(emptyObjAccess.source, 'NONE');
    assert.strictEqual(canAccessPlus({}), false);
});

test('CASE 6: Backend middleware requirePlusAccess authorization behavior', () => {
    // 6a. Unauthenticated -> 401 AUTHENTICATION_REQUIRED
    let unauthStatus = null;
    let unauthBody = null;
    let nextCalled = false;
    const reqUnauth = {};
    const resUnauth = {
        status: (code) => {
            unauthStatus = code;
            return {
                json: (body) => { unauthBody = body; }
            };
        }
    };
    requirePlusAccess(reqUnauth, resUnauth, () => { nextCalled = true; });
    assert.strictEqual(unauthStatus, 401);
    assert.strictEqual(unauthBody.code, 'AUTHENTICATION_REQUIRED');
    assert.strictEqual(nextCalled, false);

    // 6b. Normal user -> 403 PLUS_ACCESS_REQUIRED
    let normalStatus = null;
    let normalBody = null;
    nextCalled = false;
    const reqNormal = { user: { role: 'student', isAdmin: false, isTestUser: false } };
    const resNormal = {
        status: (code) => {
            normalStatus = code;
            return {
                json: (body) => { normalBody = body; }
            };
        }
    };
    requirePlusAccess(reqNormal, resNormal, () => { nextCalled = true; });
    assert.strictEqual(normalStatus, 403);
    assert.strictEqual(normalBody.code, 'PLUS_ACCESS_REQUIRED');
    assert.deepStrictEqual(normalBody.access, { plan: 'FREE', source: 'NONE' });
    assert.strictEqual(nextCalled, false);

    // 6c. Admin user -> calls next() and attaches req.access
    nextCalled = false;
    const reqAdmin = { user: { role: 'admin', isAdmin: true } };
    requirePlusAccess(reqAdmin, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(reqAdmin.access.hasPlusAccess, true);
    assert.strictEqual(reqAdmin.access.source, 'ADMIN');

    // 6d. Test user -> calls next() and attaches req.access
    nextCalled = false;
    const reqTest = { student: { isTestUser: true } };
    requirePlusAccess(reqTest, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(reqTest.access.hasPlusAccess, true);
    assert.strictEqual(reqTest.access.source, 'TEST_USER');
});

test('CASE 7: AuthV2 DTO serialization exposes structured access payload and isTestUser', () => {
    // 7a. Normal student DTO
    const mockStudent = {
        _id: '507f1f77bcf86cd799439011',
        studentId: '1SI22CS001',
        name: 'Normal Student',
        email: 'student@example.com',
        role: 'student',
        registrationStatus: 'completed',
        isTestUser: false
    };

    const dto = authV2Dto.toStudentResponseDto(mockStudent);
    assert.strictEqual(dto.isTestUser, false);
    assert.deepStrictEqual(dto.access, { plan: 'FREE', source: 'NONE' });
    assert.strictEqual(dto.subscription, 'free');

    // 7b. Test student DTO
    const mockTestStudent = {
        _id: '507f1f77bcf86cd799439022',
        studentId: '1SI22CS002',
        name: 'Test Student',
        email: 'teststudent@example.com',
        role: 'student',
        registrationStatus: 'completed',
        isTestUser: true
    };

    const testDto = authV2Dto.toStudentResponseDto(mockTestStudent);
    assert.strictEqual(testDto.isTestUser, true);
    assert.deepStrictEqual(testDto.access, { plan: 'PLUS', source: 'TEST_USER' });
    assert.strictEqual(testDto.subscription, 'plus');

    // 7c. Admin student DTO
    const mockAdminStudent = {
        _id: '507f1f77bcf86cd799439033',
        studentId: '1SI22CS003',
        name: 'Admin Student',
        email: 'mreducator4566@gmail.com',
        role: 'SUPER_ADMIN',
        registrationStatus: 'completed',
        isTestUser: false
    };

    const adminDto = authV2Dto.toStudentResponseDto(mockAdminStudent);
    assert.strictEqual(adminDto.isAdmin, true);
    assert.deepStrictEqual(adminDto.access, { plan: 'PLUS', source: 'ADMIN' });
    assert.strictEqual(adminDto.subscription, 'plus');
});

test('CASE 8: Mongoose User and StudentAccount models define isTestUser schema property', () => {
    const User = require('../../models/User');
    const StudentAccount = require('../../models/StudentAccount');

    const userPath = User.schema.path('isTestUser');
    assert.ok(userPath, 'User model must have isTestUser schema path');
    assert.strictEqual(userPath.instance, 'Boolean', 'User.isTestUser must be Boolean');
    assert.strictEqual(userPath.defaultValue, false, 'User.isTestUser must default to false');

    const studentPath = StudentAccount.schema.path('isTestUser');
    assert.ok(studentPath, 'StudentAccount model must have isTestUser schema path');
    assert.strictEqual(studentPath.instance, 'Boolean', 'StudentAccount.isTestUser must be Boolean');
    assert.strictEqual(studentPath.defaultValue, false, 'StudentAccount.isTestUser must default to false');
});

// ============================================================================
// STEP-03 TEST SUITE: Admin Users + Plus Access Management
// ============================================================================

test('CASE 9: Disabling test user returns normal student to FREE / NONE', () => {
    // Normal student with test user true
    const activeTestUser = {
        _id: 'user_norm_01',
        email: 'rahul@student.edu',
        role: 'student',
        isAdmin: false,
        isTestUser: true
    };
    const accessActive = resolvePlusAccess(activeTestUser);
    assert.strictEqual(accessActive.plan, 'PLUS');
    assert.strictEqual(accessActive.source, 'TEST_USER');

    // Admin disables test user
    const disabledTestUser = {
        ...activeTestUser,
        isTestUser: false
    };
    const accessDisabled = resolvePlusAccess(disabledTestUser);
    assert.strictEqual(accessDisabled.plan, 'FREE');
    assert.strictEqual(accessDisabled.source, 'NONE');
    assert.strictEqual(accessDisabled.hasPlusAccess, false);
});

test('CASE 10: Disabling test user on an Admin retains PLUS / ADMIN', () => {
    // Admin user also flagged as test user
    const adminWithTestFlag = {
        _id: 'admin_test_02',
        email: 'depthead@askursenior.org',
        role: 'ADMIN',
        isAdmin: true,
        isTestUser: true
    };
    const accessBefore = resolvePlusAccess(adminWithTestFlag);
    assert.strictEqual(accessBefore.plan, 'PLUS');
    assert.strictEqual(accessBefore.source, 'ADMIN');

    // Test flag toggled off
    const adminWithoutTestFlag = {
        ...adminWithTestFlag,
        isTestUser: false
    };
    const accessAfter = resolvePlusAccess(adminWithoutTestFlag);
    assert.strictEqual(accessAfter.plan, 'PLUS');
    assert.strictEqual(accessAfter.source, 'ADMIN');
    assert.strictEqual(accessAfter.hasPlusAccess, true);
});

test('CASE 11: AdminLog schema supports TEST_USER_ENABLED and TEST_USER_DISABLED', () => {
    const AdminLog = require('../../models/AdminLog');
    const actionEnum = AdminLog.schema.path('action').enumValues;

    assert.ok(actionEnum.includes('TEST_USER_ENABLED'), 'AdminLog must include TEST_USER_ENABLED');
    assert.ok(actionEnum.includes('TEST_USER_DISABLED'), 'AdminLog must include TEST_USER_DISABLED');
});

test('CASE 12: updateTestUserAccess controller rejects non-boolean isTestUser and invalid ID', async () => {
    const { updateTestUserAccess } = require('../../controllers/analyticsController');

    // 12a. Non-boolean isTestUser
    let statusCode = null;
    let responseBody = null;
    const reqInvalidBody = {
        params: { userId: '507f1f77bcf86cd799439011' },
        body: { isTestUser: 'yes' }
    };
    const resInvalidBody = {
        status: (code) => {
            statusCode = code;
            return {
                json: (body) => { responseBody = body; }
            };
        }
    };
    await updateTestUserAccess(reqInvalidBody, resInvalidBody);
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.error, 'isTestUser must be a boolean');

    // 12b. Invalid ObjectId format
    statusCode = null;
    responseBody = null;
    const reqInvalidId = {
        params: { userId: 'not-a-valid-id' },
        body: { isTestUser: true }
    };
    const resInvalidId = {
        status: (code) => {
            statusCode = code;
            return {
                json: (body) => { responseBody = body; }
            };
        }
    };
    await updateTestUserAccess(reqInvalidId, resInvalidId);
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody.error, 'Invalid user ID format');
});

