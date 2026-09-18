const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const {
    isScopeMatching,
    hasPermission,
    validateAdminAccess,
    requireScope
} = require('../middleware/scopeAuthorization');

// Pre-define test ObjectIds
const collegeSIT = new mongoose.Types.ObjectId();
const collegeBMS = new mongoose.Types.ObjectId();
const progBE = new mongoose.Types.ObjectId();
const progMCA = new mongoose.Types.ObjectId();
const branchCSE = new mongoose.Types.ObjectId();
const branchECE = new mongoose.Types.ObjectId();
const batch2022 = new mongoose.Types.ObjectId();
const secA = new mongoose.Types.ObjectId();
const secB = new mongoose.Types.ObjectId();
const secC = new mongoose.Types.ObjectId();

test('Academic Scope Authorization Engine', async (t) => {

    await t.test('1. isScopeMatching - exact section matches and section restrictions', () => {
        const adminScopes = [{
            college: collegeSIT,
            program: progBE,
            branch: branchCSE,
            batch: batch2022,
            sections: [secA, secB]
        }];

        // Accessing Sec A in SIT CSE
        assert.equal(
            isScopeMatching(adminScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secA
            }),
            true,
            'Should allow access to Section A'
        );

        // Accessing Sec B in SIT CSE
        assert.equal(
            isScopeMatching(adminScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secB
            }),
            true,
            'Should allow access to Section B'
        );

        // Accessing Sec C in SIT CSE (not in scopes.sections)
        assert.equal(
            isScopeMatching(adminScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secC
            }),
            false,
            'Should block access to unassigned Section C'
        );

        // Accessing ECE Branch in SIT
        assert.equal(
            isScopeMatching(adminScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchECE,
                sectionId: secA
            }),
            false,
            'Should block access to foreign branch ECE'
        );

        // Accessing different college BMS
        assert.equal(
            isScopeMatching(adminScopes, {
                collegeId: collegeBMS,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secA
            }),
            false,
            'Should block access to different college'
        );
    });

    await t.test('2. isScopeMatching - HoD wildcard section matching', () => {
        // HoD has empty sections array (representing wildcard all sections)
        const hodScopes = [{
            college: collegeSIT,
            program: progBE,
            branch: branchCSE,
            sections: []
        }];

        assert.equal(
            isScopeMatching(hodScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secA
            }),
            true,
            'HoD should have access to Section A'
        );

        assert.equal(
            isScopeMatching(hodScopes, {
                collegeId: collegeSIT,
                programId: progBE,
                branchId: branchCSE,
                sectionId: secC
            }),
            true,
            'HoD should have access to Section C via wildcard'
        );
    });

    await t.test('3. hasPermission - granular permission flags', () => {
        const permissions = {
            timetable: { view: true, create: true, update: false, publish: false },
            subjects: { view: true, publish: true }
        };

        assert.equal(hasPermission(permissions, 'timetable', 'view'), true);
        assert.equal(hasPermission(permissions, 'timetable', 'create'), true);
        assert.equal(hasPermission(permissions, 'timetable', 'publish'), false);
        assert.equal(hasPermission(permissions, 'events', 'view'), false);
    });

    await t.test('4. validateAdminAccess - Super Admin unrestricted access', () => {
        const superAdmin = {
            _id: new mongoose.Types.ObjectId(),
            role: 'SUPER_ADMIN',
            name: 'Platform Root'
        };

        const result = validateAdminAccess(
            superAdmin,
            { collegeId: collegeBMS, branchId: branchECE, sectionId: secC },
            'timetable',
            'publish'
        );

        assert.equal(result.allowed, true, 'Super Admin should have unrestricted access');
    });

    await t.test('5. validateAdminAccess - Scoped Admin in-scope vs out-of-scope and permissions', () => {
        const scopedAdmin = {
            _id: new mongoose.Types.ObjectId(),
            role: 'ADMIN',
            scopes: [{
                college: collegeSIT,
                branch: branchCSE,
                sections: [secA]
            }],
            permissions: {
                timetable: { view: true, publish: false },
                subjects: { view: true, publish: true }
            }
        };

        // Allowed: in scope and has permission
        const pass = validateAdminAccess(
            scopedAdmin,
            { collegeId: collegeSIT, branchId: branchCSE, sectionId: secA },
            'subjects',
            'publish'
        );
        assert.equal(pass.allowed, true);

        // Denied: in scope but missing permission
        const noPerm = validateAdminAccess(
            scopedAdmin,
            { collegeId: collegeSIT, branchId: branchCSE, sectionId: secA },
            'timetable',
            'publish'
        );
        assert.equal(noPerm.allowed, false);
        assert.match(noPerm.reason, /Missing required permission/);

        // Denied: has permission but out of scope
        const outOfScope = validateAdminAccess(
            scopedAdmin,
            { collegeId: collegeSIT, branchId: branchCSE, sectionId: secB },
            'subjects',
            'publish'
        );
        assert.equal(outOfScope.allowed, false);
        assert.match(outOfScope.reason, /Out of authorized administrative scope/);
    });

    await t.test('6. requireScope Express Middleware execution', () => {
        const middleware = requireScope({
            module: 'timetable',
            action: 'view'
        });

        // Test 1: Allowed call
        let nextCalled = false;
        const reqAllowed = {
            admin: {
                role: 'ADMIN',
                scopes: [{ college: collegeSIT, branch: branchCSE }],
                permissions: { timetable: { view: true } }
            },
            params: {},
            body: { collegeId: collegeSIT.toString(), branchId: branchCSE.toString() },
            query: {}
        };
        const resAllowed = {
            status: () => resAllowed,
            json: () => {}
        };

        middleware(reqAllowed, resAllowed, () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true, 'Next() should be called when access is granted');
        assert.ok(reqAllowed.academicContext, 'academicContext should be attached to request');

        // Test 2: Denied call (HTTP 403)
        let responseStatus = null;
        let responseBody = null;
        const reqDenied = {
            admin: {
                role: 'ADMIN',
                scopes: [{ college: collegeSIT, branch: branchCSE }],
                permissions: { timetable: { view: true } }
            },
            params: {},
            body: { collegeId: collegeBMS.toString(), branchId: branchCSE.toString() }, // wrong college
            query: {}
        };
        const resDenied = {
            status: (code) => {
                responseStatus = code;
                return resDenied;
            },
            json: (data) => {
                responseBody = data;
            }
        };

        middleware(reqDenied, resDenied, () => {
            assert.fail('next() should not be called when denied');
        });

        assert.equal(responseStatus, 403, 'Should respond with HTTP 403 Forbidden');
        assert.equal(responseBody.success, false);
        assert.match(responseBody.error, /Out of authorized administrative scope/);
    });

    await t.test('7. Model compilation verification', () => {
        const College = require('../models/College');
        const AcademicProgram = require('../models/AcademicProgram');
        const AcademicBatch = require('../models/AcademicBatch');
        const AcademicSection = require('../models/AcademicSection');
        const Branch = require('../models/Branch');
        const Admin = require('../models/Admin');

        assert.ok(College.modelName === 'College');
        assert.ok(AcademicProgram.modelName === 'AcademicProgram');
        assert.ok(AcademicBatch.modelName === 'AcademicBatch');
        assert.ok(AcademicSection.modelName === 'AcademicSection');
        assert.ok(Branch.modelName === 'Branch');
        assert.ok(Admin.modelName === 'Admin');
    });
});
