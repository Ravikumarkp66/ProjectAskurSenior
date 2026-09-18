const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Import Step 1 Models
const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const Branch = require('../models/Branch');
const Scheme = require('../models/Scheme');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');
const Admin = require('../models/Admin');
const { SectionTimetable } = require('../models/SectionTimetable');
const CollegeEvent = require('../models/CollegeEvent');
const AcademicCalendarItem = require('../models/AcademicCalendarItem');
const User = require('../models/User');

// Import Authorization & Middleware
const {
    isScopeMatching,
    hasPermission,
    validateAdminAccess,
    requireScope
} = require('../middleware/scopeAuthorization');

// Import Controller for unit & boundary testing
const {
    createBatch,
    updateBatch,
    deleteBatch,
    createSection,
    updateSection,
    deleteSection,
    listSections,
    createSemester,
    updateSemester,
    deleteSemester,
    listSemesters
} = require('../controllers/academicStructureController');

function createMockRes() {
    const res = {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.payload = data;
            return this;
        }
    };
    return res;
}

test('PHASE B — STEP 1: Academic Structural Core & Scoped Administration', async (suite) => {

    // Fixture ObjectIds
    const sitCollegeId = new mongoose.Types.ObjectId();
    const bmsCollegeId = new mongoose.Types.ObjectId();
    const beProgId = new mongoose.Types.ObjectId();
    const mcaProgId = new mongoose.Types.ObjectId();
    const cseBranchId = new mongoose.Types.ObjectId();
    const eceBranchId = new mongoose.Types.ObjectId();
    const batch2022Id = new mongoose.Types.ObjectId();
    const batch2023Id = new mongoose.Types.ObjectId();
    const batch2024Id = new mongoose.Types.ObjectId();
    const secAId = new mongoose.Types.ObjectId();
    const secBId = new mongoose.Types.ObjectId();
    const secCId = new mongoose.Types.ObjectId();

    // Default safe stubs for unit tests without live MongoDB connection
    AcademicBatch.findOne = async () => null;
    AcademicBatch.countDocuments = async () => 0;
    User.countDocuments = async () => 0;
    SectionTimetable.countDocuments = async () => 0;
    CollegeEvent.countDocuments = async () => 0;
    AcademicCalendarItem.countDocuments = async () => 0;
    Semester.countDocuments = async () => 0;
    Semester.find = () => [];
    Semester.findOne = async (query) => {
        if (query && query.number && query.number.$gt) return null;
        return { _id: new mongoose.Types.ObjectId(), number: (query && query.number) || 1, batch: (query && query.batch) || batch2024Id };
    };
    AcademicSection.countDocuments = async () => 0;
    AcademicSection.findOne = async (query) => {
        if (query && query.semester && query.semester.$gt) return null;
        return null;
    };

    // =========================================================================
    // GROUP 1: STRUCTURE TESTS (1 - 12)
    // =========================================================================
    await suite.test('STRUCTURE: 1 - 12 Functional Hierarchy & Integrity', async (t) => {

        await t.test('1. Create college with valid unique code and slug', () => {
            const college = new College({
                _id: sitCollegeId,
                name: 'Siddaganga Institute of Technology',
                code: 'SIT',
                slug: 'sit-tumkur',
                status: 'Active'
            });
            const err = college.validateSync();
            assert.equal(err, undefined, 'Valid college document should pass validation');
            assert.equal(college.code, 'SIT');
            assert.equal(college.slug, 'sit-tumkur');
        });

        await t.test('2. Create scheme under college context', () => {
            const scheme = new Scheme({
                name: '2022 Scheme',
                code: 'SCHEME-2022',
                college: sitCollegeId,
                status: 'Active'
            });
            const err = scheme.validateSync();
            assert.equal(err, undefined);
            assert.equal(String(scheme.college), String(sitCollegeId));
        });

        await t.test('3. Create program and branch under correct college context', () => {
            const program = new AcademicProgram({
                _id: beProgId,
                college: sitCollegeId,
                name: 'Bachelor of Engineering',
                code: 'BE',
                level: 'Undergraduate',
                minSemesters: 1,
                maxSemesters: 8,
                hasBranches: true
            });
            assert.equal(program.validateSync(), undefined);

            const branch = new Branch({
                _id: cseBranchId,
                name: 'Computer Science and Engineering',
                shortName: 'CSE',
                college: sitCollegeId,
                program: beProgId
            });
            assert.equal(branch.validateSync(), undefined);
        });

        await t.test('4. Create batch with valid academic year range', () => {
            const batch = new AcademicBatch({
                _id: batch2022Id,
                name: '2022-2026',
                admissionYear: 2022,
                graduationYear: 2026,
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                status: 'Active'
            });
            assert.equal(batch.validateSync(), undefined);
            assert.equal(batch.admissionYear, 2022);
            assert.equal(batch.graduationYear, 2026);
        });

        await t.test('5. Create semester with official baseline start and end dates', () => {
            const sem = new Semester({
                college: sitCollegeId,
                program: beProgId,
                batch: batch2022Id,
                number: 5,
                sequence: 5,
                label: '5th Semester (Odd 2024)',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-12-31'),
                status: 'Active'
            });
            assert.equal(sem.validateSync(), undefined);
            assert.ok(sem.startDate < sem.endDate, 'Start date must precede end date');
        });

        await t.test('6. Create section linked to parent batch and semester', () => {
            const section = new AcademicSection({
                _id: secAId,
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2022Id,
                semester: 5,
                capacity: 65,
                status: 'Active'
            });
            assert.equal(section.validateSync(), undefined);
            assert.equal(section.name, 'A');
            assert.equal(section.capacity, 65);
        });

        await t.test('7. Prevent orphan records - required parent references enforced', () => {
            // Orphan section missing batch and college
            const orphanSection = new AcademicSection({
                name: 'A',
                semester: 5
            });
            const secErr = orphanSection.validateSync();
            assert.ok(secErr.errors.college, 'College is required for section');
            assert.ok(secErr.errors.program, 'Program is required for section');
            assert.ok(secErr.errors.batch, 'Batch is required for section');

            // Orphan batch missing program and college
            const orphanBatch = new AcademicBatch({
                name: '2024-2028',
                admissionYear: 2024,
                graduationYear: 2028
            });
            const batchErr = orphanBatch.validateSync();
            assert.ok(batchErr.errors.college, 'College is required for batch');
            assert.ok(batchErr.errors.program, 'Program is required for batch');
        });

        await t.test('8. Prevent invalid parent relationships (e.g. invalid date ranges)', () => {
            // Semester with start date AFTER end date
            const invalidSem = new Semester({
                number: 3,
                label: 'Invalid Sem',
                startDate: new Date('2025-05-01'),
                endDate: new Date('2025-01-01')
            });
            const semErr = invalidSem.validateSync();
            assert.ok(semErr, 'Semester validation should fail when startDate > endDate');
            assert.match(semErr.message, /startDate cannot be after endDate/);
        });

        await t.test('9. Support multiple schemes concurrently', () => {
            const scheme2018 = new Scheme({ name: '2018 Scheme', college: sitCollegeId });
            const scheme2022 = new Scheme({ name: '2022 Scheme', college: sitCollegeId });
            const scheme2024 = new Scheme({ name: '2024 Scheme', college: sitCollegeId });

            assert.equal(scheme2018.validateSync(), undefined);
            assert.equal(scheme2022.validateSync(), undefined);
            assert.equal(scheme2024.validateSync(), undefined);
        });

        await t.test('10. Support multiple coexisting batches', () => {
            const batches = [
                new AcademicBatch({ name: '2022-2026', admissionYear: 2022, graduationYear: 2026, college: sitCollegeId, program: beProgId }),
                new AcademicBatch({ name: '2023-2027', admissionYear: 2023, graduationYear: 2027, college: sitCollegeId, program: beProgId }),
                new AcademicBatch({ name: '2024-2028', admissionYear: 2024, graduationYear: 2028, college: sitCollegeId, program: beProgId })
            ];
            batches.forEach(b => assert.equal(b.validateSync(), undefined));
            assert.equal(batches.length, 3);
        });

        await t.test('11. Support multiple sections within the same batch & branch', () => {
            const sections = ['A', 'B', 'C'].map(secName => new AcademicSection({
                name: secName,
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2022Id,
                semester: 6
            }));
            sections.forEach(s => assert.equal(s.validateSync(), undefined));
            assert.equal(sections.length, 3);
        });

        await t.test('12. Support context without sections (single cohort e.g. MCA)', () => {
            const mcaBatch = new AcademicBatch({
                name: 'MCA 2024-2026',
                admissionYear: 2024,
                graduationYear: 2026,
                college: sitCollegeId,
                program: mcaProgId,
                branch: null // Single-cohort program: branch is null
            });
            assert.equal(mcaBatch.validateSync(), undefined);
            assert.equal(mcaBatch.branch, null);
        });
    });

    // =========================================================================
    // GROUP 2: PERMISSIONS TESTS (13 - 16)
    // =========================================================================
    await suite.test('PERMISSIONS: 13 - 16 Role & Action Enforcement', async (t) => {

        await t.test('13. Super Admin has unrestricted access', () => {
            const superAdmin = {
                role: 'SUPER_ADMIN',
                name: 'Root Admin'
            };
            const result = validateAdminAccess(
                superAdmin,
                { collegeId: sitCollegeId, branchId: cseBranchId },
                'academic_structure',
                'delete'
            );
            assert.equal(result.allowed, true);
        });

        await t.test('14. Admin with permission authorized within scope', () => {
            const adminWithPerm = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: {
                    academic_structure: { view: true, update: true, create: true }
                }
            };
            const result = validateAdminAccess(
                adminWithPerm,
                { collegeId: sitCollegeId, branchId: cseBranchId },
                'academic_structure',
                'update'
            );
            assert.equal(result.allowed, true);
        });

        await t.test('15. Admin without permission rejected with 403', () => {
            const adminWithoutPerm = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: {
                    academic_structure: { view: true, create: false, update: false, delete: false }
                }
            };
            const result = validateAdminAccess(
                adminWithoutPerm,
                { collegeId: sitCollegeId, branchId: cseBranchId },
                'academic_structure',
                'delete'
            );
            assert.equal(result.allowed, false);
            assert.match(result.reason, /Missing required permission: academic_structure\.delete/);
        });

        await t.test('16. Student user denied administrative access', () => {
            const studentUser = {
                role: 'student',
                email: 'student@sit.ac.in'
            };
            const result = validateAdminAccess(
                studentUser,
                { collegeId: sitCollegeId },
                'academic_structure',
                'view'
            );
            assert.equal(result.allowed, false);
            assert.match(result.reason, /Invalid administrative role/);
        });
    });

    // =========================================================================
    // GROUP 3: SCOPE TESTS (17 - 23)
    // =========================================================================
    await suite.test('SCOPE: 17 - 23 Hierarchical Scoping & IDOR Defense', async (t) => {

        await t.test('17. College-wide admin access descends to all branches & sections', () => {
            const collegeAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId }],
                permissions: { academic_structure: { view: true } }
            };

            assert.equal(
                isScopeMatching(collegeAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: cseBranchId,
                    sectionId: secAId
                }),
                true,
                'College admin should have access to SIT CSE Section A'
            );

            assert.equal(
                isScopeMatching(collegeAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: eceBranchId,
                    sectionId: secBId
                }),
                true,
                'College admin should have access to SIT ECE Section B'
            );
        });

        await t.test('18. Branch-scoped admin access restricted to designated branch', () => {
            const branchAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: { academic_structure: { view: true } }
            };

            assert.equal(
                isScopeMatching(branchAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: cseBranchId
                }),
                true
            );
        });

        await t.test('19. Section-scoped admin restricted to specific assigned sections', () => {
            const sectionAdmin = {
                role: 'ADMIN',
                scopes: [{
                    college: sitCollegeId,
                    branch: cseBranchId,
                    batch: batch2022Id,
                    sections: [secAId, secBId]
                }],
                permissions: { academic_structure: { view: true } }
            };

            assert.equal(
                isScopeMatching(sectionAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: cseBranchId,
                    sectionId: secAId
                }),
                true,
                'Should access allowed Section A'
            );

            assert.equal(
                isScopeMatching(sectionAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: cseBranchId,
                    sectionId: secCId
                }),
                false,
                'Should be denied access to unassigned Section C'
            );
        });

        await t.test('20. Cross-branch access denied', () => {
            const cseAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }]
            };
            assert.equal(
                isScopeMatching(cseAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: eceBranchId
                }),
                false,
                'CSE admin must be blocked from accessing ECE'
            );
        });

        await t.test('21. Cross-section access denied', () => {
            const secAAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId, sections: [secAId] }]
            };
            assert.equal(
                isScopeMatching(secAAdmin.scopes, {
                    collegeId: sitCollegeId,
                    branchId: cseBranchId,
                    sectionId: secBId
                }),
                false,
                'Section A admin must be blocked from Section B'
            );
        });

        await t.test('22. Cross-college access denied', () => {
            const sitAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId }]
            };
            assert.equal(
                isScopeMatching(sitAdmin.scopes, {
                    collegeId: bmsCollegeId
                }),
                false,
                'SIT admin must be blocked from BMS college'
            );
        });

        await t.test('23. Manipulated resource ID denied (IDOR protection)', () => {
            const scopedAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId, sections: [secAId] }],
                permissions: { academic_structure: { view: true, update: true } }
            };

            // Attacker puts section A in params but secretly manipulates to fetch foreign section
            const manipulatedContext = {
                collegeId: sitCollegeId,
                branchId: eceBranchId, // Foreign branch
                sectionId: secCId
            };

            const result = validateAdminAccess(scopedAdmin, manipulatedContext, 'academic_structure', 'update');
            assert.equal(result.allowed, false);
            assert.match(result.reason, /Out of authorized administrative scope/);
        });
    });

    // =========================================================================
    // GROUP 4: SECURITY TESTS (24 - 26)
    // =========================================================================
    await suite.test('SECURITY: 24 - 26 Server-Side Guard & Mutation Protection', async (t) => {

        await t.test('24. Direct API access outside scope denied via requireScope middleware', async () => {
            const middleware = requireScope({
                module: 'academic_structure',
                action: 'view'
            });

            let statusCode = null;
            let responseJson = null;

            const req = {
                admin: {
                    role: 'ADMIN',
                    scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                    permissions: { academic_structure: { view: true } }
                },
                params: { collegeId: bmsCollegeId.toString() }, // Target foreign college
                body: {},
                query: {}
            };

            const res = {
                status: (code) => { statusCode = code; return res; },
                json: (payload) => { responseJson = payload; return res; }
            };

            await middleware(req, res, () => {
                assert.fail('next() must not be called on unauthorized direct API access');
            });

            assert.equal(statusCode, 403, 'Must return HTTP 403 Forbidden');
            assert.equal(responseJson.success, false);
            assert.match(responseJson.error, /Out of authorized administrative scope/);
        });

        await t.test('25. Unauthorized update denied', () => {
            const scopedAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: { academic_structure: { view: true, update: true } }
            };
            const foreignTarget = {
                collegeId: sitCollegeId,
                branchId: eceBranchId // Different branch
            };
            const access = validateAdminAccess(scopedAdmin, foreignTarget, 'academic_structure', 'update');
            assert.equal(access.allowed, false);
        });

        await t.test('26. Unauthorized delete denied', () => {
            const scopedAdmin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: { academic_structure: { view: true, delete: false } } // No delete perm
            };
            const inScopeTarget = {
                collegeId: sitCollegeId,
                branchId: cseBranchId
            };
            const access = validateAdminAccess(scopedAdmin, inScopeTarget, 'academic_structure', 'delete');
            assert.equal(access.allowed, false);
            assert.match(access.reason, /Missing required permission/);
        });
    });

    // =========================================================================
    // GROUP 5: SECTION 23 EDGE CASES
    // =========================================================================
    await suite.test('EDGE CASES: Section 23 Comprehensive Boundary Tests', async (t) => {

        // College Edge Cases
        await t.test('College: Duplicate college identifier validation', () => {
            const col1 = new College({ name: 'Col 1', code: 'SIT', slug: 'sit' });
            assert.equal(col1.code, 'SIT');
            // Mongoose schema enforces uppercase code and trim
            const col2 = new College({ name: 'Col 2', code: 'sit', slug: 'sit' });
            assert.equal(col2.code, 'SIT', 'Code should normalize to uppercase');
        });

        await t.test('College: Inactive college state', () => {
            const inactiveCol = new College({
                name: 'Inactive College',
                code: 'INC',
                slug: 'inc',
                status: 'Inactive'
            });
            assert.equal(inactiveCol.status, 'Inactive');
            assert.equal(inactiveCol.validateSync(), undefined);
        });

        // Scheme Edge Cases
        await t.test('Scheme: Same scheme name across different colleges supported', () => {
            const sitScheme = new Scheme({ name: '2022 Scheme', college: sitCollegeId });
            const bmsScheme = new Scheme({ name: '2022 Scheme', college: bmsCollegeId });
            assert.equal(sitScheme.validateSync(), undefined);
            assert.equal(bmsScheme.validateSync(), undefined);
            assert.notEqual(String(sitScheme.college), String(bmsScheme.college));
        });

        // Branch/Program Edge Cases
        await t.test('Branch/Program: Same branch name under different colleges and archived state', () => {
            const sitCSE = new Branch({ name: 'Computer Science', shortName: 'CSE-SIT', college: sitCollegeId });
            const bmsCSE = new Branch({ name: 'Computer Science', shortName: 'CSE-BMS', college: bmsCollegeId });
            const archivedBranch = new Branch({
                name: 'Telecommunication Engineering',
                shortName: 'TCE',
                college: sitCollegeId,
                status: 'Hidden'
            });

            assert.equal(sitCSE.validateSync(), undefined);
            assert.equal(bmsCSE.validateSync(), undefined);
            assert.equal(archivedBranch.status, 'Hidden');
        });

        // Batch Edge Cases
        await t.test('Batch: Multiple active batches and archived batches', () => {
            const activeBatch = new AcademicBatch({
                name: '2024-2028',
                admissionYear: 2024,
                graduationYear: 2028,
                college: sitCollegeId,
                program: beProgId,
                status: 'Active'
            });
            const archivedBatch = new AcademicBatch({
                name: '2019-2023',
                admissionYear: 2019,
                graduationYear: 2023,
                college: sitCollegeId,
                program: beProgId,
                status: 'Archived'
            });
            assert.equal(activeBatch.status, 'Active');
            assert.equal(archivedBatch.status, 'Archived');
        });

        // Semester Edge Cases
        await t.test('Semester: Different semester counts (MCA: 4 vs BE: 8)', () => {
            const mcaSem4 = new Semester({
                college: sitCollegeId,
                program: mcaProgId,
                number: 4,
                label: 'MCA Final Semester',
                status: 'Active'
            });
            const beSem8 = new Semester({
                college: sitCollegeId,
                program: beProgId,
                number: 8,
                label: 'BE 8th Semester',
                status: 'Active'
            });
            assert.equal(mcaSem4.validateSync(), undefined);
            assert.equal(beSem8.validateSync(), undefined);
            assert.equal(mcaSem4.number, 4);
            assert.equal(beSem8.number, 8);
        });

        await t.test('Semester: Future semester scheduled', () => {
            const futureSem = new Semester({
                college: sitCollegeId,
                program: beProgId,
                number: 7,
                label: '7th Sem',
                startDate: new Date('2027-08-01'),
                endDate: new Date('2027-12-15'),
                status: 'Upcoming'
            });
            assert.equal(futureSem.validateSync(), undefined);
            assert.equal(futureSem.status, 'Upcoming');
        });

        // Section Edge Cases
        await t.test('Section: Same section name under different batches and programs', () => {
            const secABatch22 = new AcademicSection({
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2022Id,
                semester: 5
            });
            const secABatch23 = new AcademicSection({
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2023Id,
                semester: 3
            });
            assert.equal(secABatch22.validateSync(), undefined);
            assert.equal(secABatch23.validateSync(), undefined);
            assert.equal(secABatch22.name, secABatch23.name);
            assert.notEqual(String(secABatch22.batch), String(secABatch23.batch));
        });

        // Admin Edge Cases
        await t.test('Admin: Admin with no scope', () => {
            const noScopeAdmin = {
                role: 'ADMIN',
                scopes: [],
                permissions: { academic_structure: { view: true } }
            };
            const res = validateAdminAccess(noScopeAdmin, { collegeId: sitCollegeId }, 'academic_structure', 'view');
            assert.equal(res.allowed, false, 'Admin with no assigned scope should be blocked');
        });

        await t.test('Admin: Admin with multiple scopes', () => {
            const multiScopeAdmin = {
                role: 'ADMIN',
                scopes: [
                    { college: sitCollegeId, branch: cseBranchId },
                    { college: sitCollegeId, branch: eceBranchId }
                ],
                permissions: { academic_structure: { view: true } }
            };

            assert.equal(
                isScopeMatching(multiScopeAdmin.scopes, { collegeId: sitCollegeId, branchId: cseBranchId }),
                true,
                'Should access CSE'
            );
            assert.equal(
                isScopeMatching(multiScopeAdmin.scopes, { collegeId: sitCollegeId, branchId: eceBranchId }),
                true,
                'Should access ECE'
            );
            assert.equal(
                isScopeMatching(multiScopeAdmin.scopes, { collegeId: bmsCollegeId, branchId: cseBranchId }),
                false,
                'Should not access BMS'
            );
        });

        await t.test('Admin: Admin transferred from one branch to another', () => {
            const admin = {
                role: 'ADMIN',
                scopes: [{ college: sitCollegeId, branch: cseBranchId }],
                permissions: { academic_structure: { view: true } }
            };

            // Before transfer: access to CSE
            assert.equal(isScopeMatching(admin.scopes, { collegeId: sitCollegeId, branchId: cseBranchId }), true);
            assert.equal(isScopeMatching(admin.scopes, { collegeId: sitCollegeId, branchId: eceBranchId }), false);

            // Execute transfer: update scopes to ECE
            admin.scopes = [{ college: sitCollegeId, branch: eceBranchId }];

            // After transfer: access to ECE only
            assert.equal(isScopeMatching(admin.scopes, { collegeId: sitCollegeId, branchId: cseBranchId }), false);
            assert.equal(isScopeMatching(admin.scopes, { collegeId: sitCollegeId, branchId: eceBranchId }), true);
        });
    });

    // =========================================================================
    // GROUP 6: V1 COHORT BATCHES (27 - 34) SIT B.E. Cohort-Level Batch Rules & Safety
    // =========================================================================
    await suite.test('V1 COHORT BATCHES: 27 - 34 SIT B.E. Cohort-Level Batch Rules & Safety', async (t) => {

        await t.test('27. Cohort-level batch model validation succeeds with branch: null', () => {
            const cohortBatch = new AcademicBatch({
                name: '2025-2029',
                admissionYear: 2025,
                graduationYear: 2029,
                college: sitCollegeId,
                program: beProgId,
                branch: null, // Cohort-level B.E., not separated by branch
                status: 'Active'
            });
            const err = cohortBatch.validateSync();
            assert.equal(err, undefined, 'Cohort batch with branch: null must be valid');
            assert.equal(cohortBatch.branch, null);
        });

        await t.test('28. Batch model validation enforces admissionYear < graduationYear and year bounds', () => {
            // Rejects admissionYear >= graduationYear
            const invertedBatch = new AcademicBatch({
                name: '2029-2025',
                admissionYear: 2029,
                graduationYear: 2025,
                college: sitCollegeId,
                program: beProgId,
                status: 'Active'
            });
            const errInverted = invertedBatch.validateSync();
            assert.ok(errInverted, 'Inverted years must fail validation');
            assert.match(errInverted.errors['graduationYear'].message, /Graduation year must be after admission year/);

            // Rejects years out of bounds (<1950)
            const outOfBoundsBatch = new AcademicBatch({
                name: '1940-1944',
                admissionYear: 1940,
                graduationYear: 1944,
                college: sitCollegeId,
                program: beProgId,
                status: 'Active'
            });
            const errBounds = outOfBoundsBatch.validateSync();
            assert.ok(errBounds, 'Years < 1950 must fail validation');
            assert.ok(errBounds.errors['admissionYear']);
        });

        await t.test('29. Batch status enum restricts to [Active, Graduated, Archived]', () => {
            const validActive = new AcademicBatch({
                name: '2024-2028',
                admissionYear: 2024,
                graduationYear: 2028,
                college: sitCollegeId,
                program: beProgId,
                status: 'Active'
            });
            assert.equal(validActive.validateSync(), undefined);

            const validGraduated = new AcademicBatch({
                name: '2020-2024',
                admissionYear: 2020,
                graduationYear: 2024,
                college: sitCollegeId,
                program: beProgId,
                status: 'Graduated'
            });
            assert.equal(validGraduated.validateSync(), undefined);

            const validArchived = new AcademicBatch({
                name: '2016-2020',
                admissionYear: 2016,
                graduationYear: 2020,
                college: sitCollegeId,
                program: beProgId,
                status: 'Archived'
            });
            assert.equal(validArchived.validateSync(), undefined);

            const invalidStatus = new AcademicBatch({
                name: '2025-2029',
                admissionYear: 2025,
                graduationYear: 2029,
                college: sitCollegeId,
                program: beProgId,
                status: 'Pending'
            });
            const err = invalidStatus.validateSync();
            assert.ok(err, 'Arbitrary status must fail validation');
            assert.ok(err.errors['status']);
        });

        await t.test('30. Compound unique index protects against duplicate cohorts under same college & program', () => {
            const indexes = AcademicBatch.schema.indexes();
            const compoundIndex = indexes.find(([fields]) =>
                fields && fields.college === 1 && fields.program === 1 && fields.branch === 1 && fields.admissionYear === 1
            );
            assert.ok(compoundIndex, 'Compound index { college, program, branch, admissionYear } must be declared');
            assert.equal(compoundIndex[1].unique, true, 'Compound index must be unique');
        });

        await t.test('31. Controller createBatch validates admission year and year bounds', async () => {
            // Missing admission year
            const res1 = createMockRes();
            await createBatch({ body: {} }, res1);
            assert.equal(res1.statusCode, 400);
            assert.match(res1.payload.error, /Admission year is required/);

            // Inverted years
            const res2 = createMockRes();
            await createBatch({ body: { admissionYear: 2028, graduationYear: 2024 } }, res2);
            assert.equal(res2.statusCode, 400);
            assert.match(res2.payload.error, /Graduation year must be after admission year/);

            // Out of bounds
            const res3 = createMockRes();
            await createBatch({ body: { admissionYear: 1940, graduationYear: 1944 } }, res3);
            assert.equal(res3.statusCode, 400);
            assert.match(res3.payload.error, /Academic years must be between 1950 and 2100/);
        });

        await t.test('32. Controller createBatch auto-resolves SIT College and B.E. Program when omitted', async () => {
            const origCollegeFindOne = College.findOne;
            const origProgFindOne = AcademicProgram.findOne;
            const origBatchSave = AcademicBatch.prototype.save;

            try {
                College.findOne = async () => ({ _id: sitCollegeId, name: 'SIT', code: 'SIT' });
                AcademicProgram.findOne = async () => ({ _id: beProgId, name: 'Bachelor of Engineering', code: 'B.E' });
                let savedBatch = null;
                AcademicBatch.prototype.save = async function() {
                    savedBatch = this;
                    return this;
                };

                const req = { body: { admissionYear: 2025 } };
                const res = createMockRes();
                await createBatch(req, res);

                assert.equal(res.statusCode, 201);
                assert.ok(savedBatch);
                assert.equal(String(savedBatch.college), String(sitCollegeId));
                assert.equal(String(savedBatch.program), String(beProgId));
                assert.equal(savedBatch.branch, null);
                assert.equal(savedBatch.admissionYear, 2025);
                assert.equal(savedBatch.graduationYear, 2029); // auto-calculated + 4
                assert.equal(savedBatch.name, '2025-2029'); // auto-generated name
            } finally {
                College.findOne = origCollegeFindOne;
                AcademicProgram.findOne = origProgFindOne;
                AcademicBatch.prototype.save = origBatchSave;
            }
        });

        await t.test('33. Terminal academic state guard: Graduated -> Active blocked without forceTransition', async () => {
            const origFindById = AcademicBatch.findById;

            try {
                AcademicBatch.findById = async () => ({
                    _id: batch2022Id,
                    name: '2022-2026',
                    admissionYear: 2022,
                    graduationYear: 2026,
                    status: 'Graduated',
                    save: async function() { return this; }
                });

                // Attempt casual status change from Graduated to Active
                const req1 = {
                    params: { id: batch2022Id.toString() },
                    body: { status: 'Active' }
                };
                const res1 = createMockRes();
                await updateBatch(req1, res1);

                assert.equal(res1.statusCode, 400);
                assert.match(res1.payload.error, /Graduated is a terminal academic state/);

                // Attempt status change with explicit forceTransition: true
                const req2 = {
                    params: { id: batch2022Id.toString() },
                    body: { status: 'Active', forceTransition: true }
                };
                const res2 = createMockRes();
                await updateBatch(req2, res2);

                assert.equal(res2.statusCode, 200);
                assert.equal(res2.payload.data.status, 'Active');
            } finally {
                AcademicBatch.findById = origFindById;
            }
        });

        await t.test('34. Delete safety: blocked when dependent sections or semesters exist, allowed when empty', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origSectionCount = AcademicSection.countDocuments;
            const origSemesterCount = Semester.countDocuments;
            const origBatchDelete = AcademicBatch.findByIdAndDelete;

            try {
                const mockBatch = {
                    _id: batch2022Id,
                    name: '2022-2026'
                };
                AcademicBatch.findById = async () => mockBatch;

                // Case A: Has dependent sections -> Blocked
                AcademicSection.countDocuments = async () => 3;
                Semester.countDocuments = async () => 0;

                const resBlocked = createMockRes();
                await deleteBatch({ params: { id: batch2022Id.toString() } }, resBlocked);

                assert.equal(resBlocked.statusCode, 400);
                assert.match(resBlocked.payload.error, /Cannot delete batch: 3 section\(s\)/);

                // Case B: No dependent sections or semesters -> Allowed
                AcademicSection.countDocuments = async () => 0;
                Semester.countDocuments = async () => 0;
                let deletedId = null;
                AcademicBatch.findByIdAndDelete = async (id) => { deletedId = id; return mockBatch; };

                const resAllowed = createMockRes();
                await deleteBatch({ params: { id: batch2022Id.toString() } }, resAllowed);

                assert.equal(resAllowed.statusCode, 200);
                assert.equal(resAllowed.payload.success, true);
                assert.equal(String(deletedId), String(batch2022Id));
            } finally {
                AcademicBatch.findById = origBatchFindById;
                AcademicSection.countDocuments = origSectionCount;
                Semester.countDocuments = origSemesterCount;
                AcademicBatch.findByIdAndDelete = origBatchDelete;
            }
        });
    });

    // =========================================================================
    // GROUP 7: V1 CLASS SECTIONS: 35 - 43 SIT B.E. Hierarchy, Name Validation, & Safety
    // =========================================================================
    await suite.test('V1 CLASS SECTIONS: 35 - 43 SIT B.E. Hierarchy, Name Validation, & Safety', async (t) => {

        await t.test('35. Controller createSection auto-derives college and program from parent batch', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;
            const origSectionSave = AcademicSection.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: {
                            _id: beProgId,
                            name: 'Bachelor of Engineering',
                            code: 'B.E',
                            hasBranches: true,
                            maxSemesters: 8
                        }
                    })
                });

                Branch.findById = async () => ({
                    _id: cseBranchId,
                    name: 'Computer Science and Engineering',
                    shortName: 'CSE'
                });

                let savedSection = null;
                AcademicSection.prototype.save = async function() {
                    savedSection = this;
                    return this;
                };

                const req = {
                    body: {
                        batchId: batch2024Id.toString(),
                        branchId: cseBranchId.toString(),
                        semester: 1,
                        name: 'a', // should be uppercase normalized to 'A'
                        capacity: 65
                    }
                };
                const res = createMockRes();
                await createSection(req, res);

                assert.equal(res.statusCode, 201);
                assert.ok(savedSection);
                assert.equal(String(savedSection.college), String(sitCollegeId));
                assert.equal(String(savedSection.program), String(beProgId));
                assert.equal(String(savedSection.batch), String(batch2024Id));
                assert.equal(String(savedSection.branch), String(cseBranchId));
                assert.equal(savedSection.semester, 1);
                assert.equal(savedSection.name, 'A');
                assert.equal(savedSection.capacity, 65);
                assert.equal(savedSection.status, 'Active');
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
                AcademicSection.prototype.save = origSectionSave;
            }
        });

        await t.test('36. Strict section name validation: accepts uppercase letter(s) with optional number, rejects symbols and invalid patterns', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;
            const origSectionSave = AcademicSection.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, hasBranches: true, maxSemesters: 8 }
                    })
                });
                Branch.findById = async () => ({ _id: cseBranchId });
                AcademicSection.prototype.save = async function() { return this; };

                // Valid section names: A, B, C, A1, B1, CS1, a
                const validNames = ['A', 'B', 'C', 'A1', 'B1', 'CS1', 'a'];
                for (const validName of validNames) {
                    const req = {
                        body: {
                            batchId: batch2024Id.toString(),
                            branchId: cseBranchId.toString(),
                            semester: 1,
                            name: validName
                        }
                    };
                    const res = createMockRes();
                    await createSection(req, res);
                    assert.equal(res.statusCode, 201, `Expected "${validName}" to be valid`);
                }

                // Invalid section names: 1, Section A, A@#, A12, empty
                const invalidNames = ['1', 'Section A', 'A@#', 'A12', '', '   '];
                for (const invalidName of invalidNames) {
                    const req = {
                        body: {
                            batchId: batch2024Id.toString(),
                            branchId: cseBranchId.toString(),
                            semester: 1,
                            name: invalidName
                        }
                    };
                    const res = createMockRes();
                    await createSection(req, res);
                    assert.equal(res.statusCode, 400, `Expected "${invalidName}" to be rejected`);
                    assert.match(res.payload.error, /Section name/);
                }
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
                AcademicSection.prototype.save = origSectionSave;
            }
        });

        await t.test('37. Branch requirement: required for B.E. programs, rejected if missing or non-existent', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, hasBranches: true, maxSemesters: 8 }
                    })
                });

                // Missing branchId
                const reqNoBranch = {
                    body: {
                        batchId: batch2024Id.toString(),
                        semester: 1,
                        name: 'A'
                    }
                };
                const resNoBranch = createMockRes();
                await createSection(reqNoBranch, resNoBranch);
                assert.equal(resNoBranch.statusCode, 400);
                assert.match(resNoBranch.payload.error, /Branch is required for this program/);

                // Non-existent branchId
                Branch.findById = async () => null;
                const reqInvalidBranch = {
                    body: {
                        batchId: batch2024Id.toString(),
                        branchId: new mongoose.Types.ObjectId().toString(),
                        semester: 1,
                        name: 'A'
                    }
                };
                const resInvalidBranch = createMockRes();
                await createSection(reqInvalidBranch, resInvalidBranch);
                assert.equal(resInvalidBranch.statusCode, 400);
                assert.match(resInvalidBranch.payload.error, /Referenced branch does not exist/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
            }
        });

        await t.test('38. Semester validation: must be integer between 1 and program.maxSemesters', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, hasBranches: true, maxSemesters: 8 }
                    })
                });
                Branch.findById = async () => ({ _id: cseBranchId });

                // Test out-of-bounds semesters: 0, 9, -1, 2.5
                const testCases = [0, 9, -1, 2.5];
                for (const sem of testCases) {
                    const req = {
                        body: {
                            batchId: batch2024Id.toString(),
                            branchId: cseBranchId.toString(),
                            semester: sem,
                            name: 'A'
                        }
                    };
                    const res = createMockRes();
                    await createSection(req, res);
                    assert.equal(res.statusCode, 400);
                    assert.match(res.payload.error, /Semester must be an integer between 1 and 8/);
                }
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
            }
        });

        await t.test('39. Capacity validation: default 60, validates 1-500 bounds', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;
            const origSectionSave = AcademicSection.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, hasBranches: true, maxSemesters: 8 }
                    })
                });
                Branch.findById = async () => ({ _id: cseBranchId });

                let savedSection = null;
                AcademicSection.prototype.save = async function() {
                    savedSection = this;
                    return this;
                };

                // Case A: Omitted capacity defaults to 60
                const reqDefault = {
                    body: {
                        batchId: batch2024Id.toString(),
                        branchId: cseBranchId.toString(),
                        semester: 1,
                        name: 'A'
                    }
                };
                const resDefault = createMockRes();
                await createSection(reqDefault, resDefault);
                assert.equal(resDefault.statusCode, 201);
                assert.equal(savedSection.capacity, 60);

                // Case B: Capacity 0 or 501 rejected
                for (const badCap of [0, 501, -10]) {
                    const reqBad = {
                        body: {
                            batchId: batch2024Id.toString(),
                            branchId: cseBranchId.toString(),
                            semester: 1,
                            name: 'A',
                            capacity: badCap
                        }
                    };
                    const resBad = createMockRes();
                    await createSection(reqBad, resBad);
                    assert.equal(resBad.statusCode, 400);
                    assert.match(resBad.payload.error, /Capacity must be between 1 and 500/);
                }
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
                AcademicSection.prototype.save = origSectionSave;
            }
        });

        await t.test('40. Compound uniqueness error handling: duplicate section returns 400 with friendly message', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;
            const origSectionSave = AcademicSection.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, hasBranches: true, maxSemesters: 8 }
                    })
                });
                Branch.findById = async () => ({ _id: cseBranchId });

                AcademicSection.prototype.save = async function() {
                    const err = new Error('E11000 duplicate key error collection: test.academic_sections');
                    err.code = 11000;
                    throw err;
                };

                const req = {
                    body: {
                        batchId: batch2024Id.toString(),
                        branchId: cseBranchId.toString(),
                        semester: 1,
                        name: 'A'
                    }
                };
                const res = createMockRes();
                await createSection(req, res);

                assert.equal(res.statusCode, 400);
                assert.match(res.payload.error, /already exists for this batch, branch, and semester/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
                AcademicSection.prototype.save = origSectionSave;
            }
        });

        await t.test('41. Multi-branch & multi-semester isolation: allows same section name across branches or semesters', () => {
            // Model validation check:
            // Section A in CSE vs Section A in ISE for the same batch & semester
            const secCSE = new AcademicSection({
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2024Id,
                semester: 1,
                capacity: 60
            });
            assert.equal(secCSE.validateSync(), undefined);

            const secISE = new AcademicSection({
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: eceBranchId,
                batch: batch2024Id,
                semester: 1,
                capacity: 60
            });
            assert.equal(secISE.validateSync(), undefined);

            // Section A in Sem 1 vs Section A in Sem 2 for the same branch
            const secSem2 = new AcademicSection({
                name: 'A',
                college: sitCollegeId,
                program: beProgId,
                branch: cseBranchId,
                batch: batch2024Id,
                semester: 2,
                capacity: 60
            });
            assert.equal(secSem2.validateSync(), undefined);
        });

        await t.test('42. Controller updateSection: validates name pattern, capacity, and status', async () => {
            const origSectionFindById = AcademicSection.findById;

            try {
                const mockSection = {
                    _id: secAId,
                    name: 'A',
                    capacity: 60,
                    status: 'Active',
                    save: async function() { return this; }
                };

                AcademicSection.findById = async () => mockSection;

                // Case A: Valid updates
                const reqValid = {
                    params: { id: secAId.toString() },
                    body: { name: 'B', capacity: 70, status: 'Archived' }
                };
                const resValid = createMockRes();
                await updateSection(reqValid, resValid);

                assert.equal(resValid.statusCode, 200);
                assert.equal(mockSection.name, 'B');
                assert.equal(mockSection.capacity, 70);
                assert.equal(mockSection.status, 'Archived');

                // Case B: Invalid name regex rejected
                const reqBadName = {
                    params: { id: secAId.toString() },
                    body: { name: 'Section@123' }
                };
                const resBadName = createMockRes();
                await updateSection(reqBadName, resBadName);
                assert.equal(resBadName.statusCode, 400);
                assert.match(resBadName.payload.error, /Section name/);

                // Case C: Invalid capacity rejected
                const reqBadCap = {
                    params: { id: secAId.toString() },
                    body: { capacity: 600 }
                };
                const resBadCap = createMockRes();
                await updateSection(reqBadCap, resBadCap);
                assert.equal(resBadCap.statusCode, 400);
                assert.match(resBadCap.payload.error, /Capacity must be between 1 and 500/);

                // Case D: Invalid status rejected
                const reqBadStatus = {
                    params: { id: secAId.toString() },
                    body: { status: 'Deleted' }
                };
                const resBadStatus = createMockRes();
                await updateSection(reqBadStatus, resBadStatus);
                assert.equal(resBadStatus.statusCode, 400);
                assert.match(resBadStatus.payload.error, /Status must be Active or Archived/);
            } finally {
                AcademicSection.findById = origSectionFindById;
            }
        });

        await t.test('43. Controller deleteSection: deletes section successfully and returns 404 when missing', async () => {
            const origSectionFindById = AcademicSection.findById;
            const origSectionDelete = AcademicSection.findByIdAndDelete;
            const origTimetableCount = SectionTimetable.countDocuments;

            try {
                const mockSection = { _id: secAId, name: 'A' };
                AcademicSection.findById = async (id) => id === secAId.toString() ? mockSection : null;
                let deletedId = null;
                AcademicSection.findByIdAndDelete = async (id) => { deletedId = id; return mockSection; };
                SectionTimetable.countDocuments = async () => 0;

                // Valid deletion
                const reqValid = { params: { id: secAId.toString() } };
                const resValid = createMockRes();
                await deleteSection(reqValid, resValid);

                assert.equal(resValid.statusCode, 200);
                assert.equal(resValid.payload.success, true);
                assert.equal(String(deletedId), String(secAId));

                // 400 when section has assigned timetables (dependency protection)
                SectionTimetable.countDocuments = async () => 2;
                const resBlocked = createMockRes();
                await deleteSection(reqValid, resBlocked);
                assert.equal(resBlocked.statusCode, 400);
                assert.match(resBlocked.payload.error, /timetable record\(s\) depend on it/);

                // Reset countDocuments for 404 test
                SectionTimetable.countDocuments = async () => 0;

                // 404 for non-existent section
                const reqNotFound = { params: { id: new mongoose.Types.ObjectId().toString() } };
                const resNotFound = createMockRes();
                await deleteSection(reqNotFound, resNotFound);

                assert.equal(resNotFound.statusCode, 404);
                assert.match(resNotFound.payload.error, /Section not found/);
            } finally {
                AcademicSection.findById = origSectionFindById;
                AcademicSection.findByIdAndDelete = origSectionDelete;
                SectionTimetable.countDocuments = origTimetableCount;
            }
        });
    });

    // =========================================================================
    // GROUP 8: V1 OFFICIAL SEMESTERS: 44 - 53 SIT B.E. Calendar Baseline, Date Bounds, & Safety
    // =========================================================================
    await suite.test('V1 OFFICIAL SEMESTERS: 44 - 53 SIT B.E. Calendar Baseline, Date Bounds, & Safety', async (t) => {
        const sem1Id = new mongoose.Types.ObjectId();
        const sem2Id = new mongoose.Types.ObjectId();

        await t.test('44. Controller createSemester auto-derives college and program from parent batch and sets label', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origSemFindOne = Semester.findOne;
            const origSemSave = Semester.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: {
                            _id: beProgId,
                            name: 'Bachelor of Engineering',
                            code: 'B.E',
                            maxSemesters: 8
                        }
                    })
                });

                // No overlapping semester exists
                Semester.findOne = async () => null;

                let savedSemester = null;
                Semester.prototype.save = async function() {
                    savedSemester = this;
                    return this;
                };

                const req = {
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 1,
                        startDate: '2024-07-15',
                        endDate: '2024-12-10',
                        status: 'Active'
                    }
                };
                const res = createMockRes();
                await createSemester(req, res);

                assert.equal(res.statusCode, 201);
                assert.ok(savedSemester);
                assert.equal(String(savedSemester.college), String(sitCollegeId));
                assert.equal(String(savedSemester.program), String(beProgId));
                assert.equal(String(savedSemester.batch), String(batch2024Id));
                assert.equal(savedSemester.number, 1);
                assert.equal(savedSemester.label, 'Semester 1');
                assert.equal(savedSemester.status, 'Active');
                assert.ok(savedSemester.startDate instanceof Date);
                assert.ok(savedSemester.endDate instanceof Date);
                assert.equal(savedSemester.startDate < savedSemester.endDate, true);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Semester.findOne = origSemFindOne;
                Semester.prototype.save = origSemSave;
            }
        });

        await t.test('45. Required fields validation: batchId, number, startDate, and endDate', async () => {
            const origBatchFindById = AcademicBatch.findById;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, maxSemesters: 8 }
                    })
                });

                // Missing batchId
                const resNoBatch = createMockRes();
                await createSemester({ body: { number: 1, startDate: '2024-07-15', endDate: '2024-12-10' } }, resNoBatch);
                assert.equal(resNoBatch.statusCode, 400);
                assert.match(resNoBatch.payload.error, /Batch cohort is required/);

                // Missing number
                const resNoNum = createMockRes();
                await createSemester({ body: { batchId: batch2024Id.toString(), startDate: '2024-07-15', endDate: '2024-12-10' } }, resNoNum);
                assert.equal(resNoNum.statusCode, 400);
                assert.match(resNoNum.payload.error, /Semester number is required/);

                // Missing startDate
                const resNoStart = createMockRes();
                await createSemester({ body: { batchId: batch2024Id.toString(), number: 1, endDate: '2024-12-10' } }, resNoStart);
                assert.equal(resNoStart.statusCode, 400);
                assert.match(resNoStart.payload.error, /Official start date is required/);

                // Missing endDate
                const resNoEnd = createMockRes();
                await createSemester({ body: { batchId: batch2024Id.toString(), number: 1, startDate: '2024-07-15' } }, resNoEnd);
                assert.equal(resNoEnd.statusCode, 400);
                assert.match(resNoEnd.payload.error, /Official end date is required/);

                // Non-existent batchId
                AcademicBatch.findById = (id) => ({ populate: async () => null });
                const resInvalidBatch = createMockRes();
                await createSemester({ body: { batchId: new mongoose.Types.ObjectId().toString(), number: 1, startDate: '2024-07-15', endDate: '2024-12-10' } }, resInvalidBatch);
                assert.equal(resInvalidBatch.statusCode, 400);
                assert.match(resInvalidBatch.payload.error, /Referenced batch does not exist/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
            }
        });

        await t.test('46. Semester number bounds validation: integers 1 to program.maxSemesters (8) only', async () => {
            const origBatchFindById = AcademicBatch.findById;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, maxSemesters: 8 }
                    })
                });

                const invalidNumbers = [0, 9, -1, 2.5, 'invalid'];
                for (const badNum of invalidNumbers) {
                    const res = createMockRes();
                    await createSemester({
                        body: {
                            batchId: batch2024Id.toString(),
                            number: badNum,
                            startDate: '2024-07-15',
                            endDate: '2024-12-10'
                        }
                    }, res);
                    assert.equal(res.statusCode, 400, `Expected number ${badNum} to fail`);
                    assert.match(res.payload.error, /Semester must be an integer between 1 and 8/);
                }
            } finally {
                AcademicBatch.findById = origBatchFindById;
            }
        });

        await t.test('47. Date chronology and validity: startDate must strictly precede endDate', async () => {
            const origBatchFindById = AcademicBatch.findById;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, maxSemesters: 8 }
                    })
                });

                // Case A: startDate after endDate
                const resInverted = createMockRes();
                await createSemester({
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 1,
                        startDate: '2024-12-10',
                        endDate: '2024-07-15'
                    }
                }, resInverted);
                assert.equal(resInverted.statusCode, 400);
                assert.match(resInverted.payload.error, /Official start date must be before end date/);

                // Case B: startDate equals endDate (0 duration)
                const resSame = createMockRes();
                await createSemester({
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 1,
                        startDate: '2024-07-15',
                        endDate: '2024-07-15'
                    }
                }, resSame);
                assert.equal(resSame.statusCode, 400);
                assert.match(resSame.payload.error, /Official start date must be before end date/);

                // Case C: Invalid date string
                const resInvalidDate = createMockRes();
                await createSemester({
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 1,
                        startDate: 'not-a-date',
                        endDate: '2024-12-10'
                    }
                }, resInvalidDate);
                assert.equal(resInvalidDate.statusCode, 400);
                assert.match(resInvalidDate.payload.error, /Invalid date format/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
            }
        });

        await t.test('48. Overlap guard: prevents overlapping semester periods within the same batch', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origSemFindOne = Semester.findOne;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, maxSemesters: 8 }
                    })
                });

                // Simulate existing Semester 1 spanning July 15 to Dec 10, 2024
                const existingSem1 = {
                    _id: sem1Id,
                    number: 1,
                    startDate: new Date('2024-07-15'),
                    endDate: new Date('2024-12-10')
                };

                Semester.findOne = async (query) => {
                    // Overlap query check
                    if (query.batch && query.startDate && query.endDate) {
                        return existingSem1;
                    }
                    return null;
                };

                // Attempting Semester 2 starting Nov 15, 2024 (before Sem 1 finishes)
                const resOverlap = createMockRes();
                await createSemester({
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 2,
                        startDate: '2024-11-15',
                        endDate: '2025-04-30'
                    }
                }, resOverlap);

                assert.equal(resOverlap.statusCode, 400);
                assert.match(resOverlap.payload.error, /Semester date range overlaps with existing Semester 1/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Semester.findOne = origSemFindOne;
            }
        });

        await t.test('49. Compound uniqueness: duplicate semester number for same batch returns friendly 400 error', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origSemFindOne = Semester.findOne;
            const origSemSave = Semester.prototype.save;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, maxSemesters: 8 }
                    })
                });
                Semester.findOne = async () => null; // No overlap

                Semester.prototype.save = async function() {
                    const err = new Error('E11000 duplicate key error collection: test.cms_semesters');
                    err.code = 11000;
                    throw err;
                };

                const resDup = createMockRes();
                await createSemester({
                    body: {
                        batchId: batch2024Id.toString(),
                        number: 1,
                        startDate: '2024-07-15',
                        endDate: '2024-12-10'
                    }
                }, resDup);

                assert.equal(resDup.statusCode, 400);
                assert.match(resDup.payload.error, /Semester 1 already exists for this batch cohort/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Semester.findOne = origSemFindOne;
                Semester.prototype.save = origSemSave;
            }
        });

        await t.test('50. Cross-batch coexistence: same semester number with independent dates supported across cohorts', () => {
            // Model validation check:
            // Batch 2024-2028 Sem 1
            const semBatch2024 = new Semester({
                college: sitCollegeId,
                program: beProgId,
                batch: batch2024Id,
                number: 1,
                label: 'Semester 1 (2024)',
                startDate: new Date('2024-07-15'),
                endDate: new Date('2024-12-10'),
                status: 'Completed'
            });
            assert.equal(semBatch2024.validateSync(), undefined);

            // Batch 2025-2029 Sem 1
            const semBatch2025 = new Semester({
                college: sitCollegeId,
                program: beProgId,
                batch: batch2023Id,
                number: 1,
                label: 'Semester 1 (2025)',
                startDate: new Date('2025-07-15'),
                endDate: new Date('2025-12-10'),
                status: 'Active'
            });
            assert.equal(semBatch2025.validateSync(), undefined);
        });

        await t.test('51. Controller updateSemester: validates date chronology, overlap check, and status enum', async () => {
            const origSemFindById = Semester.findById;
            const origSemFindOne = Semester.findOne;

            try {
                const mockSemester = {
                    _id: sem1Id,
                    batch: batch2024Id,
                    number: 1,
                    label: 'Semester 1',
                    startDate: new Date('2024-07-15'),
                    endDate: new Date('2024-12-10'),
                    status: 'Upcoming',
                    save: async function() { return this; }
                };

                Semester.findById = async () => mockSemester;
                Semester.findOne = async () => null;

                // Case A: Valid status and dates update
                const resValid = createMockRes();
                await updateSemester({
                    params: { id: sem1Id.toString() },
                    body: { status: 'Active', startDate: '2024-08-01' }
                }, resValid);

                assert.equal(resValid.statusCode, 200);
                assert.equal(mockSemester.status, 'Active');

                // Case B: Inverted dates rejected
                const resInverted = createMockRes();
                await updateSemester({
                    params: { id: sem1Id.toString() },
                    body: { startDate: '2024-12-25', endDate: '2024-12-10' }
                }, resInverted);

                assert.equal(resInverted.statusCode, 400);
                assert.match(resInverted.payload.error, /Official start date must be before end date/);

                // Case C: Overlapping dates with another semester of the same batch rejected
                Semester.findOne = async () => ({
                    _id: sem2Id,
                    number: 2,
                    startDate: new Date('2025-01-15'),
                    endDate: new Date('2025-05-30')
                });

                const resOverlap = createMockRes();
                await updateSemester({
                    params: { id: sem1Id.toString() },
                    body: { endDate: '2025-02-01' } // Overlaps with Sem 2
                }, resOverlap);

                assert.equal(resOverlap.statusCode, 400);
                assert.match(resOverlap.payload.error, /Semester date range overlaps with existing Semester 2/);
            } finally {
                Semester.findById = origSemFindById;
                Semester.findOne = origSemFindOne;
            }
        });

        await t.test('52. Deletion safety guard: blocks deletion if dependent class sections exist, allows when empty', async () => {
            const origSemFindById = Semester.findById;
            const origSectionCount = AcademicSection.countDocuments;
            const origSemDelete = Semester.findByIdAndDelete;

            try {
                const mockSemester = {
                    _id: sem1Id,
                    batch: batch2024Id,
                    number: 1,
                    label: 'Semester 1'
                };
                Semester.findById = async (id) => id === sem1Id.toString() ? mockSemester : null;

                // Case A: Has 2 dependent sections -> Blocked
                AcademicSection.countDocuments = async () => 2;

                const resBlocked = createMockRes();
                await deleteSemester({ params: { id: sem1Id.toString() } }, resBlocked);

                assert.equal(resBlocked.statusCode, 400);
                assert.match(resBlocked.payload.error, /Cannot delete Semester 1: 2 section\(s\) depend on it/);

                // Case B: No dependent sections -> Deletion allowed
                AcademicSection.countDocuments = async () => 0;
                let deletedId = null;
                Semester.findByIdAndDelete = async (id) => { deletedId = id; return mockSemester; };

                const resAllowed = createMockRes();
                await deleteSemester({ params: { id: sem1Id.toString() } }, resAllowed);

                assert.equal(resAllowed.statusCode, 200);
                assert.equal(resAllowed.payload.success, true);
                assert.equal(String(deletedId), String(sem1Id));

                // Case C: 404 for non-existent semester
                const resNotFound = createMockRes();
                await deleteSemester({ params: { id: new mongoose.Types.ObjectId().toString() } }, resNotFound);
                assert.equal(resNotFound.statusCode, 404);
            } finally {
                Semester.findById = origSemFindById;
                AcademicSection.countDocuments = origSectionCount;
                Semester.findByIdAndDelete = origSemDelete;
            }
        });

        await t.test('53. Security & Scope authorization for semesters: requires valid scope and handles omitted collegeId', async () => {
            const origBatchFindById = AcademicBatch.findById;

            try {
                AcademicBatch.findById = async (id) => ({
                    _id: batch2024Id,
                    college: sitCollegeId,
                    program: beProgId
                });

                // Authorized SIT Scoped Admin
                const sitAdmin = {
                    role: 'ADMIN',
                    scopes: [{ college: sitCollegeId }],
                    permissions: { semesters: { view: true, create: true, update: true, finalize: true } }
                };

                // Foreign BMS Scoped Admin
                const bmsAdmin = {
                    role: 'ADMIN',
                    scopes: [{ college: bmsCollegeId }],
                    permissions: { semesters: { view: true, create: true, update: true, finalize: true } }
                };

                const targetContext = {
                    collegeId: sitCollegeId,
                    programId: beProgId,
                    batchId: batch2024Id,
                    semester: 1
                };

                // SIT Admin allowed
                const sitAccess = validateAdminAccess(sitAdmin, targetContext, 'semesters', 'create');
                assert.equal(sitAccess.allowed, true);

                // BMS Admin blocked
                const bmsAccess = validateAdminAccess(bmsAdmin, targetContext, 'semesters', 'create');
                assert.equal(bmsAccess.allowed, false);
                assert.match(bmsAccess.reason, /Out of authorized administrative scope/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
            }
        });
    });

    // ==========================================
    // GROUP 9: EDIT / UPDATE FOR BATCHES, SECTIONS, & SEMESTERS
    // ==========================================
    await suite.test('EDIT / UPDATE OPTIONS: 54 - 57 Batches, Sections, & Semesters Modifications', async (t) => {
        const testSectionId = new mongoose.Types.ObjectId();
        const testSem1Id = new mongoose.Types.ObjectId();
        const testSem2Id = new mongoose.Types.ObjectId();

        await t.test('54. Controller updateBatch: edits admissionYear, graduationYear, status, and auto-computes name', async () => {
            const origBatchFindById = AcademicBatch.findById;

            try {
                const mockBatch = {
                    _id: batch2024Id,
                    admissionYear: 2024,
                    graduationYear: 2028,
                    name: '2024-2028',
                    status: 'Active',
                    save: async function() { return this; }
                };

                AcademicBatch.findById = async (id) => id === batch2024Id.toString() ? mockBatch : null;

                const resValid = createMockRes();
                await updateBatch({
                    params: { id: batch2024Id.toString() },
                    body: { admissionYear: 2025, graduationYear: 2029, status: 'Active' }
                }, resValid);

                assert.equal(resValid.statusCode, 200);
                assert.equal(mockBatch.admissionYear, 2025);
                assert.equal(mockBatch.graduationYear, 2029);
                assert.equal(mockBatch.name, '2025-2029');

                // Inverted year guard
                const resInverted = createMockRes();
                await updateBatch({
                    params: { id: batch2024Id.toString() },
                    body: { admissionYear: 2030, graduationYear: 2025 }
                }, resInverted);

                assert.equal(resInverted.statusCode, 400);
                assert.match(resInverted.payload.error, /Graduation year must be after admission year/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
            }
        });

        await t.test('55. Controller updateSection: edits section name, capacity, semester, and branch with validation', async () => {
            const origSecFindById = AcademicSection.findById;
            const origBranchFindById = Branch.findById;

            try {
                const newBranchId = new mongoose.Types.ObjectId();
                const mockSection = {
                    _id: testSectionId,
                    name: 'A',
                    capacity: 60,
                    semester: 1,
                    branch: cseBranchId,
                    status: 'Active',
                    save: async function() { return this; }
                };

                AcademicSection.findById = async (id) => id === testSectionId.toString() ? mockSection : null;
                Branch.findById = async (id) => id === newBranchId.toString() ? { _id: newBranchId, name: 'Information Science' } : null;

                const resValid = createMockRes();
                await updateSection({
                    params: { id: testSectionId.toString() },
                    body: {
                        name: 'B1',
                        capacity: 75,
                        semester: 2,
                        branchId: newBranchId.toString(),
                        status: 'Active'
                    }
                }, resValid);

                assert.equal(resValid.statusCode, 200);
                assert.equal(mockSection.name, 'B1');
                assert.equal(mockSection.capacity, 75);
                assert.equal(mockSection.semester, 2);
                assert.equal(mockSection.branch.toString(), newBranchId.toString());

                // Invalid semester number guard
                const resBadSem = createMockRes();
                await updateSection({
                    params: { id: testSectionId.toString() },
                    body: { semester: 10 }
                }, resBadSem);

                assert.equal(resBadSem.statusCode, 400);
                assert.match(resBadSem.payload.error, /Semester must be between 1 and 8/);
            } finally {
                AcademicSection.findById = origSecFindById;
                Branch.findById = origBranchFindById;
            }
        });

        await t.test('56. Controller updateSemester: allows changing semester number when no dependent sections exist, blocks when dependent', async () => {
            const origSemFindById = Semester.findById;
            const origSemFindOne = Semester.findOne;
            const origSecCount = AcademicSection.countDocuments;

            try {
                const mockSemester = {
                    _id: testSem1Id,
                    batch: batch2024Id,
                    number: 1,
                    sequence: 1,
                    label: 'Semester 1',
                    startDate: new Date('2024-08-01'),
                    endDate: new Date('2024-12-15'),
                    status: 'Upcoming',
                    save: async function() { return this; }
                };

                Semester.findById = async (id) => id === testSem1Id.toString() ? mockSemester : null;
                Semester.findOne = async () => null; // No duplicate

                // Case A: Blocked if dependent sections exist
                AcademicSection.countDocuments = async () => 3;
                const resBlocked = createMockRes();
                await updateSemester({
                    params: { id: testSem1Id.toString() },
                    body: { number: 3 }
                }, resBlocked);

                assert.equal(resBlocked.statusCode, 400);
                assert.match(resBlocked.payload.error, /Cannot change semester number from 1 to 3: 3 section\(s\) depend on Semester 1/);

                // Case B: Allowed if 0 dependent sections
                AcademicSection.countDocuments = async () => 0;
                const resAllowed = createMockRes();
                await updateSemester({
                    params: { id: testSem1Id.toString() },
                    body: { number: 3 }
                }, resAllowed);

                assert.equal(resAllowed.statusCode, 200);
                assert.equal(mockSemester.number, 3);
                assert.equal(mockSemester.label, 'Semester 3');
            } finally {
                Semester.findById = origSemFindById;
                Semester.findOne = origSemFindOne;
                AcademicSection.countDocuments = origSecCount;
            }
        });

        await t.test('57. Controller updateSemester: prevents duplicate semester number within same batch on edit', async () => {
            const origSemFindById = Semester.findById;
            const origSemFindOne = Semester.findOne;
            const origSecCount = AcademicSection.countDocuments;

            try {
                const mockSemester = {
                    _id: testSem1Id,
                    batch: batch2024Id,
                    number: 1,
                    label: 'Semester 1',
                    startDate: new Date('2024-08-01'),
                    endDate: new Date('2024-12-15'),
                    save: async function() { return this; }
                };

                Semester.findById = async (id) => id === testSem1Id.toString() ? mockSemester : null;
                AcademicSection.countDocuments = async () => 0; // No sections blocking

                // Another semester already exists with number 2
                Semester.findOne = async () => ({ _id: testSem2Id, number: 2 });

                const resDup = createMockRes();
                await updateSemester({
                    params: { id: testSem1Id.toString() },
                    body: { number: 2 }
                }, resDup);

                assert.equal(resDup.statusCode, 400);
                assert.match(resDup.payload.error, /Semester 2 already exists for this batch cohort/);
            } finally {
                Semester.findById = origSemFindById;
                Semester.findOne = origSemFindOne;
                AcademicSection.countDocuments = origSecCount;
            }
        });

        await t.test('58. Section-Semester validity: createSection rejects when target official semester is not scheduled', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origBranchFindById = Branch.findById;
            const origSemFindOne = Semester.findOne;

            try {
                AcademicBatch.findById = (id) => ({
                    populate: async () => ({
                        _id: batch2024Id,
                        college: sitCollegeId,
                        program: { _id: beProgId, name: 'B.E', hasBranches: true, maxSemesters: 8 }
                    })
                });
                Branch.findById = async () => ({ _id: cseBranchId, name: 'CSE' });

                // Official Semester does not exist for this batch
                Semester.findOne = async () => null;

                const res = createMockRes();
                await createSection({
                    body: {
                        batchId: batch2024Id.toString(),
                        branchId: cseBranchId.toString(),
                        semester: 3,
                        name: 'A',
                        capacity: 60
                    }
                }, res);

                assert.equal(res.statusCode, 400);
                assert.match(res.payload.error, /Official Semester 3 has not been scheduled for this batch cohort/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Branch.findById = origBranchFindById;
                Semester.findOne = origSemFindOne;
            }
        });

        await t.test('59. Section-Semester validity: updateSection rejects changing semester when target official semester does not exist', async () => {
            const origSecFindById = AcademicSection.findById;
            const origSemFindOne = Semester.findOne;

            try {
                const mockSection = {
                    _id: testSectionId,
                    name: 'A',
                    semester: 1,
                    batch: batch2024Id,
                    college: sitCollegeId,
                    program: beProgId,
                    branch: cseBranchId,
                    status: 'Active',
                    save: async function() { return this; }
                };
                AcademicSection.findById = async () => mockSection;

                // Target Semester 4 is NOT scheduled for this batch
                Semester.findOne = async () => null;

                const res = createMockRes();
                await updateSection({
                    params: { id: testSectionId.toString() },
                    body: { semester: 4 }
                }, res);

                assert.equal(res.statusCode, 400);
                assert.match(res.payload.error, /Official Semester 4 has not been scheduled for this batch cohort/);
            } finally {
                AcademicSection.findById = origSecFindById;
                Semester.findOne = origSemFindOne;
            }
        });

        await t.test('60. Scoped Admin RBAC on updateSection: blocks moving section to unauthorized branch', async () => {
            const origSecFindById = AcademicSection.findById;
            const origBranchFindById = Branch.findById;
            const origSemFindOne = Semester.findOne;

            try {
                const unauthorizedBranchId = new mongoose.Types.ObjectId();
                const mockSection = {
                    _id: testSectionId,
                    name: 'A',
                    semester: 1,
                    batch: batch2024Id,
                    college: sitCollegeId,
                    program: beProgId,
                    branch: cseBranchId,
                    status: 'Active',
                    save: async function() { return this; }
                };
                AcademicSection.findById = async () => mockSection;
                Branch.findById = async () => ({ _id: unauthorizedBranchId, name: 'Mechanical' });
                Semester.findOne = async () => ({ _id: testSem1Id, number: 1, batch: batch2024Id });

                // Scoped Admin restricted ONLY to CSE
                const scopedAdminReq = {
                    params: { id: testSectionId.toString() },
                    body: { branchId: unauthorizedBranchId.toString() },
                    admin: {
                        role: 'ADMIN',
                        scopes: [{ college: sitCollegeId, program: beProgId, branch: cseBranchId }],
                        permissions: { academic_structure: { view: true, update: true } }
                    }
                };

                const res = createMockRes();
                await updateSection(scopedAdminReq, res);

                assert.equal(res.statusCode, 403);
                assert.match(res.payload.error, /Out of administrative scope/);
            } finally {
                AcademicSection.findById = origSecFindById;
                Branch.findById = origBranchFindById;
                Semester.findOne = origSemFindOne;
            }
        });

        await t.test('61. Batch duration consistency: updateBatch blocks reducing cohort duration below existing semesters or sections', async () => {
            const origBatchFindById = AcademicBatch.findById;
            const origSemFindOne = Semester.findOne;
            const origSecFindOne = AcademicSection.findOne;

            try {
                const mockBatch = {
                    _id: batch2024Id,
                    admissionYear: 2024,
                    graduationYear: 2028,
                    name: '2024-2028',
                    status: 'Active',
                    save: async function() { return this; }
                };
                AcademicBatch.findById = async () => mockBatch;

                // Existing Semester 6 exists
                Semester.findOne = async (q) => {
                    if (q && q.number && q.number.$gt) return { _id: testSem1Id, number: 6 };
                    return null;
                };

                // Admin tries to shrink 4-year cohort (2024-2028, 8 semesters) down to 2-year (2024-2026, 4 semesters)
                const res = createMockRes();
                await updateBatch({
                    params: { id: batch2024Id.toString() },
                    body: { admissionYear: 2024, graduationYear: 2026 }
                }, res);

                assert.equal(res.statusCode, 400);
                assert.match(res.payload.error, /existing Semester 6 exceeds the new cohort duration/);
            } finally {
                AcademicBatch.findById = origBatchFindById;
                Semester.findOne = origSemFindOne;
                AcademicSection.findOne = origSecFindOne;
            }
        });
    });
});
