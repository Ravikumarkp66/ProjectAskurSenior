/**
 * CIE Integration Test Suite
 * 
 * Verifies end-to-end integration between:
 * - authV2Controller (HTTP presentation / request processing)
 * - StudentRegisteredSubject & StudentCieRecord (data models)
 * - cieRulesEngine (business rules calculation & status resolution)
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

// Controller & Engine
const authV2Controller = require('../modules/auth/controllers/authV2.controller');

// Models
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentCieRecord = require('../models/StudentCieRecord');

function createMockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = data;
            return this;
        }
    };
}

function createMockQuery(result) {
    const query = {
        populate() { return query; },
        select() { return query; },
        sort() { return query; },
        lean() { return query; },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        },
        catch(reject) {
            return Promise.resolve(result).catch(reject);
        }
    };
    return query;
}

test('CIE Backend Integration Suite', async (t) => {
    // Fixtures
    const studentId = new mongoose.Types.ObjectId();
    const otherStudentId = new mongoose.Types.ObjectId();

    const regSubj1Id = new mongoose.Types.ObjectId(); // 4 credits IPCC
    const regSubj2Id = new mongoose.Types.ObjectId(); // 3 credits Theory
    const regSubj3Id = new mongoose.Types.ObjectId(); // 1.5 credits Lab Only

    const mockSubjects = [
        {
            _id: regSubj1Id,
            student: studentId,
            semester: 4,
            registeredCredits: 4,
            category: 'Theory + Lab',
            customCode: '22CS41',
            customName: 'Algorithms & Lab (IPCC)',
            subject: { _id: new mongoose.Types.ObjectId(), code: '22CS41', name: 'Algorithms', credits: 4 },
            isActive: true
        },
        {
            _id: regSubj2Id,
            student: studentId,
            semester: 4,
            registeredCredits: 3,
            category: 'Theory',
            customCode: '22CS42',
            customName: 'Operating Systems',
            subject: { _id: new mongoose.Types.ObjectId(), code: '22CS42', name: 'Operating Systems', credits: 3 },
            isActive: true
        },
        {
            _id: regSubj3Id,
            student: studentId,
            semester: 4,
            registeredCredits: 1.5,
            category: 'Lab Only',
            customCode: '22CSL46',
            customName: 'Microcontroller Lab',
            subject: { _id: new mongoose.Types.ObjectId(), code: '22CSL46', name: 'Microcontroller Lab', credits: 1.5 },
            isActive: true
        }
    ];

    let persistedCieRecords = [];
    let lastSavedRecord = null;

    // Save original model methods
    const origRegFindOne = StudentRegisteredSubject.findOne;
    const origRegFind = StudentRegisteredSubject.find;
    const origCieFindOneAndUpdate = StudentCieRecord.findOneAndUpdate;
    const origCieFind = StudentCieRecord.find;

    t.before(() => {
        // Mock StudentRegisteredSubject.findOne
        StudentRegisteredSubject.findOne = (filter) => {
            const match = mockSubjects.find(s => {
                if (filter._id && String(s._id) !== String(filter._id)) return false;
                if (filter.student && String(s.student) !== String(filter.student)) return false;
                return true;
            });
            return createMockQuery(match || null);
        };

        // Mock StudentRegisteredSubject.find
        StudentRegisteredSubject.find = (filter) => {
            let list = mockSubjects.filter(s => {
                if (filter.student && String(s.student) !== String(filter.student)) return false;
                return true;
            });
            return createMockQuery(list);
        };

        // Mock StudentCieRecord.findOneAndUpdate
        StudentCieRecord.findOneAndUpdate = (filter, update, options) => {
            const existingIndex = persistedCieRecords.findIndex(r =>
                String(r.student) === String(filter.student) &&
                Number(r.semester) === Number(filter.semester) &&
                String(r.registeredSubject) === String(filter.registeredSubject)
            );

            const record = {
                student: filter.student,
                semester: filter.semester,
                registeredSubject: filter.registeredSubject,
                ...update.$set,
                updatedAt: new Date()
            };

            if (existingIndex >= 0) {
                persistedCieRecords[existingIndex] = record;
            } else {
                persistedCieRecords.push(record);
            }

            lastSavedRecord = record;
            return Promise.resolve(record);
        };

        // Mock StudentCieRecord.find
        StudentCieRecord.find = (filter) => {
            const matches = persistedCieRecords.filter(r => {
                if (filter.student && String(r.student) !== String(filter.student)) return false;
                if (filter.semester && Number(r.semester) !== Number(filter.semester)) return false;
                return true;
            });
            return createMockQuery(matches);
        };
    });

    t.after(() => {
        // Restore originals
        StudentRegisteredSubject.findOne = origRegFindOne;
        StudentRegisteredSubject.find = origRegFind;
        StudentCieRecord.findOneAndUpdate = origCieFindOneAndUpdate;
        StudentCieRecord.find = origCieFind;
    });

    // Reset records before each test
    t.beforeEach(() => {
        persistedCieRecords = [];
        lastSavedRecord = null;
    });

    await t.test('CIE-INTEGRATION-001: Controller validates payload and enforces subject ownership', async () => {
        const reqMissingId = {
            student: { _id: studentId, semester: 4 },
            body: {}
        };
        const resMissingId = createMockRes();

        await authV2Controller.saveCieRecord(reqMissingId, resMissingId);

        assert.strictEqual(resMissingId.statusCode, 400);
        assert.strictEqual(resMissingId.body.success, false);
        assert.match(resMissingId.body.message, /registeredSubjectId is required/);

        // Scenario 2: Attempting to update a subject not belonging to this student
        const reqForeign = {
            student: { _id: otherStudentId, semester: 4 }, // Different student
            body: {
                registeredSubjectId: regSubj1Id,
                semester: 4,
                rawMarks: { test1: 40 }
            }
        };
        const resForeign = createMockRes();

        await authV2Controller.saveCieRecord(reqForeign, resForeign);

        assert.strictEqual(resForeign.statusCode, 404);
        assert.strictEqual(resForeign.body.success, false);
        assert.match(resForeign.body.message, /Registered subject not found/);
    });

    await t.test('CIE-INTEGRATION-002: saveCieRecord loads subject, applies cieRulesEngine, persists record, and returns 200', async () => {
        const req = {
            student: { _id: studentId, semester: 4 },
            body: {
                registeredSubjectId: regSubj1Id,
                semester: 4,
                rawMarks: {
                    test1: 45,
                    test2: 45,       // 90/100 -> 30.6
                    quiz1: 15,
                    quiz2: 15,       // 30/40 -> 6.0
                    assignment1: 15,
                    assignment2: 15, // 30/40 -> 6.0
                    // theory exact = 42.6 -> scaled to 25 = 21.3
                    labRecord: 300,  // (300/350)*15 = 12.86
                    labTest: 12      // (12/15)*10 = 8.0
                    // practical exact = 20.86
                    // total CIE = 21.3 + 20.86 = 42.16 -> 42.2
                }
            }
        };
        const res = createMockRes();

        await authV2Controller.saveCieRecord(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.evaluationType, 'IPCC');
        assert.strictEqual(res.body.data.isEligible, true);
        assert.strictEqual(res.body.data.status, 'ELIGIBLE');
        assert.strictEqual(res.body.data.contributions.theoryTotal, 21.3);
        assert.strictEqual(res.body.data.contributions.practicalTotal, 20.86);
        assert.strictEqual(res.body.data.totalCie, 42.16);

        // Verify that database persistence received the real engine calculations
        assert.ok(lastSavedRecord, 'Expected record to be persisted in StudentCieRecord');
        assert.strictEqual(String(lastSavedRecord.registeredSubject), String(regSubj1Id));
        assert.strictEqual(lastSavedRecord.calculatedResult.isEligible, true);
        assert.strictEqual(lastSavedRecord.calculatedResult.status, 'ELIGIBLE');
        assert.strictEqual(lastSavedRecord.calculatedResult.totalCie, 42.16);
    });

    await t.test('CIE-INTEGRATION-003: Component threshold failure correctly propagates to status and persistence', async () => {
        const req = {
            student: { _id: studentId, semester: 4 },
            body: {
                registeredSubjectId: regSubj2Id, // Theory Only
                semester: 4,
                rawMarks: {
                    test1: 20,
                    test2: 19, // testSum = 39 < 40 minimum required!
                    quiz1: 20,
                    quiz2: 20,
                    assignment1: 20,
                    assignment2: 20
                }
            }
        };
        const res = createMockRes();

        await authV2Controller.saveCieRecord(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.isEligible, false);
        assert.strictEqual(res.body.data.status, 'NOT_ELIGIBLE');
        assert.strictEqual(res.body.data.failedRequirements.length, 1);
        assert.match(res.body.data.failedRequirements[0], /Tests requirement not satisfied/);

        // Verify persisted state reflects the failure
        assert.strictEqual(lastSavedRecord.calculatedResult.isEligible, false);
        assert.strictEqual(lastSavedRecord.calculatedResult.status, 'NOT_ELIGIBLE');
    });

    await t.test('CIE-INTEGRATION-004: getCieDashboard aggregates registered subjects with persisted records and computes summary stats', async () => {
        // Pre-populate records in DB:
        // 1. Subj1 (IPCC): passing marks -> ELIGIBLE
        // 2. Subj2 (Theory): failing test component -> NOT_ELIGIBLE
        // 3. Subj3 (Lab): no saved record -> NOT_STARTED

        persistedCieRecords.push({
            student: studentId,
            semester: 4,
            registeredSubject: regSubj1Id,
            evaluationType: 'IPCC',
            rawMarks: {
                test1: 50, test2: 50, quiz1: 20, quiz2: 20,
                assignment1: 20, assignment2: 20, labRecord: 350, labTest: 15
            },
            updatedAt: new Date()
        });

        persistedCieRecords.push({
            student: studentId,
            semester: 4,
            registeredSubject: regSubj2Id,
            evaluationType: 'THEORY_ONLY',
            rawMarks: {
                test1: 15, test2: 15, quiz1: 20, quiz2: 20,
                assignment1: 20, assignment2: 20
            },
            updatedAt: new Date()
        });

        const req = {
            student: { _id: studentId, semester: 4 },
            query: { semester: 4 }
        };
        const res = createMockRes();

        await authV2Controller.getCieDashboard(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.semester, 4);

        const summary = res.body.data.summaryStats;
        assert.strictEqual(summary.totalSubjects, 3);
        assert.strictEqual(summary.completedCount, 2); // 1 eligible + 1 not_eligible = 2 completed
        assert.strictEqual(summary.eligibleCount, 1);
        assert.strictEqual(summary.needsAttentionCount, 1); // not_eligible counts as needs attention

        const subjects = res.body.data.subjects;
        assert.strictEqual(subjects.length, 3);

        const subj1 = subjects.find(s => String(s.registeredSubjectId) === String(regSubj1Id));
        assert.strictEqual(subj1.status, 'ELIGIBLE');
        assert.strictEqual(subj1.totalCie, 50);

        const subj2 = subjects.find(s => String(s.registeredSubjectId) === String(regSubj2Id));
        assert.strictEqual(subj2.status, 'NOT_ELIGIBLE');

        const subj3 = subjects.find(s => String(s.registeredSubjectId) === String(regSubj3Id));
        assert.strictEqual(subj3.status, 'NOT_STARTED');
        assert.strictEqual(subj3.totalCie, 0);
    });

    await t.test('CIE-INTEGRATION-005: Partial marks workflow correctly assigns PARTIAL status across integration', async () => {
        const req = {
            student: { _id: studentId, semester: 4 },
            body: {
                registeredSubjectId: regSubj2Id, // 6 subcomponents total
                semester: 4,
                rawMarks: {
                    test1: 45,
                    test2: 45
                    // Quizzes and assignments omitted (only 2/6 entered)
                }
            }
        };
        const res = createMockRes();

        await authV2Controller.saveCieRecord(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.data.status, 'PARTIAL');
        assert.strictEqual(res.body.data.isEligible, true);
        assert.strictEqual(res.body.data.totalEnteredCount, 2);
        assert.strictEqual(res.body.data.totalPossibleSubcomponents, 6);

        // Check that database record reflects partial status
        assert.strictEqual(lastSavedRecord.calculatedResult.status, 'PARTIAL');
    });
});
