const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config();

const {
    getStudentSemesterResults,
    calculateSubjectResult
} = require('../studentResultService');

describe('F-10 Phase 1: Student Result API & Flow Verification', () => {

    let mathSubject = null;
    let physSubject = null;
    let cc10Subject = null;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        const AcademicSubject = require('../../models/AcademicSubject');
        mathSubject = await AcademicSubject.findOne({ code: 'MATH' }).lean();
        physSubject = await AcademicSubject.findOne({ code: 'PHYS' }).lean();
        cc10Subject = await AcademicSubject.findOne({ code: 'CC10' }).lean();
    });

    after(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });

    test('1. Standard Theory calculates correct CIE (41.2), SEE (44.5), Aggregate (85.7), Grade A+ (9 GP)', async () => {
        const student = { _id: new mongoose.Types.ObjectId(), usn: '1SI26IS080', name: 'Test Student', academicProfile: { currentSemester: 1, scheme: mathSubject.scheme } };

        const result = await calculateSubjectResult({
            student,
            subject: mathSubject,
            overrides: {
                rawMarks: {
                    THEORY_TEST: 80,       // 80/100 -> 27.2
                    THEORY_QUIZ: 32,       // 32/40  -> 6.4
                    THEORY_ASSIGNMENT: 38  // 38/40  -> 7.6  => CIE = 41.2
                },
                seeScore: 89               // 89/100 -> 44.5 => Total = 85.7
            }
        });

        assert.equal(result.cie.obtained, 41.2);
        assert.equal(result.see.obtained, 44.5);
        assert.equal(result.aggregate.obtained, 85.7);
        assert.equal(result.grade.letter, 'A+');
        assert.equal(result.grade.gradePoint, 9);
        assert.equal(result.contributesToSGPA, true);
    });

    test('2. NCMC excludes SEE, yields PP/NP, 0 credits, and SGPA false', async () => {
        const student = { _id: new mongoose.Types.ObjectId(), usn: '1SI26IS080', name: 'Test Student', academicProfile: { currentSemester: 1, scheme: cc10Subject.scheme } };

        const result = await calculateSubjectResult({
            student,
            subject: cc10Subject,
            overrides: {
                rawMarks: { NCMC_CIE: 65 },
                seeScore: 80 // Should be ignored because SEE is disabled in NCMC
            }
        });

        assert.equal(result.see.enabled, false);
        assert.equal(result.see.obtained, null);
        assert.equal(result.grade.letter, 'PP');
        assert.equal(result.grade.gradePoint, 0);
        assert.equal(result.subject.credits, 0);
        assert.equal(result.contributesToSGPA, false);
    });

    test('3. Integrated IPCC fails practical gate -> Grade F and explicit failedCondition reasons', async () => {
        const student = { _id: new mongoose.Types.ObjectId(), usn: '1SI26IS080', name: 'Test Student', academicProfile: { currentSemester: 1, scheme: physSubject.scheme } };

        const result = await calculateSubjectResult({
            student,
            subject: physSubject,
            overrides: {
                rawMarks: {
                    IPCC_THEORY_TEST: 70,       // passes theory
                    IPCC_THEORY_QUIZ: 30,
                    IPCC_THEORY_ASSIGNMENT: 30,
                    IPCC_LAB_CONDUCTION: 50,    // 50/350 -> ~2.14 (< 10 practical gate)
                    IPCC_LAB_TEST: 5            // 5/15 -> ~3.33 => Practical CIE = 5.48 (< 10)
                },
                seeScore: 70
            }
        });

        assert.equal(result.eligibility.eligible, false);
        assert.equal(result.grade.letter, 'F');
        assert.equal(result.grade.gradePoint, 0);
        assert.ok(result.eligibility.reasons.some(r => r.includes('Practical CIE')));
    });

    test('4. Missing marks are explicitly represented as null / NOT_ENTERED and distinct from zero', async () => {
        const student = { _id: new mongoose.Types.ObjectId(), usn: '1SI26IS080', name: 'Test Student', academicProfile: { currentSemester: 1, scheme: mathSubject.scheme } };

        const result = await calculateSubjectResult({
            student,
            subject: mathSubject,
            overrides: {
                rawMarks: {
                    THEORY_TEST: 0, // Explicit zero
                    THEORY_QUIZ: null // Unentered / missing
                }
            }
        });

        const testComp = result.components.find(c => c.key === 'THEORY_TEST');
        const quizComp = result.components.find(c => c.key === 'THEORY_QUIZ');

        assert.equal(testComp.rawMarks, 0);
        assert.equal(testComp.status, 'ZERO');

        assert.equal(quizComp.rawMarks, null);
        assert.equal(quizComp.status, 'NOT_ENTERED');
    });

    test('5. Strict Scope Boundary: Never calculates semester SGPA or cumulative CGPA', async () => {
        const student = { _id: new mongoose.Types.ObjectId(), usn: '1SI26IS080', name: 'Test Student', academicProfile: { currentSemester: 1, scheme: mathSubject.scheme } };

        const result = await calculateSubjectResult({
            student,
            subject: mathSubject,
            overrides: {
                rawMarks: { THEORY_TEST: 90, THEORY_QUIZ: 38, THEORY_ASSIGNMENT: 38 },
                seeScore: 90
            }
        });

        assert.equal(result.sgpa, undefined);
        assert.equal(result.cgpa, undefined);
        assert.equal(result.semesterSgpa, undefined);
    });
});
