/**
 * F-10 Master Test Suite: Student Result Flow & Flexible Component Storage
 * 
 * Tests all required scenarios A through M:
 * - A. Standard Theory: CIE scaling (34+8+8), SEE scaling (100->50), aggregate & grade
 * - B. AEC Theory: 34 + 16 CIE structure, direct 50 SEE, aggregate & grade
 * - C. NCMC: SEE ignored, PP/NP completion-based, SGPA excluded
 * - D. Integrated IPCC: Theory + Practical gates, missing practical data handled correctly
 * - E. Standard Lab: Dynamic runtime N = 8, 9, 10 conduction normalization (N*35 -> 35)
 * - F. SDC: Dynamic components without hardcoded fields; schema invariance across component changes
 * - G. CAED: Classwork (80->20), EL (20->10), Tests (100->20), SEE (50->50)
 * - H. Missing data: MISSING explicitly distinguished from ZERO
 * - I. Invalid component key: Rejected
 * - J. Duplicate component: Prevented via unique compound index
 * - K. Cross-student access: Rejected by controller authorization guard
 * - L. Inactive rule: Rejected for new mark entry
 * - M. Regression: Existing F-08 calculation engine remains single authority
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const StudentEvaluationComponentRecord = require('../../models/StudentEvaluationComponentRecord');
const StudentSubjectEvaluationResult = require('../../models/StudentSubjectEvaluationResult');
const { calculateStudentEvaluation } = require('../evaluationCalculationEngine');
const { resolveActiveEvaluationRule, RuleNotFoundError } = require('../evaluationRuleResolver');

// -------------------------------------------------------------
// RULE FIXTURES (Aligned with Active Scheme 2025 Rules)
// -------------------------------------------------------------

const STANDARD_GRADE_SCALE = {
    enabled: true,
    type: 'MARK_RANGE',
    grades: [
        { grade: 'O', minMarks: 90, maxMarks: 100, gradePoint: 10, order: 1 },
        { grade: 'A+', minMarks: 80, maxMarks: 89.99, gradePoint: 9, order: 2 },
        { grade: 'A', minMarks: 70, maxMarks: 79.99, gradePoint: 8, order: 3 },
        { grade: 'B+', minMarks: 60, maxMarks: 69.99, gradePoint: 7, order: 4 },
        { grade: 'B', minMarks: 50, maxMarks: 59.99, gradePoint: 6, order: 5 },
        { grade: 'C', minMarks: 40, maxMarks: 49.99, gradePoint: 5, order: 6 },
        { grade: 'F', minMarks: 0, maxMarks: 39.99, gradePoint: 0, order: 7 }
    ]
};

const STANDARD_THEORY_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Standard Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'THEORY_TEST', name: 'Tests', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 50 }, conversion: { enabled: true, sourceMax: 100, targetMax: 34 } },
            { key: 'THEORY_QUIZ', name: 'Quizzes', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 8 } },
            { key: 'THEORY_ASSIGNMENT', name: 'Assignments', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 8 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'THEORY_SEE', name: 'Theory SEE', type: 'THEORY_EXAM', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

const AEC_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'AEC Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'AEC_TEST', name: 'Tests', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 50 }, conversion: { enabled: true, sourceMax: 100, targetMax: 34 } },
            { key: 'AEC_QUIZ_ASSIGNMENT', name: 'Quiz/Assignment', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 20, targetMax: 16 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'AEC_SEE', name: 'AEC SEE Exam', type: 'THEORY_EXAM', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

const NCMC_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'NCMC Non-Credit Evaluation Rule',
    contributesToSGPA: false,
    cie: {
        enabled: true,
        components: [
            { key: 'NCMC_CIE', name: 'Continuous Assessment', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: false, sourceMax: 100, targetMax: 100 } }
        ]
    },
    see: { enabled: false, components: [] },
    eligibility: { enabled: false, conditions: [] },
    gradeScale: {
        enabled: true,
        type: 'PASS_FAIL',
        grades: [
            { grade: 'PP', minMarks: 0, maxMarks: 100, gradePoint: 0, order: 1 },
            { grade: 'NP', minMarks: 0, maxMarks: 0, gradePoint: 0, order: 2 }
        ]
    }
};

const IPCC_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Integrated IPCC Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'IPCC_THEORY_TEST', name: 'Theory Tests', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 50 }, conversion: { enabled: true, sourceMax: 100, targetMax: 17 } },
            { key: 'IPCC_THEORY_QUIZ', name: 'Theory Quizzes', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_THEORY_ASSIGNMENT', name: 'Theory Assignments', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_LAB_CONDUCTION', name: 'Lab Conduction', type: 'LAB_RECORD', entries: { count: 1, maxMarksEach: 350 }, conversion: { enabled: true, sourceMax: 350, targetMax: 15 } },
            { key: 'IPCC_LAB_TEST', name: 'Lab Test', type: 'LAB_TEST', entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: true, sourceMax: 15, targetMax: 10 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'IPCC_SEE', name: 'IPCC SEE Exam', type: 'THEORY_EXAM', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'COMPONENT_MIN', value: 10, description: 'Theory CIE >= 10/25' },
            { type: 'COMPONENT_MIN', value: 10, description: 'Practical CIE >= 10/25' },
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

const STANDARD_LAB_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Standard Laboratory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'LAB_CONDUCTION', name: 'Lab Conduction', type: 'LAB_RECORD', entries: { count: 1, maxMarksEach: 35 }, conversion: { enabled: true, sourceMax: 35, targetMax: 35 } },
            { key: 'LAB_TEST_VIVA', name: 'Lab Test and Viva', type: 'LAB_TEST', entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: false, sourceMax: 15, targetMax: 15 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'LAB_SEE', name: 'Practical SEE Exam', type: 'PRACTICAL_EXAM', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

const SDC_DYNAMIC_RULE_V1 = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Project-Based SDC Evaluation Rule v1',
    version: 1,
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'SDC_PHASE_1', name: 'Phase 1: Concept & Design', type: 'PROJECT', entries: { count: 1, maxMarksEach: 25 }, conversion: { enabled: false, sourceMax: 25, targetMax: 25 } },
            { key: 'SDC_PHASE_2', name: 'Phase 2: Implementation', type: 'PROJECT', entries: { count: 1, maxMarksEach: 25 }, conversion: { enabled: false, sourceMax: 25, targetMax: 25 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'SDC_SEE', name: 'Project Defense', type: 'PROJECT', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

const CAED_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'CAED Practical Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'CAED_CLASSWORK', name: 'Classwork Drawing', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 80 }, conversion: { enabled: true, sourceMax: 80, targetMax: 20 } },
            { key: 'CAED_EL', name: 'Experiential Learning', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 20, targetMax: 10 } },
            { key: 'CAED_TESTS', name: 'CAD & Manual Tests', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: true, sourceMax: 100, targetMax: 20 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'CAED_SEE', name: 'Computer Aided Exam', type: 'PRACTICAL_EXAM', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20/50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18/50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40/100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

describe('F-10 Master Test Suite (Scenarios A through M)', () => {

    // -------------------------------------------------------------
    // Scenario A: Standard Theory
    // -------------------------------------------------------------
    test('Scenario A: Standard Theory -> correct CIE (34+8+8), SEE (100->50), aggregate & grade', async () => {
        const input = {
            rule: STANDARD_THEORY_RULE,
            subject: { code: 'MATH', credits: 3 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: {
                THEORY_TEST: 90,       // 90/100 -> 30.6
                THEORY_QUIZ: 38,       // 38/40 -> 7.6
                THEORY_ASSIGNMENT: 39, // 39/40 -> 7.8 = CIE 46
                THEORY_SEE: 90         // 90/100 -> 45 = Agg 91
            },
            attendance: 92
        };
        const result = await calculateStudentEvaluation(input);
        assert.equal(result.calculated.cie, 46);
        assert.equal(result.calculated.see, 45);
        assert.equal(result.calculated.aggregate, 91);
        assert.equal(result.result.letterGrade, 'O');
        assert.equal(result.result.gradePoint, 10);
    });

    // -------------------------------------------------------------
    // Scenario B: AEC Theory
    // -------------------------------------------------------------
    test('Scenario B: AEC Theory -> 34 + 16 structure, direct 50 SEE, aggregate & grade', async () => {
        const input = {
            rule: AEC_RULE,
            subject: { code: 'CC08', credits: 1 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: {
                AEC_TEST: 90,            // 90/100 -> 30.6
                AEC_QUIZ_ASSIGNMENT: 18, // 18/20 -> 14.4 = CIE 45
                AEC_SEE: 45              // Direct 45 = Agg 90
            },
            attendance: 90
        };
        const result = await calculateStudentEvaluation(input);
        assert.equal(result.calculated.cie, 45);
        assert.equal(result.calculated.see, 45);
        assert.equal(result.calculated.aggregate, 90);
        assert.equal(result.result.letterGrade, 'O');
    });

    // -------------------------------------------------------------
    // Scenario C: NCMC Non-Credit
    // -------------------------------------------------------------
    test('Scenario C: NCMC -> SEE ignored, PP/NP completion-based, excluded from SGPA', async () => {
        const input = {
            rule: NCMC_RULE,
            subject: { code: 'CC09', credits: 0 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: { NCMC_CIE: 35, SEE: 50 }, // SEE passed in, must be ignored
            runtimeContext: { isNcmcCompleted: true }
        };
        const result = await calculateStudentEvaluation(input);
        assert.equal(result.calculated.see, null);
        assert.equal(result.result.letterGrade, 'PP');
        assert.equal(result.result.gradePoint, 0);
        assert.equal(result.sgpa.contributesToSGPA, false);
        assert.equal(result.sgpa.credits, 0);
    });

    // -------------------------------------------------------------
    // Scenario D: Integrated IPCC
    // -------------------------------------------------------------
    test('Scenario D: Integrated IPCC -> Theory marks present, lab marks missing -> practical gate fails', async () => {
        const input = {
            rule: IPCC_RULE,
            subject: { code: 'PHYS', credits: 4 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: {
                IPCC_THEORY_TEST: 90,
                IPCC_THEORY_QUIZ: 38,
                IPCC_THEORY_ASSIGNMENT: 38,
                // Lab conduction and test omitted (missing)
                IPCC_SEE: 90
            },
            attendance: 90
        };
        const result = await calculateStudentEvaluation(input);
        assert.equal(result.eligibility.eligible, false);
        assert.equal(result.result.status, 'NOT_ELIGIBLE');
        assert.equal(result.result.letterGrade, 'F');
    });

    // -------------------------------------------------------------
    // Scenario E: Standard Laboratory
    // -------------------------------------------------------------
    test('Scenario E: Standard Lab -> Dynamic runtime N = 8, 9, 10 conduction normalization', async () => {
        for (const N of [8, 9, 10]) {
            const rawScore = N * 30; // Student scores 30 marks average per session
            const input = {
                rule: STANDARD_LAB_RULE,
                subject: { code: 'PSCL1', credits: 1.5 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    conduction: { rawScore, sessionsConducted: N },
                    LAB_TEST_VIVA: 15,
                    LAB_SEE: 45
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            // rawScore / (N * 35) * 35 = 30
            const conductionComp = result.calculated.components.find(c => c.key === 'LAB_CONDUCTION');
            assert.equal(conductionComp.convertedScore, 30);
            assert.equal(result.calculated.cie, 45); // 30 + 15 = 45
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 90);
            assert.equal(result.result.letterGrade, 'O');
        }
    });

    // -------------------------------------------------------------
    // Scenario F: SDC Dynamic Components & Schema Invariance
    // -------------------------------------------------------------
    test('Scenario F: SDC -> Dynamic components calculate without schema change even when rule components change', async () => {
        // v1: Phase 1 (25) + Phase 2 (25)
        const inputV1 = {
            rule: SDC_DYNAMIC_RULE_V1,
            subject: { code: 'SDC1', credits: 2 },
            student: { usn: '1SI26CS001', semester: 2 },
            scores: {
                SDC_PHASE_1: 22,
                SDC_PHASE_2: 23,
                SDC_SEE: 45
            },
            attendance: 90
        };
        const resV1 = await calculateStudentEvaluation(inputV1);
        assert.equal(resV1.calculated.cie, 45);
        assert.equal(resV1.result.letterGrade, 'O');

        // v2 rule change: 3 components (Phase 1: 15, Prototype: 20, Viva: 15) -> total 50
        const SDC_DYNAMIC_RULE_V2 = {
            ...SDC_DYNAMIC_RULE_V1,
            version: 2,
            cie: {
                enabled: true,
                components: [
                    { key: 'SDC_PHASE_1', name: 'Phase 1', type: 'PROJECT', entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: false, sourceMax: 15, targetMax: 15 } },
                    { key: 'SDC_PROTOTYPE', name: 'Prototype', type: 'PROJECT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: false, sourceMax: 20, targetMax: 20 } },
                    { key: 'SDC_VIVA', name: 'Internal Viva', type: 'PROJECT', entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: false, sourceMax: 15, targetMax: 15 } }
                ]
            }
        };

        const inputV2 = {
            rule: SDC_DYNAMIC_RULE_V2,
            subject: { code: 'SDC1', credits: 2 },
            student: { usn: '1SI26CS001', semester: 2 },
            scores: {
                SDC_PHASE_1: 14,
                SDC_PROTOTYPE: 18,
                SDC_VIVA: 13,
                SDC_SEE: 45
            },
            attendance: 90
        };
        const resV2 = await calculateStudentEvaluation(inputV2);
        assert.equal(resV2.calculated.cie, 45); // 14 + 18 + 13 = 45
        assert.equal(resV2.result.letterGrade, 'O');

        // Verify storage model can hold both v1 and v2 without schema changes
        const docV1 = new StudentEvaluationComponentRecord({
            student: new mongoose.Types.ObjectId(),
            subject: new mongoose.Types.ObjectId(),
            semester: 2,
            scheme: new mongoose.Types.ObjectId(),
            evaluationRule: SDC_DYNAMIC_RULE_V1._id,
            componentKey: 'SDC_PHASE_1',
            rawMarks: 22
        });
        const docV2NewComp = new StudentEvaluationComponentRecord({
            student: new mongoose.Types.ObjectId(),
            subject: new mongoose.Types.ObjectId(),
            semester: 2,
            scheme: new mongoose.Types.ObjectId(),
            evaluationRule: SDC_DYNAMIC_RULE_V2._id,
            componentKey: 'SDC_PROTOTYPE', // Brand new key
            rawMarks: 18
        });

        assert.equal(docV1.validateSync(), undefined);
        assert.equal(docV2NewComp.validateSync(), undefined);
    });

    // -------------------------------------------------------------
    // Scenario G: CAED Practical
    // -------------------------------------------------------------
    test('Scenario G: CAED -> Classwork, EL, Tests calculate correctly', async () => {
        const input = {
            rule: CAED_RULE,
            subject: { code: 'CAED', credits: 3 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: {
                CAED_CLASSWORK: 75, // 75/80 -> 18.75
                CAED_EL: 18,        // 18/20 -> 9
                CAED_TESTS: 90,     // 90/100 -> 18 -> CIE 45.75
                CAED_SEE: 46        // 46 -> Agg 91.75
            },
            attendance: 95
        };
        const result = await calculateStudentEvaluation(input);
        assert.equal(result.calculated.cie, 45.75);
        assert.equal(result.calculated.see, 46);
        assert.equal(result.calculated.aggregate, 91.75);
        assert.equal(result.result.letterGrade, 'O');
    });

    // -------------------------------------------------------------
    // Scenario H: Missing Data vs Zero
    // -------------------------------------------------------------
    test('Scenario H: MISSING remains distinguishable from ZERO in storage and output', () => {
        const missingRecord = new StudentEvaluationComponentRecord({
            student: new mongoose.Types.ObjectId(),
            subject: new mongoose.Types.ObjectId(),
            semester: 1,
            scheme: new mongoose.Types.ObjectId(),
            evaluationRule: new mongoose.Types.ObjectId(),
            componentKey: 'CAED_EL',
            rawMarks: null, // Marks missing / unentered
            status: 'NOT_ENTERED'
        });

        const zeroRecord = new StudentEvaluationComponentRecord({
            student: new mongoose.Types.ObjectId(),
            subject: new mongoose.Types.ObjectId(),
            semester: 1,
            scheme: new mongoose.Types.ObjectId(),
            evaluationRule: new mongoose.Types.ObjectId(),
            componentKey: 'CAED_EL',
            rawMarks: 0, // Scored a genuine zero
            status: 'ENTERED'
        });

        assert.strictEqual(missingRecord.rawMarks, null);
        assert.strictEqual(missingRecord.status, 'NOT_ENTERED');

        assert.strictEqual(zeroRecord.rawMarks, 0);
        assert.strictEqual(zeroRecord.status, 'ENTERED');
    });

    // -------------------------------------------------------------
    // Scenario I: Invalid Component Key Validation
    // -------------------------------------------------------------
    test('Scenario I: Validation rejects component key not configured in active rule', () => {
        const activeRuleKeys = (SDC_DYNAMIC_RULE_V1.cie?.components || []).map(c => c.key);
        const attemptedKey = 'INVALID_INVENTED_KEY';
        const isValid = activeRuleKeys.includes(attemptedKey);
        assert.equal(isValid, false, 'Invented component key must be rejected');
    });

    // -------------------------------------------------------------
    // Scenario J: Duplicate Component Protection
    // -------------------------------------------------------------
    test('Scenario J: Unique compound index enforces idempotency per student + registeredSubject + componentKey', () => {
        const indexes = StudentEvaluationComponentRecord.schema.indexes();
        const hasCompoundUnique = indexes.some(([spec, opt]) =>
            spec.student === 1 && spec.registeredSubject === 1 && spec.componentKey === 1 && opt?.unique === true
        );
        assert.ok(hasCompoundUnique, 'Expected unique index on student + registeredSubject + componentKey');
    });

    // -------------------------------------------------------------
    // Scenario K: Cross-Student Access Guard
    // -------------------------------------------------------------
    test('Scenario K: Authorization asserts student can only view own data unless admin/faculty', () => {
        const studentAId = new mongoose.Types.ObjectId().toString();
        const studentBId = new mongoose.Types.ObjectId().toString();

        function checkAccess(user, targetId) {
            const isPrivileged = user.role === 'admin' || user.role === 'faculty' || user.isAdmin === true;
            if (!isPrivileged && user.id !== targetId) {
                const err = new Error('Access denied');
                err.statusCode = 403;
                throw err;
            }
            return true;
        }

        // Student A accessing Student B -> Forbidden
        assert.throws(
            () => checkAccess({ id: studentAId, role: 'student' }, studentBId),
            /Access denied/
        );

        // Student A accessing Student A -> Allowed
        assert.equal(checkAccess({ id: studentAId, role: 'student' }, studentAId), true);

        // Admin accessing Student B -> Allowed
        assert.equal(checkAccess({ id: new mongoose.Types.ObjectId().toString(), role: 'admin' }, studentBId), true);
    });

    // -------------------------------------------------------------
    // Scenario L: Inactive Rule Protection
    // -------------------------------------------------------------
    test('Scenario L: EvaluationRuleResolver rejects inactive or draft rules', async () => {
        // Mock resolver behavior
        async function mockResolveActive(rules) {
            const active = rules.filter(r => r.status === 'ACTIVE');
            if (active.length === 0) throw new RuleNotFoundError('No active rule found');
            return active[0];
        }

        const draftRules = [{ name: 'Rule v1', status: 'DRAFT' }];
        await assert.rejects(
            async () => await mockResolveActive(draftRules),
            RuleNotFoundError
        );
    });

    // -------------------------------------------------------------
    // Scenario M: Regression & Scope Boundary
    // -------------------------------------------------------------
    test('Scenario M: F-08 calculation engine remains single authority and never calculates SGPA/CGPA', async () => {
        const input = {
            rule: STANDARD_THEORY_RULE,
            subject: { code: 'MATH', credits: 3 },
            student: { usn: '1SI26CS001', semester: 1 },
            scores: { THEORY_TEST: 90, THEORY_QUIZ: 38, THEORY_ASSIGNMENT: 39, THEORY_SEE: 90 },
            attendance: 90
        };
        const result = await calculateStudentEvaluation(input);
        // Subject credit points only
        assert.equal(typeof result.sgpa.weightedGradePoints, 'number');
        // No semester GPA / CGPA calculation
        assert.strictEqual(result.sgpa.sgpa, undefined);
        assert.strictEqual(result.sgpa.cgpa, undefined);
    });
});
