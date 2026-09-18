const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
    calculateStudentEvaluation,
    calculateComponent,
    aggregateRawScore,
    round,
    CalculationError
} = require('../evaluationCalculationEngine');

const {
    resolveActiveEvaluationRule,
    RuleNotFoundError,
    DuplicateActiveRuleError,
    EvaluationGroupNotFoundError,
    EvaluationSubjectNotFoundError
} = require('../evaluationRuleResolver');

// -------------------------------------------------------------
// RULE FIXTURES (Matching exact active Scheme 2025 rules in DB)
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

const STANDARD_ELIGIBILITY = {
    enabled: true,
    operator: 'AND',
    conditions: [
        { type: 'CIE_MIN', componentKey: null, value: 20, unit: 'MARKS', description: 'CIE >= 20 / 50' },
        { type: 'ATTENDANCE_MIN', componentKey: null, value: 85, unit: 'PERCENTAGE', description: 'Attendance >= 85%' },
        { type: 'SEE_MIN', componentKey: null, value: 18, unit: 'MARKS', description: 'SEE >= 18 / 50' },
        { type: 'AGGREGATE_MIN', componentKey: null, value: 40, unit: 'MARKS', description: 'CIE + SEE >= 40 / 100' }
    ]
};

// 1. Standard Theory Fixture
const standardTheoryRule = {
    _id: '6aac3c80d02f25f26d9d118e',
    name: 'Standard Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'THEORY_TEST', name: 'Tests', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 34 } },
            { key: 'THEORY_QUIZ', name: 'Quizzes', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 40, targetMax: 8 } },
            { key: 'THEORY_ASSIGNMENT', name: 'Assignments / ABL', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 40, targetMax: 8 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'THEORY_SEE', name: 'Theory Examination', type: 'THEORY_EXAM', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
        ]
    },
    eligibility: STANDARD_ELIGIBILITY,
    gradeScale: STANDARD_GRADE_SCALE
};

