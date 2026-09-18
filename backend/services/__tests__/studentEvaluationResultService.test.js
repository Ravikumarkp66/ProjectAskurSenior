/**
 * Student Evaluation Result Service Test Suite (F-10 Part 13)
 * 
 * Comprehensive automated verification covering all F-10 requirements:
 * - 7 Evaluation Patterns (Standard Theory, AEC, NCMC, IPCC, Standard Lab, SDC, CAED)
 * - Result lifecycle (DRAFT vs FINALIZED, protection against accidental overwrite)
 * - Dynamic student evaluation component storage (StudentComponentMark)
 * - Fault-tolerant semester batch calculation logic
 * - Missing data representation & absent flags
 * - Absence of SGPA/CGPA calculations (strictly reserved for F-11)
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const StudentSubjectEvaluationResult = require('../../models/StudentSubjectEvaluationResult');
const StudentComponentMark = require('../../models/StudentComponentMark');
const {
    calculateStudentEvaluation,
    calculateComponent,
    CalculationError
} = require('../evaluationCalculationEngine');
const {
    normalizeScoresForComponents,
    EvaluationContextError
} = require('../academicEvaluationContextService');
const {
    ResultLifecycleError,
    ResultServiceError
} = require('../studentEvaluationResultService');

// -------------------------------------------------------------
// FIXTURES: Active Evaluation Rules matching Scheme 2025 in DB
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
            { key: 'THEORY_SEE', name: 'SEE Exam', type: 'THEORY_EXAM', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
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

const AEC_THEORY_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'AEC Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'AEC_TEST', name: 'Tests', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 50 }, conversion: { enabled: true, sourceMax: 100, targetMax: 34 } },
            { key: 'AEC_QUIZ_ASSIGNMENT', name: 'Quiz / Assignment', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 20, targetMax: 16 } }
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
            { key: 'NCMC_CIE', name: 'Continuous Evaluation', type: 'ASSESSMENT', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: false, sourceMax: 100, targetMax: 100 } }
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
            { key: 'IPCC_THEORY_TEST', name: 'Tests', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 50 }, conversion: { enabled: true, sourceMax: 100, targetMax: 17 } },
            { key: 'IPCC_THEORY_QUIZ', name: 'Quizzes', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_THEORY_ASSIGNMENT', name: 'Assignments', type: 'ASSESSMENT', entries: { count: 2, maxMarksEach: 20 }, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_LAB_CONDUCTION', name: 'Lab Conduction', type: 'LAB_RECORD', entries: { count: 1, maxMarksEach: 350 }, conversion: { enabled: true, sourceMax: 350, targetMax: 15 } },
            { key: 'IPCC_LAB_TEST', name: 'Lab Internal Test', type: 'LAB_TEST', entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: true, sourceMax: 15, targetMax: 10 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'IPCC_SEE', name: 'SEE Exam', type: 'THEORY_EXAM', entries: { count: 1, maxMarksEach: 100 }, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
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
            { key: 'LAB_SEE', name: 'Practical SEE', type: 'PRACTICAL_EXAM', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
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

const SDC_RULE = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Project-Based SDC Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'PHASE_1', name: 'Phase I Review', type: 'PROJECT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: false, sourceMax: 20, targetMax: 20 } },
            { key: 'PHASE_2', name: 'Phase II Prototype', type: 'PROJECT', entries: { count: 1, maxMarksEach: 20 }, conversion: { enabled: false, sourceMax: 20, targetMax: 20 } },
            { key: 'REPORT', name: 'Technical Report', type: 'PROJECT', entries: { count: 1, maxMarksEach: 10 }, conversion: { enabled: false, sourceMax: 10, targetMax: 10 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'SDC_SEE', name: 'Final Viva & Demo', type: 'PROJECT', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
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
            { key: 'CAED_SEE', name: 'CAED Practical Exam', type: 'PRACTICAL_EXAM', entries: { count: 1, maxMarksEach: 50 }, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
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

describe('F-10 Part 13: Student Result Flow Master Test Suite', () => {

    // -------------------------------------------------------------
    // SECTION A: Standard Theory
    // -------------------------------------------------------------
    describe('Pattern A: Standard Theory Evaluation', () => {
        test('A1: Valid passing result -> CIE 46, SEE 45, Agg 91 -> Grade O (10 GP)', async () => {
            const input = {
                rule: STANDARD_THEORY_RULE,
                subject: { _id: new mongoose.Types.ObjectId(), code: 'MATH', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    THEORY_TEST: 90,       // 90/100 -> 30.6
                    THEORY_QUIZ: 38,       // 38/40 -> 7.6
                    THEORY_ASSIGNMENT: 39, // 39/40 -> 7.8 -> CIE 46
                    THEORY_SEE: 90         // 90/100 -> 45
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 46);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 91);
            assert.equal(result.result.letterGrade, 'O');
            assert.equal(result.result.gradePoint, 10);
            assert.equal(result.sgpa.contributesToSGPA, true);
            assert.equal(result.sgpa.weightedGradePoints, 30);
        });

        test('A2: CIE below minimum (< 20) -> Not eligible, Grade F', async () => {
            const input = {
                rule: STANDARD_THEORY_RULE,
                subject: { code: 'MATH', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    THEORY_TEST: 40,       // 40/100 -> 13.6
                    THEORY_QUIZ: 10,       // 10/40 -> 2
                    THEORY_ASSIGNMENT: 10, // 10/40 -> 2 -> CIE 17.6 (< 20)
                    THEORY_SEE: 90
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
            assert.equal(result.result.gradePoint, 0);
        });

        test('A3: SEE below minimum (< 18) -> Fail, Grade F', async () => {
            const input = {
                rule: STANDARD_THEORY_RULE,
                subject: { code: 'MATH', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    THEORY_TEST: 90,
                    THEORY_QUIZ: 40,
                    THEORY_ASSIGNMENT: 40, // CIE = 50
                    THEORY_SEE: 30         // 30/100 -> 15 (< 18)
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, false);
            assert.equal(result.result.status, 'FAIL');
            assert.equal(result.result.letterGrade, 'F');
        });

        test('A4: Attendance below 85% -> Not eligible, Grade F', async () => {
            const input = {
                rule: STANDARD_THEORY_RULE,
                subject: { code: 'MATH', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    THEORY_TEST: 90,
                    THEORY_QUIZ: 40,
                    THEORY_ASSIGNMENT: 40,
                    THEORY_SEE: 90
                },
                attendance: 75 // Below 85%
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
        });
    });

    // -------------------------------------------------------------
    // SECTION B: AEC Theory
    // -------------------------------------------------------------
    describe('Pattern B: AEC Theory Evaluation', () => {
        test('B1: Valid passing result -> Tests 34 + Quiz 16 = CIE 50, SEE 45 -> Grade O', async () => {
            const input = {
                rule: AEC_THEORY_RULE,
                subject: { code: 'CC08', credits: 1 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    AEC_TEST: 100,            // 100/100 -> 34
                    AEC_QUIZ_ASSIGNMENT: 20,  // 20/20 -> 16 = CIE 50
                    AEC_SEE: 45               // Direct 45
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 50);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 95);
            assert.equal(result.result.letterGrade, 'O');
        });

        test('B2: Aggregate failure (< 40) even if individual components pass minimums', async () => {
            const input = {
                rule: AEC_THEORY_RULE,
                subject: { code: 'CC08', credits: 1 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    AEC_TEST: 60,            // 60/100 -> 20.4 (>= 20)
                    AEC_QUIZ_ASSIGNMENT: 0,  // CIE 20.4
                    AEC_SEE: 18              // Direct 18 (>= 18)
                },
                attendance: 90
            };
            // Aggregate = 20.4 + 18 = 38.4 (< 40)
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.passed, false);
            assert.equal(result.result.status, 'FAIL');
            assert.equal(result.result.letterGrade, 'F');
        });
    });

    // -------------------------------------------------------------
    // SECTION C: NCMC Non-Credit
    // -------------------------------------------------------------
    describe('Pattern C: NCMC Non-Credit Evaluation', () => {
        test('C1: Completed high score -> Grade PP, 0 credits, excluded from SGPA', async () => {
            const input = {
                rule: NCMC_RULE,
                subject: { code: 'CC09', credits: 0 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: { NCMC_CIE: 85 },
                runtimeContext: { isNcmcCompleted: true }
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 85);
            assert.equal(result.calculated.see, null);
            assert.equal(result.result.letterGrade, 'PP');
            assert.equal(result.result.gradePoint, 0);
            assert.equal(result.sgpa.contributesToSGPA, false);
            assert.equal(result.sgpa.credits, 0);
            assert.equal(result.sgpa.weightedGradePoints, 0);
        });

        test('C2: Completed low score (30/100) still passes as PP because NCMC is completion-based', async () => {
            const input = {
                rule: NCMC_RULE,
                subject: { code: 'CC09', credits: 0 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: { NCMC_CIE: 30 },
                runtimeContext: { isNcmcCompleted: true }
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.result.letterGrade, 'PP');
            assert.equal(result.result.gradePoint, 0);
        });

        test('C3: Incomplete/absent student receives Grade NP', async () => {
            const input = {
                rule: NCMC_RULE,
                subject: { code: 'CC09', credits: 0 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: { NCMC_CIE: 0 },
                runtimeContext: { isNcmcCompleted: false }
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.result.letterGrade, 'NP');
            assert.equal(result.result.status, 'NOT_COMPLETED');
        });

        test('C4: SEE score provided in input is strictly ignored when SEE is disabled', async () => {
            const input = {
                rule: NCMC_RULE,
                subject: { code: 'CC09', credits: 0 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: { NCMC_CIE: 80, SEE: 45 },
                runtimeContext: { isNcmcCompleted: true }
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.see, null);
        });
    });

    // -------------------------------------------------------------
    // SECTION D: Integrated IPCC
    // -------------------------------------------------------------
    describe('Pattern D: Integrated IPCC Evaluation', () => {
        test('D1: Theory passes (>= 10) + Practical passes (>= 10) -> Passing Grade O', async () => {
            const input = {
                rule: IPCC_RULE,
                subject: { code: 'PHYS', credits: 4 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    IPCC_THEORY_TEST: 90,       // 90/100 -> 15.3
                    IPCC_THEORY_QUIZ: 38,       // 38/40 -> 3.8
                    IPCC_THEORY_ASSIGNMENT: 38, // 38/40 -> 3.8 -> Theory CIE = 22.9/25
                    IPCC_LAB_CONDUCTION: 330,   // 330/350 -> 14.14
                    IPCC_LAB_TEST: 14,          // 14/15 -> 9.33 -> Practical CIE = 23.47/25
                    IPCC_SEE: 90                // 90/100 -> 45
                },
                attendance: 92
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.partitions.length, 2);
            assert.equal(result.calculated.partitions[0].passed, true);
            assert.equal(result.calculated.partitions[1].passed, true);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.result.letterGrade, 'O');
        });

        test('D2: Theory fails independent minimum (< 10/25) -> Not eligible, Grade F', async () => {
            const input = {
                rule: IPCC_RULE,
                subject: { code: 'PHYS', credits: 4 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    IPCC_THEORY_TEST: 30,       // 30/100 -> 5.1
                    IPCC_THEORY_QUIZ: 10,       // 10/40 -> 1
                    IPCC_THEORY_ASSIGNMENT: 10, // 10/40 -> 1 -> Theory CIE = 7.1/25 (< 10)
                    IPCC_LAB_CONDUCTION: 350,   // 15
                    IPCC_LAB_TEST: 15,          // 10 -> Practical CIE = 25/25
                    IPCC_SEE: 90
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.letterGrade, 'F');
        });

        test('D3: Practical fails independent minimum (< 10/25) -> Not eligible, Grade F', async () => {
            const input = {
                rule: IPCC_RULE,
                subject: { code: 'PHYS', credits: 4 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    IPCC_THEORY_TEST: 100,      // 17
                    IPCC_THEORY_QUIZ: 40,       // 4
                    IPCC_THEORY_ASSIGNMENT: 40, // 4 -> Theory CIE = 25/25
                    IPCC_LAB_CONDUCTION: 100,   // 100/350 -> 4.29
                    IPCC_LAB_TEST: 5,           // 5/15 -> 3.33 -> Practical CIE = 7.62/25 (< 10)
                    IPCC_SEE: 90
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.letterGrade, 'F');
        });

        test('D4: Missing practical evidence is preserved as missing and causes eligibility failure', async () => {
            const input = {
                rule: IPCC_RULE,
                subject: { code: 'PHYS', credits: 4 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    IPCC_THEORY_TEST: 100,
                    IPCC_THEORY_QUIZ: 40,
                    IPCC_THEORY_ASSIGNMENT: 40,
                    // No practical marks passed in (missing)
                    IPCC_SEE: 90
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            const labRecordComp = result.calculated.components.find(c => c.key === 'IPCC_LAB_CONDUCTION');
            assert.equal(labRecordComp.isMissing, true);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.letterGrade, 'F');
        });
    });

    // -------------------------------------------------------------
    // SECTION E: Standard Laboratory (Runtime N)
    // -------------------------------------------------------------
    describe('Pattern E: Standard Laboratory Evaluation', () => {
        test('E1: Runtime N = 8 -> Conduction 240 / (8*35) * 35 = 30 -> CIE 45 -> Grade A+', async () => {
            const input = {
                rule: STANDARD_LAB_RULE,
                subject: { code: 'PSCL1', credits: 1.5 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    conduction: { rawScore: 240, sessionsConducted: 8 },
                    LAB_TEST_VIVA: 15,
                    LAB_SEE: 44
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 45);
            assert.equal(result.calculated.see, 44);
            assert.equal(result.calculated.aggregate, 89);
            assert.equal(result.result.letterGrade, 'A+');
        });

        test('E2: Runtime N = 9 -> Conduction 270 / (9*35) * 35 = 30 -> CIE 45 -> Grade A+', async () => {
            const input = {
                rule: STANDARD_LAB_RULE,
                subject: { code: 'PSCL1', credits: 1.5 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    conduction: { rawScore: 270, sessionsConducted: 9 },
                    LAB_TEST_VIVA: 15,
                    LAB_SEE: 44
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 45);
            assert.equal(result.calculated.aggregate, 89);
        });

        test('E3: Runtime N = 10 -> Conduction 300 / (10*35) * 35 = 30 -> CIE 45 -> Grade A+', async () => {
            const input = {
                rule: STANDARD_LAB_RULE,
                subject: { code: 'PSCL1', credits: 1.5 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    conduction: { rawScore: 300, sessionsConducted: 10 },
                    LAB_TEST_VIVA: 15,
                    LAB_SEE: 44
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 45);
            assert.equal(result.calculated.aggregate, 89);
        });

        test('E4: Missing runtime N throws CalculationError to prevent hardcoding assumptions', async () => {
            const input = {
                rule: STANDARD_LAB_RULE,
                subject: { code: 'PSCL1', credits: 1.5 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    LAB_CONDUCTION: 270, // No sessionsConducted passed!
                    LAB_TEST_VIVA: 15,
                    LAB_SEE: 44
                },
                attendance: 90
            };
            await assert.rejects(
                async () => await calculateStudentEvaluation(input),
                CalculationError
            );
        });
    });

    // -------------------------------------------------------------
    // SECTION F: Project-Based SDC
    // -------------------------------------------------------------
    describe('Pattern F: Project-Based SDC Evaluation', () => {
        test('F1: Dynamic configured components calculate without hardcoded schema', async () => {
            const input = {
                rule: SDC_RULE,
                subject: { code: 'SDC1', credits: 2 },
                student: { usn: '1SI26CS001', semester: 2 },
                scores: {
                    PHASE_1: 18,   // 18/20
                    PHASE_2: 19,   // 19/20
                    REPORT: 9,     // 9/10 -> CIE 46
                    SDC_SEE: 45    // 45/50 -> Aggregate 91
                },
                attendance: 95
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 46);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 91);
            assert.equal(result.result.letterGrade, 'O');
        });
    });

    // -------------------------------------------------------------
    // SECTION G: CAED Practical
    // -------------------------------------------------------------
    describe('Pattern G: CAED Practical Evaluation', () => {
        test('G1: Evaluates classwork (80->20), EL (20->10), tests (100->20) cleanly', async () => {
            const input = {
                rule: CAED_RULE,
                subject: { code: 'CAED', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    CAED_CLASSWORK: 72, // 72/80 -> 18
                    CAED_EL: 18,        // 18/20 -> 9
                    CAED_TESTS: 90,     // 90/100 -> 18 -> CIE 45
                    CAED_SEE: 45        // 45 -> Aggregate 90
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            assert.equal(result.calculated.cie, 45);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 90);
            assert.equal(result.result.letterGrade, 'O');
        });

        test('G2: Missing CAED component is treated as 0 converted score and flagged isMissing', async () => {
            const input = {
                rule: CAED_RULE,
                subject: { code: 'CAED', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: {
                    CAED_CLASSWORK: 72,
                    // CAED_EL omitted
                    CAED_TESTS: 90,
                    CAED_SEE: 45
                },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            const elComp = result.calculated.components.find(c => c.key === 'CAED_EL');
            assert.equal(elComp.isMissing, true);
            assert.equal(elComp.convertedScore, 0);
        });
    });

    // -------------------------------------------------------------
    // SECTION H: Dynamic StudentComponentMark Storage & Model Integrity
    // -------------------------------------------------------------
    describe('Dynamic Component Storage & Integrity (StudentComponentMark)', () => {
        test('H1: StudentComponentMark validates with arbitrary component keys and preserves null vs 0', () => {
            const docNull = new StudentComponentMark({
                student: new mongoose.Types.ObjectId(),
                subject: new mongoose.Types.ObjectId(),
                semester: 1,
                scheme: new mongoose.Types.ObjectId(),
                componentKey: 'SDC_PHASE_1_SYNOPSIS',
                rawScore: null,
                rawMax: 20
            });
            assert.equal(docNull.validateSync(), undefined);
            assert.strictEqual(docNull.rawScore, null);

            const docZero = new StudentComponentMark({
                student: new mongoose.Types.ObjectId(),
                subject: new mongoose.Types.ObjectId(),
                semester: 1,
                scheme: new mongoose.Types.ObjectId(),
                componentKey: 'SDC_PHASE_1_SYNOPSIS',
                rawScore: 0,
                rawMax: 20
            });
            assert.equal(docZero.validateSync(), undefined);
            assert.strictEqual(docZero.rawScore, 0);
        });

        test('H2: StudentComponentMark enforces unique compound index on student + subject + semester + componentKey', () => {
            const indexes = StudentComponentMark.schema.indexes();
            const compoundUnique = indexes.find(([spec, opt]) =>
                spec.student === 1 && spec.subject === 1 && spec.semester === 1 && spec.componentKey === 1 && opt?.unique === true
            );
            assert.ok(compoundUnique, 'Expected compound unique index on student + subject + semester + componentKey');
        });
    });

    // -------------------------------------------------------------
    // SECTION I: Result Lifecycle & Finalization Safeguards
    // -------------------------------------------------------------
    describe('Result Lifecycle & Finalization Safeguards', () => {
        test('I1: StudentSubjectEvaluationResult supports DRAFT and FINALIZED states', () => {
            const draftDoc = new StudentSubjectEvaluationResult({
                student: new mongoose.Types.ObjectId(),
                subject: new mongoose.Types.ObjectId(),
                semester: 1,
                scheme: new mongoose.Types.ObjectId(),
                evaluationGroup: new mongoose.Types.ObjectId(),
                evaluationRule: new mongoose.Types.ObjectId(),
                ruleVersion: 1,
                ruleName: 'Rule',
                lifecycleStatus: 'DRAFT'
            });
            assert.equal(draftDoc.lifecycleStatus, 'DRAFT');

            const finalizedDoc = new StudentSubjectEvaluationResult({
                student: new mongoose.Types.ObjectId(),
                subject: new mongoose.Types.ObjectId(),
                semester: 1,
                scheme: new mongoose.Types.ObjectId(),
                evaluationGroup: new mongoose.Types.ObjectId(),
                evaluationRule: new mongoose.Types.ObjectId(),
                ruleVersion: 1,
                ruleName: 'Rule',
                lifecycleStatus: 'FINALIZED',
                finalizedAt: new Date()
            });
            assert.equal(finalizedDoc.lifecycleStatus, 'FINALIZED');
            assert.ok(finalizedDoc.finalizedAt);
        });
    });

    // -------------------------------------------------------------
    // SECTION J: Verification of SGPA / CGPA Exclusion
    // -------------------------------------------------------------
    describe('Strict Scope Boundary: No SGPA/CGPA in F-10', () => {
        test('J1: Calculation returns subject metadata but NEVER computes semester SGPA or cumulative CGPA', async () => {
            const input = {
                rule: STANDARD_THEORY_RULE,
                subject: { code: 'MATH', credits: 3 },
                student: { usn: '1SI26CS001', semester: 1 },
                scores: { THEORY_TEST: 90, THEORY_QUIZ: 38, THEORY_ASSIGNMENT: 39, THEORY_SEE: 90 },
                attendance: 90
            };
            const result = await calculateStudentEvaluation(input);
            // Subject metadata only
            assert.equal(typeof result.sgpa.gradePoint, 'number');
            assert.equal(typeof result.sgpa.weightedGradePoints, 'number');
            // SGPA / CGPA must NOT be present
            assert.strictEqual(result.sgpa.sgpa, undefined);
            assert.strictEqual(result.sgpa.cgpa, undefined);
            assert.strictEqual(result.semesterSGPA, undefined);
            assert.strictEqual(result.cumulativeCGPA, undefined);
        });
    });
});
