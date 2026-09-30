/**
 * SGPA Rules Engine Comprehensive Unit & Scalability Test Suite
 * Validates Scheme 2025 Autonomous rules, NCMC continuous evaluation,
 * floating-point precision, eligibility gates, and high-throughput scalability.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const sgpaRulesEngine = require('../services/sgpaRulesEngine');

test('sgpaRulesEngine: Floating-Point Precision & Rounding', async (t) => {
    await t.test('round function rounds half-up with EPSILON safety', () => {
        // Standard JS 8.725.toFixed(2) produces "8.72", but round() yields 8.73
        assert.strictEqual(sgpaRulesEngine.round(8.725, 2), 8.73);
        assert.strictEqual(sgpaRulesEngine.round(1.005, 2), 1.01);
        assert.strictEqual(sgpaRulesEngine.round(0, 2), 0);
        assert.strictEqual(sgpaRulesEngine.round(null, 2), 0);
        assert.strictEqual(sgpaRulesEngine.round(undefined, 2), 0);
    });

    await t.test('grading scale has zero intervals gaps', () => {
        const rules = sgpaRulesEngine.SIT_SGPA_RULES;
        assert.deepStrictEqual(rules.getGradeForTotalMarks(100), { grade: 'O', gradePoint: 10 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(90), { grade: 'O', gradePoint: 10 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(89.994), { grade: 'A+', gradePoint: 9 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(80), { grade: 'A+', gradePoint: 9 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(79.99), { grade: 'A', gradePoint: 8 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(70), { grade: 'A', gradePoint: 8 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(60), { grade: 'B+', gradePoint: 7 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(50), { grade: 'B', gradePoint: 6 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(40), { grade: 'C', gradePoint: 5 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(39.99), { grade: 'F', gradePoint: 0 });
        assert.deepStrictEqual(rules.getGradeForTotalMarks(0), { grade: 'F', gradePoint: 0 });
    });
});

test('sgpaRulesEngine: Subject Evaluation - Standard Theory', async (t) => {
    const regSub = {
        _id: 'sub-mat-101',
        registeredCredits: 4,
        customCode: 'MAT101',
        customName: 'Mathematics I',
        category: 'Theory'
    };

    await t.test('calculates correct scaled SEE, total marks, and grade O', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 45, isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: 92,
            seeRawMaximum: 100
        });

        assert.strictEqual(res.credits, 4);
        assert.strictEqual(res.cieMarks, 45);
        assert.strictEqual(res.seeRawMarks, 92);
        assert.strictEqual(res.seeScaledMarks, 46);
        assert.strictEqual(res.totalMarks, 91);
        assert.strictEqual(res.grade, 'O');
        assert.strictEqual(res.gradePoint, 10);
        assert.strictEqual(res.creditPoints, 40);
        assert.strictEqual(res.status, 'COMPLETED');
    });

    await t.test('calculates correct scaled SEE when raw maximum is 50', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 38, isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: 40,
            seeRawMaximum: 50
        });

        assert.strictEqual(res.seeScaledMarks, 40); // 40/50 * 50 = 40
        assert.strictEqual(res.totalMarks, 78);
        assert.strictEqual(res.grade, 'A');
        assert.strictEqual(res.gradePoint, 8);
        assert.strictEqual(res.creditPoints, 32);
    });

    await t.test('enforces SEE minimum raw threshold for 100 max (fail if < 36)', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 45, isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: 35, // Below 36 threshold
            seeRawMaximum: 100
        });

        assert.strictEqual(res.grade, 'F');
        assert.strictEqual(res.gradePoint, 0);
        assert.strictEqual(res.creditPoints, 0);
        assert.strictEqual(res.status, 'FAILED');
        assert.match(res.failureReason, /SEE requirement not satisfied/);
    });

    await t.test('enforces SEE minimum raw threshold for 50 max (fail if < 18)', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 40, isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: 17, // Below 18 threshold
            seeRawMaximum: 50
        });

        assert.strictEqual(res.grade, 'F');
        assert.strictEqual(res.gradePoint, 0);
        assert.strictEqual(res.status, 'FAILED');
    });

    await t.test('enforces CIE minimum threshold and eligibility override (grade NE)', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 18, isEligible: false, status: 'NOT_ELIGIBLE' },
            seeRawMarks: 80,
            seeRawMaximum: 100
        });

        assert.strictEqual(res.grade, 'NE');
        assert.strictEqual(res.gradePoint, 0);
        assert.strictEqual(res.creditPoints, 0);
        assert.strictEqual(res.status, 'NE');
    });

    await t.test('returns PENDING when SEE marks are not entered yet', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 42, isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: null,
            seeRawMaximum: 100
        });

        assert.strictEqual(res.grade, 'PENDING');
        assert.strictEqual(res.status, 'PENDING');
    });
});

test('sgpaRulesEngine: NCMC (Non-Credit Mandatory Course) Special Handling', async (t) => {
    const ncmcSub = {
        _id: 'sub-cc10-ncmc',
        registeredCredits: 0,
        customCode: 'CC10',
        customName: 'Constitution of India',
        category: 'NCMC'
    };

    await t.test('passes NCMC with PP grade and 0 credits when CIE >= 40 (no SEE required)', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: ncmcSub,
            cieData: { totalCie: 82, isEligible: true, status: 'COMPLETED' },
            seeRawMarks: null // No SEE for NCMC
        });

        assert.strictEqual(res.isNcmc, true);
        assert.strictEqual(res.credits, 0);
        assert.strictEqual(res.cieMarks, 82);
        assert.strictEqual(res.cieMax, 100);
        assert.strictEqual(res.grade, 'PP');
        assert.strictEqual(res.gradePoint, 0);
        assert.strictEqual(res.creditPoints, 0);
        assert.strictEqual(res.status, 'COMPLETED');
    });

    await t.test('fails NCMC with NP grade when CIE < 40', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: ncmcSub,
            cieData: { totalCie: 35, isEligible: false, status: 'FAILED' },
            seeRawMarks: null
        });

        assert.strictEqual(res.isNcmc, true);
        assert.strictEqual(res.grade, 'NP');
        assert.strictEqual(res.status, 'FAILED');
        assert.match(res.failureReason, /NCMC continuous evaluation below passing requirement/);
    });

    await t.test('marks NCMC as PENDING when CIE is not yet entered', () => {
        const res = sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: ncmcSub,
            cieData: null,
            seeRawMarks: null
        });

        assert.strictEqual(res.isNcmc, true);
        assert.strictEqual(res.grade, 'PENDING');
        assert.strictEqual(res.status, 'PENDING');
    });
});

test('sgpaRulesEngine: Semester SGPA Aggregation', async (t) => {
    await t.test('calculates standard Scheme 2025 Semester 1 with NCMC (SGPA = 8.73)', () => {
        const subjects = [
            // Math: 4 credits, Grade O (10 GP) -> 40 CP
            { credits: 4, grade: 'O', gradePoint: 10, status: 'COMPLETED', seeRawMarks: 90, cieMarks: 45 },
            // Physics: 4 credits, Grade A+ (9 GP) -> 36 CP
            { credits: 4, grade: 'A+', gradePoint: 9, status: 'COMPLETED', seeRawMarks: 85, cieMarks: 42 },
            // EE: 3 credits, Grade A (8 GP) -> 24 CP
            { credits: 3, grade: 'A', gradePoint: 8, status: 'COMPLETED', seeRawMarks: 75, cieMarks: 38 },
            // ME: 3 credits, Grade B+ (7 GP) -> 21 CP
            { credits: 3, grade: 'B+', gradePoint: 7, status: 'COMPLETED', seeRawMarks: 65, cieMarks: 35 },
            // Lab: 1.5 credits, Grade O (10 GP) -> 15 CP
            { credits: 1.5, grade: 'O', gradePoint: 10, status: 'COMPLETED', seeRawMarks: 48, cieMarks: 48 },
            // Workshop: 1.5 credits, Grade A+ (9 GP) -> 13.5 CP
            { credits: 1.5, grade: 'A+', gradePoint: 9, status: 'COMPLETED', seeRawMarks: 42, cieMarks: 44 },
            // English: 2 credits, Grade A (8 GP) -> 16 CP
            { credits: 2, grade: 'A', gradePoint: 8, status: 'COMPLETED', seeRawMarks: 72, cieMarks: 36 },
            // NCMC: 0 credits, Grade PP (0 GP) -> 0 CP
            { credits: 0, isNcmc: true, grade: 'PP', gradePoint: 0, status: 'COMPLETED', seeRawMarks: null, cieMarks: 82 }
        ];

        // Total credits = 4 + 4 + 3 + 3 + 1.5 + 1.5 + 2 = 19 credits
        // Total credit points = 40 + 36 + 24 + 21 + 15 + 13.5 + 16 = 165.5 CP
        // SGPA = 165.5 / 19 = 8.7105... -> 8.71
        const res = sgpaRulesEngine.calculateSemesterSgpa(subjects);

        assert.strictEqual(res.totalCredits, 19);
        assert.strictEqual(res.totalCreditPoints, 165.5);
        assert.strictEqual(res.sgpa, 8.71);
        assert.strictEqual(res.hasPending, false);
        assert.strictEqual(res.completedCount, 8);
        assert.strictEqual(res.status, 'COMPLETED');
    });

    await t.test('detects pending subjects and marks status as PARTIAL', () => {
        const subjects = [
            { credits: 4, grade: 'O', gradePoint: 10, status: 'COMPLETED', seeRawMarks: 90, cieMarks: 45 },
            { credits: 4, grade: 'PENDING', gradePoint: 0, status: 'PENDING', seeRawMarks: null, cieMarks: 42 }
        ];

        const res = sgpaRulesEngine.calculateSemesterSgpa(subjects);
        assert.strictEqual(res.hasPending, true);
        assert.strictEqual(res.status, 'PARTIAL');
        assert.strictEqual(res.completedCount, 1);
    });

    await t.test('correctly factors failed subject (F: 0 GP) into SGPA denominator', () => {
        const subjects = [
            { credits: 4, grade: 'O', gradePoint: 10, status: 'COMPLETED', seeRawMarks: 90, cieMarks: 45 }, // 40 CP
            { credits: 4, grade: 'F', gradePoint: 0, status: 'FAILED', seeRawMarks: 25, cieMarks: 20 }      // 0 CP
        ];

        // Total credits = 8, Total CP = 40, SGPA = 40 / 8 = 5.00
        const res = sgpaRulesEngine.calculateSemesterSgpa(subjects);
        assert.strictEqual(res.totalCredits, 8);
        assert.strictEqual(res.totalCreditPoints, 40);
        assert.strictEqual(res.sgpa, 5.0);
        assert.strictEqual(res.hasPending, false);
        assert.strictEqual(res.status, 'FAILED_SUBJECTS');
    });
});

test('sgpaRulesEngine: Scalability & Performance Benchmark', () => {
    const regSub = {
        _id: 'sub-benchmark',
        registeredCredits: 4,
        customCode: 'BENCH101',
        customName: 'Benchmark Subject',
        category: 'Theory'
    };

    const startTime = performance.now();
    const ITERATIONS = 10000;

    for (let i = 0; i < ITERATIONS; i++) {
        sgpaRulesEngine.calculateSubjectSgpaResult({
            registeredSubject: regSub,
            cieData: { totalCie: 35 + (i % 15), isEligible: true, status: 'ELIGIBLE' },
            seeRawMarks: 50 + (i % 50),
            seeRawMaximum: 100
        });
    }

    const duration = performance.now() - startTime;
    // 10,000 evaluations should complete comfortably under 100ms
    assert.ok(duration < 100, `Execution took ${duration.toFixed(2)}ms, exceeding 100ms threshold`);
});