// 2. AEC Theory Fixture
const aecTheoryRule = {
    _id: '6aac3dcca046ef05a89fda68',
    name: 'AEC Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'AEC_TEST', name: 'Internal Assessment Tests', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 34 } },
            { key: 'AEC_QUIZ_ASSIGNMENT', name: 'Quiz / Assignment', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 20, targetMax: 16 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'AEC_SEE', name: 'Theory / MCQ Examination', type: 'THEORY_EXAM', enabled: true, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20 / 50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18 / 50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40 / 100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

// 3. NCMC Non-Credit Fixture
const ncmcRule = {
    _id: '6aac3f0d672838bf121463a7',
    name: 'NCMC Non-Credit Evaluation Rule',
    contributesToSGPA: false,
    cie: {
        enabled: true,
        components: [
            { key: 'NCMC_CIE', name: 'Continuous Internal Evaluation', type: 'ASSESSMENT', enabled: true, conversion: { enabled: false, sourceMax: 100, targetMax: 100 } }
        ]
    },
    see: { enabled: false, components: [] },
    eligibility: { enabled: false, operator: 'AND', conditions: [] },
    gradeScale: {
        enabled: true,
        type: 'PASS_FAIL',
        grades: [
            { grade: 'PP', minMarks: 0, maxMarks: 100, gradePoint: 0, order: 1 },
            { grade: 'NP', minMarks: 0, maxMarks: 0, gradePoint: 0, order: 2 }
        ]
    }
};

// 4. Integrated IPCC Fixture
const integratedIpccRule = {
    _id: '6aac40b84fe1bdebb9b29191',
    name: 'Integrated IPCC Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'IPCC_THEORY_TEST', name: 'Theory: Internal Tests', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 17 } },
            { key: 'IPCC_THEORY_QUIZ', name: 'Theory: Quizzes', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_THEORY_ASSIGNMENT', name: 'Theory: Assignments / ABL', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 40, targetMax: 4 } },
            { key: 'IPCC_LAB_CONDUCTION', name: 'Practical: Lab Conduction & Record', type: 'LAB_RECORD', enabled: true, conversion: { enabled: true, sourceMax: 350, targetMax: 15 } },
            { key: 'IPCC_LAB_TEST', name: 'Practical: Lab Internal Test', type: 'LAB_TEST', enabled: true, conversion: { enabled: true, sourceMax: 15, targetMax: 10 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'IPCC_SEE', name: 'Integrated Written Examination', type: 'THEORY_EXAM', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'COMPONENT_MIN', componentKey: 'IPCC_THEORY_TEST', value: 10, description: 'Theory CIE subtotal >= 10 / 25' },
            { type: 'COMPONENT_MIN', componentKey: 'IPCC_LAB_TEST', value: 10, description: 'Practical CIE subtotal >= 10 / 25' },
            { type: 'CIE_MIN', value: 20, description: 'Overall CIE >= 20 / 50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18 / 50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40 / 100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

// 5. Standard Laboratory Fixture
const standardLabRule = {
    _id: '6aac41325d04884d4a5b730e',
    name: 'Standard Laboratory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'LAB_CONDUCTION', name: 'Continuous Lab Conduction & Record', type: 'LAB_RECORD', enabled: true, entries: { count: 1, maxMarksEach: 35 }, conversion: { enabled: true, sourceMax: 35, targetMax: 35 } },
            { key: 'LAB_TEST', name: 'Lab Internal Test & Viva Voce', type: 'LAB_TEST', enabled: true, entries: { count: 1, maxMarksEach: 15 }, conversion: { enabled: false, sourceMax: 15, targetMax: 15 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'LAB_SEE', name: 'Laboratory Practical Examination', type: 'PRACTICAL_EXAM', enabled: true, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20 / 50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18 / 50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40 / 100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

// 6. Project-Based SDC Fixture
const projectSdcRule = {
    _id: '6aac41335d04884d4a5b731c',
    name: 'Project-Based SDC Evaluation Rule',
    contributesToSGPA: true,
    cie: { enabled: true, components: [] },
    see: {
        enabled: true,
        components: [
            { key: 'SDC_SEE', name: 'Project Demonstration, Exhibition & Viva Voce', type: 'PRACTICAL_EXAM', enabled: true, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20 / 50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18 / 50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40 / 100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

// 7. CAED Practical Fixture
const caedRule = {
    _id: '6aac41345d04884d4a5b7325',
    name: 'CAED Practical Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'CAED_CLASSWORK', name: 'Classwork: Sketchbook & CAD Printouts', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 80, targetMax: 20 } },
            { key: 'CAED_EL', name: 'Experiential Learning', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 20, targetMax: 10 } },
            { key: 'CAED_TESTS', name: 'CAD & Manual Tests', type: 'ASSESSMENT', enabled: true, conversion: { enabled: true, sourceMax: 100, targetMax: 20 } }
        ]
    },
    see: {
        enabled: true,
        components: [
            { key: 'CAED_SEE', name: 'CAD Practical Examination', type: 'PRACTICAL_EXAM', enabled: true, conversion: { enabled: false, sourceMax: 50, targetMax: 50 } }
        ]
    },
    eligibility: {
        enabled: true,
        operator: 'AND',
        conditions: [
            { type: 'CIE_MIN', value: 20, description: 'CIE >= 20 / 50' },
            { type: 'ATTENDANCE_MIN', value: 85, description: 'Attendance >= 85%' },
            { type: 'SEE_MIN', value: 18, description: 'SEE >= 18 / 50' },
            { type: 'AGGREGATE_MIN', value: 40, description: 'Aggregate >= 40 / 100' }
        ]
    },
    gradeScale: STANDARD_GRADE_SCALE
};

// -------------------------------------------------------------
// UNIT TEST SUITE
// -------------------------------------------------------------

describe('F-08: Student Academic Evaluation Calculation Engine', () => {

    describe('Pattern 1: Standard Theory', () => {
        test('CASE 1: Standard Theory high score -> Grade O (10 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'MATH', credits: 4 },
                scores: {
                    THEORY_TEST: 90,       // 90/100 -> 30.6
                    THEORY_QUIZ: 38,       // 38/40  -> 7.6
                    THEORY_ASSIGNMENT: 38, // 38/40  -> 7.6 (CIE = 45.8)
                    THEORY_SEE: 92         // 92/100 -> 46
                },
                attendance: 90
            });

            assert.equal(result.calculated.cie, 45.8);
            assert.equal(result.calculated.see, 46);
            assert.equal(result.calculated.aggregate, 91.8);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, true);
            assert.equal(result.result.letterGrade, 'O');
            assert.equal(result.result.gradePoint, 10);
            assert.equal(result.sgpa.weightedGradePoints, 40);
        });

        test('CASE 2: Standard Theory exact pass boundary -> Grade C (5 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'PSC1', credits: 3 },
                scores: {
                    THEORY_TEST: 50,       // 50/100 -> 17
                    THEORY_QUIZ: 15,       // 15/40  -> 3
                    THEORY_ASSIGNMENT: 0,  // 0/40   -> 0 (CIE = 20)
                    THEORY_SEE: 40         // 40/100 -> 20 (Aggregate = 40)
                },
                attendance: 85             // Exact 85% boundary
            });

            assert.equal(result.calculated.cie, 20);
            assert.equal(result.calculated.see, 20);
            assert.equal(result.calculated.aggregate, 40);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, true);
            assert.equal(result.result.letterGrade, 'C');
            assert.equal(result.result.gradePoint, 5);
            assert.equal(result.sgpa.weightedGradePoints, 15);
        });

        test('CASE 3: CIE below minimum (< 20) -> Ineligible, Grade F (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'PSC2', credits: 3 },
                scores: {
                    THEORY_TEST: 30,       // 30/100 -> 10.2
                    THEORY_QUIZ: 20,       // 20/40  -> 4
                    THEORY_ASSIGNMENT: 20, // 20/40  -> 4 (CIE = 18.2 < 20)
                    THEORY_SEE: 80
                },
                attendance: 88
            });

            assert.equal(result.calculated.cie, 18.2);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.eligibility.passed, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
            assert.equal(result.result.gradePoint, 0);
            assert.equal(result.sgpa.weightedGradePoints, 0);
        });

        test('CASE 4: SEE below minimum (< 18) -> Fail, Grade F (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'PSC3', credits: 3 },
                scores: {
                    THEORY_TEST: 80,       // 27.2
                    THEORY_QUIZ: 30,       // 6.0
                    THEORY_ASSIGNMENT: 30, // 6.0 (CIE = 39.2 >= 20)
                    THEORY_SEE: 30         // 30/100 -> 15 (< 18)
                },
                attendance: 90
            });

            assert.equal(result.calculated.cie, 39.2);
            assert.equal(result.calculated.see, 15);
            assert.equal(result.calculated.aggregate, 54.2);
            assert.equal(result.eligibility.eligible, true); // Eligible for SEE
            assert.equal(result.eligibility.passed, false);  // But failed SEE minimum
            assert.equal(result.result.status, 'FAIL');
            assert.equal(result.result.letterGrade, 'F');
            assert.equal(result.result.gradePoint, 0);
        });

        test('CASE 5: Attendance below minimum (< 85%) -> Ineligible, Grade F (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'PSC4', credits: 3 },
                scores: {
                    THEORY_TEST: 90,
                    THEORY_QUIZ: 35,
                    THEORY_ASSIGNMENT: 35,
                    THEORY_SEE: 80
                },
                attendance: 80 // < 85%
            });

            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.eligibility.passed, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
            assert.ok(result.eligibility.failedConditions.some(c => c.includes('Attendance')));
        });
    });

    describe('Pattern 2: AEC Theory (34 + 16)', () => {
        test('CASE 6: AEC 34+16 high score -> Grade O (10 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: aecTheoryRule,
                subject: { code: 'CC08', credits: 1 },
                scores: {
                    AEC_TEST: 90,            // 90/100 -> 30.6
                    AEC_QUIZ_ASSIGNMENT: 18, // 18/20  -> 14.4 (CIE = 45)
                    AEC_SEE: 46              // 46/50 direct -> 46 (Aggregate = 91)
                },
                attendance: 92
            });

            assert.equal(result.calculated.cie, 45);
            assert.equal(result.calculated.see, 46);
            assert.equal(result.calculated.aggregate, 91);
            assert.equal(result.result.letterGrade, 'O');
            assert.equal(result.result.gradePoint, 10);
            assert.equal(result.sgpa.weightedGradePoints, 10);
        });

        test('CASE 7: AEC aggregate failure (< 40) -> Grade F (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: aecTheoryRule,
                subject: { code: 'CC03_CC04', credits: 1 },
                scores: {
                    AEC_TEST: 60,            // 60/100 -> 20.4
                    AEC_QUIZ_ASSIGNMENT: 0,  // 0 (CIE = 20.4 >= 20)
                    AEC_SEE: 18              // 18 direct (SEE >= 18)
                    // Aggregate = 20.4 + 18 = 38.4 (< 40)
                },
                attendance: 86
            });

            assert.equal(result.calculated.cie, 20.4);
            assert.equal(result.calculated.see, 18);
            assert.equal(result.calculated.aggregate, 38.4);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, false); // Failed aggregate
            assert.equal(result.result.letterGrade, 'F');
            assert.equal(result.result.gradePoint, 0);
        });
    });

    describe('Pattern 3: NCMC Non-Credit', () => {
        test('CASE 8: NCMC completed even below 40 -> PP, SGPA excluded', async () => {
            const result = await calculateStudentEvaluation({
                rule: ncmcRule,
                subject: { code: 'CC09', credits: 0 },
                scores: {
                    NCMC_CIE: 25 // Low numeric mark (25/100), but completed!
                },
                attendance: 75
            });

            assert.equal(result.calculated.cie, 25);
            assert.equal(result.calculated.see, null);
            assert.equal(result.result.status, 'COMPLETED');
            assert.equal(result.result.letterGrade, 'PP');
            assert.equal(result.result.gradePoint, 0);
            assert.equal(result.sgpa.contributesToSGPA, false);
            assert.equal(result.sgpa.weightedGradePoints, 0);
        });

        test('CASE 9: NCMC incomplete / absent -> NP, Grade NP (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: ncmcRule,
                subject: { code: 'CC10', credits: 0 },
                scores: {
                    absent: true
                }
            });

            assert.equal(result.result.status, 'NOT_COMPLETED');
            assert.equal(result.result.letterGrade, 'NP');
            assert.equal(result.result.gradePoint, 0);
            assert.equal(result.sgpa.contributesToSGPA, false);
        });
    });

    describe('Pattern 4: Integrated IPCC', () => {
        test('CASE 10: IPCC high score -> Grade O (10 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: integratedIpccRule,
                subject: { code: 'PHYS', credits: 4 },
                scores: {
                    // Theory Partition (max 25)
                    IPCC_THEORY_TEST: 90,       // 90/100 -> 15.3
                    IPCC_THEORY_QUIZ: 38,       // 38/40  -> 3.8
                    IPCC_THEORY_ASSIGNMENT: 38, // 38/40  -> 3.8  => Theory CIE = 22.9
                    // Practical Partition (max 25)
                    IPCC_LAB_CONDUCTION: 330,   // 330/350 -> 14.14
                    IPCC_LAB_TEST: 14,          // 14/15   -> 9.33 => Practical CIE = 23.47
                    // SEE (max 50)
                    IPCC_SEE: 90                // 90/100  -> 45
                },
                attendance: 90
            });

            assert.equal(result.calculated.cie, 46.37);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 91.37);
            assert.equal(result.calculated.partitions.length, 2);
            assert.equal(result.calculated.partitions[0].passed, true);
            assert.equal(result.calculated.partitions[1].passed, true);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, true);
            assert.equal(result.result.letterGrade, 'O');
            assert.equal(result.result.gradePoint, 10);
            assert.equal(result.sgpa.weightedGradePoints, 40);
        });

        test('CASE 11: IPCC theory partition failure (< 10) -> Ineligible, Grade F', async () => {
            const result = await calculateStudentEvaluation({
                rule: integratedIpccRule,
                subject: { code: 'CHEM', credits: 4 },
                scores: {
                    // Theory Partition: 8 / 25 (< 10)
                    IPCC_THEORY_TEST: 30,       // 30/100 -> 5.1
                    IPCC_THEORY_QUIZ: 15,       // 15/40  -> 1.5
                    IPCC_THEORY_ASSIGNMENT: 14, // 14/40  -> 1.4 => Theory = 8.0
                    // Practical Partition: 22 / 25 (>= 10)
                    IPCC_LAB_CONDUCTION: 300,   // 12.86
                    IPCC_LAB_TEST: 14,          // 9.33 => Practical = 22.19
                    IPCC_SEE: 80
                },
                attendance: 88
            });

            // Overall CIE = 8.0 + 22.19 = 30.19 (>= 20), BUT theory partition failed!
            assert.equal(result.calculated.partitions[0].passed, false);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
        });

        test('CASE 12: IPCC practical partition failure (< 10) -> Ineligible, Grade F', async () => {
            const result = await calculateStudentEvaluation({
                rule: integratedIpccRule,
                subject: { code: 'APEE', credits: 4 },
                scores: {
                    // Theory Partition: 22 / 25 (>= 10)
                    IPCC_THEORY_TEST: 85,
                    IPCC_THEORY_QUIZ: 35,
                    IPCC_THEORY_ASSIGNMENT: 35,
                    // Practical Partition: < 10
                    IPCC_LAB_CONDUCTION: 100,   // 100/350 -> 4.29
                    IPCC_LAB_TEST: 5,           // 5/15    -> 3.33 => Practical = 7.62 (< 10)
                    IPCC_SEE: 80
                },
                attendance: 88
            });

            assert.equal(result.calculated.partitions[1].passed, false);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.status, 'NOT_ELIGIBLE');
            assert.equal(result.result.letterGrade, 'F');
        });
    });

    describe('Pattern 5: Standard Laboratory (Runtime N)', () => {
        test('CASE 13: Standard Lab N=10 sessions conducted -> Grade A+ (9 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardLabRule,
                subject: { code: 'ESC01', credits: 1 },
                scores: {
                    LAB_CONDUCTION: 315, // 315 / (10 * 35 = 350) * 35 = 31.5
                    LAB_TEST: 14,        // 14 direct
                    LAB_SEE: 44          // 44 direct
                },
                attendance: 90,
                runtimeContext: {
                    sessionsConducted: 10
                }
            });

            assert.equal(result.calculated.cie, 45.5);
            assert.equal(result.calculated.see, 44);
            assert.equal(result.calculated.aggregate, 89.5);
            assert.equal(result.result.letterGrade, 'A+');
            assert.equal(result.result.gradePoint, 9);
            assert.equal(result.sgpa.weightedGradePoints, 9);
        });

        test('CASE 14: Standard Lab N=9 sessions conducted -> Grade A+ (9 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardLabRule,
                subject: { code: 'ESC02', credits: 1 },
                scores: {
                    // Passing sessionsConducted directly inside conduction object
                    conduction: {
                        sessionsConducted: 9,
                        rawScore: 270 // 270 / (9 * 35 = 315) * 35 = 30
                    },
                    LAB_TEST: 13,     // 13 direct (CIE = 30 + 13 = 43)
                    LAB_SEE: 42       // 42 direct (Aggregate = 85)
                },
                attendance: 88
            });

            assert.equal(result.calculated.cie, 43);
            assert.equal(result.calculated.see, 42);
            assert.equal(result.calculated.aggregate, 85);
            assert.equal(result.result.letterGrade, 'A+');
            assert.equal(result.result.gradePoint, 9);
        });

        test('CASE 15: Standard Lab CIE failure (< 20) -> Ineligible, Grade F', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardLabRule,
                subject: { code: 'ESC03', credits: 1 },
                scores: {
                    conduction: { sessionsConducted: 10, rawScore: 100 }, // 100/350*35 = 10
                    LAB_TEST: 5,                                          // 5 (CIE = 15 < 20)
                    LAB_SEE: 40
                },
                attendance: 90
            });

            assert.equal(result.calculated.cie, 15);
            assert.equal(result.eligibility.eligible, false);
            assert.equal(result.result.letterGrade, 'F');
        });
    });

    describe('Pattern 6: Project-Based SDC', () => {
        test('CASE 16: SDC empty shell with direct CIE score -> Grade A+ (9 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: projectSdcRule,
                subject: { code: 'SDC1', credits: 1 },
                scores: {
                    CIE: 42,    // Direct CIE
                    SDC_SEE: 40 // 40 direct (Aggregate = 82)
                },
                attendance: 88
            });

            assert.equal(result.calculated.cie, 42);
            assert.equal(result.calculated.see, 40);
            assert.equal(result.calculated.aggregate, 82);
            assert.equal(result.result.letterGrade, 'A+');
            assert.equal(result.result.gradePoint, 9);
        });

        test('CASE 17: SDC dynamically configured rubrics -> Grade A+ (9 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: projectSdcRule,
                subject: { code: 'SDC2', credits: 1 },
                scores: {
                    rubrics: [
                        { name: 'Phase 1 Literature & Design', maxMarks: 15, score: 14 },
                        { name: 'Prototype Implementation', maxMarks: 20, score: 18 },
                        { name: 'Final Review & Viva', maxMarks: 15, score: 14 }
                    ],
                    SDC_SEE: 43 // (CIE = 46, SEE = 43, Aggregate = 89)
                },
                attendance: 95
            });

            assert.equal(result.calculated.cie, 46);
            assert.equal(result.calculated.see, 43);
            assert.equal(result.calculated.aggregate, 89);
            assert.equal(result.result.letterGrade, 'A+');
            assert.equal(result.result.gradePoint, 9);
        });
    });

    describe('Pattern 7: CAED Practical', () => {
        test('CASE 18: CAED passing -> Grade A+ (9 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: caedRule,
                subject: { code: 'CAED', credits: 3 },
                scores: {
                    CAED_CLASSWORK: 70, // 70/80  -> 17.5
                    CAED_EL: 18,        // 18/20  -> 9.0
                    CAED_TESTS: 85,     // 85/100 -> 17.0 (CIE = 43.5)
                    CAED_SEE: 45        // 45 direct (Aggregate = 88.5)
                },
                attendance: 90
            });

            assert.equal(result.calculated.cie, 43.5);
            assert.equal(result.calculated.see, 45);
            assert.equal(result.calculated.aggregate, 88.5);
            assert.equal(result.result.letterGrade, 'A+');
            assert.equal(result.result.gradePoint, 9);
            assert.equal(result.sgpa.weightedGradePoints, 27);
        });

        test('CASE 19: CAED aggregate failure (< 40) -> Grade F (0 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: caedRule,
                subject: { code: 'CAED', credits: 3 },
                scores: {
                    CAED_CLASSWORK: 30, // 30/80  -> 7.5
                    CAED_EL: 10,        // 10/20  -> 5.0
                    CAED_TESTS: 40,     // 40/100 -> 8.0 (CIE = 20.5 >= 20)
                    CAED_SEE: 18        // 18 direct (SEE >= 18)
                    // Aggregate = 20.5 + 18 = 38.5 (< 40)
                },
                attendance: 88
            });

            assert.equal(result.calculated.cie, 20.5);
            assert.equal(result.calculated.see, 18);
            assert.equal(result.calculated.aggregate, 38.5);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, false);
            assert.equal(result.result.letterGrade, 'F');
            assert.equal(result.result.gradePoint, 0);
        });

        test('CASE 20: CAED exact pass boundary -> Grade C (5 GP)', async () => {
            const result = await calculateStudentEvaluation({
                rule: caedRule,
                subject: { code: 'CAED', credits: 3 },
                scores: {
                    CAED_CLASSWORK: 32, // 32/80  -> 8
                    CAED_EL: 8,         // 8/20   -> 4
                    CAED_TESTS: 40,     // 40/100 -> 8 (CIE = 20)
                    CAED_SEE: 20        // 20 direct (Aggregate = 40)
                },
                attendance: 85
            });

            assert.equal(result.calculated.cie, 20);
            assert.equal(result.calculated.see, 20);
            assert.equal(result.calculated.aggregate, 40);
            assert.equal(result.eligibility.eligible, true);
            assert.equal(result.eligibility.passed, true);
            assert.equal(result.result.letterGrade, 'C');
            assert.equal(result.result.gradePoint, 5);
            assert.equal(result.sgpa.weightedGradePoints, 15);
        });
    });

    describe('Edge Cases & Defense Mechanisms', () => {
        test('CASE 21: Missing component score defaults to 0 and flags isMissing', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'MATH', credits: 4 },
                scores: {
                    THEORY_TEST: 80
                    // THEORY_QUIZ and THEORY_ASSIGNMENT omitted
                },
                attendance: 90
            });

            const quizComp = result.calculated.components.find(c => c.key === 'THEORY_QUIZ');
            assert.equal(quizComp.isMissing, true);
            assert.equal(quizComp.rawScore, 0);
            assert.equal(quizComp.convertedScore, 0);
        });

        test('CASE 22: Absent student gets 0 converted score and flags isAbsent', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'MATH', credits: 4 },
                scores: {
                    THEORY_TEST: 'ABSENT',
                    THEORY_QUIZ: { absent: true },
                    THEORY_ASSIGNMENT: 40
                },
                attendance: 90
            });

            const testComp = result.calculated.components.find(c => c.key === 'THEORY_TEST');
            const quizComp = result.calculated.components.find(c => c.key === 'THEORY_QUIZ');
            assert.equal(testComp.isAbsent, true);
            assert.equal(quizComp.isAbsent, true);
            assert.equal(testComp.convertedScore, 0);
            assert.equal(quizComp.convertedScore, 0);
        });

        test('CASE 23: Score above raw maximum is clamped safely with wasClamped flag', async () => {
            const result = await calculateStudentEvaluation({
                rule: standardTheoryRule,
                subject: { code: 'MATH', credits: 4 },
                scores: {
                    THEORY_TEST: 150, // > 100 max
                    THEORY_QUIZ: 40,
                    THEORY_ASSIGNMENT: 40,
                    THEORY_SEE: 100
                },
                attendance: 90
            });

            const testComp = result.calculated.components.find(c => c.key === 'THEORY_TEST');
            assert.equal(testComp.wasClamped, true);
            assert.equal(testComp.rawScore, 100);
            assert.equal(testComp.convertedScore, 34);
        });

        test('CASE 24: Standard Lab with N = 0 throws CalculationError', async () => {
            await assert.rejects(
                async () => {
                    await calculateStudentEvaluation({
                        rule: standardLabRule,
                        subject: { code: 'ESC01', credits: 1 },
                        scores: { conduction: { sessionsConducted: 0, rawScore: 0 } },
                        attendance: 90
                    });
                },
                {
                    name: 'CalculationError',
                    message: /sessionsConducted \(N\) must be greater than 0/
                }
            );
        });

        test('CASE 25: Standard Lab with missing N throws CalculationError', async () => {
            await assert.rejects(
                async () => {
                    await calculateStudentEvaluation({
                        rule: standardLabRule,
                        subject: { code: 'ESC01', credits: 1 },
                        scores: { LAB_CONDUCTION: 100 },
                        attendance: 90
                    });
                },
                {
                    name: 'CalculationError',
                    message: /Missing required runtime parameter: sessionsConducted \(N\)/
                }
            );
        });

        test('CASE 26: Floating point precision rounding is exact', () => {
            assert.equal(round(33.999999999999994, 2), 34);
            assert.equal(round(0.1 + 0.2, 2), 0.3);
            assert.equal(round(46.36666666, 2), 46.37);
        });
    });

    describe('EvaluationRuleResolver Error Classes', () => {
        test('CASE 27: Error classes inherit from Error with correct name and statusCode', () => {
            const ruleErr = new RuleNotFoundError('Rule missing');
            assert.equal(ruleErr.name, 'RuleNotFoundError');
            assert.equal(ruleErr.statusCode, 404);

            const dupErr = new DuplicateActiveRuleError('Duplicate rule');
            assert.equal(dupErr.name, 'DuplicateActiveRuleError');
            assert.equal(dupErr.statusCode, 409);

            const grpErr = new EvaluationGroupNotFoundError('Group missing');
            assert.equal(grpErr.name, 'EvaluationGroupNotFoundError');
            assert.equal(grpErr.statusCode, 404);

            const subErr = new EvaluationSubjectNotFoundError('Subject missing');
            assert.equal(subErr.name, 'EvaluationSubjectNotFoundError');
            assert.equal(subErr.statusCode, 404);
        });
    });
});
