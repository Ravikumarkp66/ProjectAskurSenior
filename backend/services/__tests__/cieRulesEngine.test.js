const test = require('node:test');
const assert = require('node:assert/strict');
const {
    determineEvaluationType,
    calculateSubjectCie
} = require('../cieRulesEngine');

test('CIE-UNIT-001: determineEvaluationType resolves correct course type', () => {
    // 1. Explicit override on registered subject
    assert.strictEqual(
        determineEvaluationType({ evaluationType: 'IPCC' }),
        'IPCC'
    );

    // 2. Theory + Lab category -> IPCC
    assert.strictEqual(
        determineEvaluationType({ category: 'Theory + Lab', registeredCredits: 4 }),
        'IPCC'
    );

    // 3. Lab Only category -> LAB_ONLY
    assert.strictEqual(
        determineEvaluationType({ category: 'Lab Only', registeredCredits: 1.5 }),
        'LAB_ONLY'
    );

    // 4. Low credit Theory (<= 2 credits) -> LOW_THEORY
    assert.strictEqual(
        determineEvaluationType({ category: 'Theory', registeredCredits: 2 }),
        'LOW_THEORY'
    );

    // 5. Standard Theory (3+ credits) -> THEORY_ONLY
    assert.strictEqual(
        determineEvaluationType({ category: 'Theory', registeredCredits: 3 }),
        'THEORY_ONLY'
    );

    // 6. Null / undefined fallback -> THEORY_ONLY
    assert.strictEqual(determineEvaluationType(null), 'THEORY_ONLY');
    assert.strictEqual(determineEvaluationType({}), 'THEORY_ONLY');
});

test('CIE-UNIT-002: calculateSubjectCie computes valid THEORY_ONLY passing marks', () => {
    const rawMarks = {
        test1: 45,
        test2: 45, // 90/100 -> 30.6
        quiz1: 15,
        quiz2: 15, // 30/40 -> 6.0
        assignment1: 15,
        assignment2: 15 // 30/40 -> 6.0
    };

    const result = calculateSubjectCie({
        registeredSubject: { category: 'Theory', registeredCredits: 3 },
        rawMarks
    });

    assert.strictEqual(result.evaluationType, 'THEORY_ONLY');
    assert.strictEqual(result.totalCie, 42.6);
    assert.strictEqual(result.isEligible, true);
    assert.strictEqual(result.status, 'ELIGIBLE');
    assert.strictEqual(result.failedRequirements.length, 0);
    assert.strictEqual(result.totalEnteredCount, 6);
    assert.strictEqual(result.totalPossibleSubcomponents, 6);
});

test('CIE-UNIT-003: calculateSubjectCie correctly scales IPCC theory to 25 and adds practical', () => {
    // Perfect marks in IPCC:
    // Theory: test1=50, test2=50 (34), quiz1=20, quiz2=20 (8), assign1=20, assign2=20 (8) -> 50 / 2 = 25
    // Practical: labRecord=350 (15), labTest=15 (10) -> 25
    // Total CIE = 25 + 25 = 50
    const rawMarks = {
        test1: 50,
        test2: 50,
        quiz1: 20,
        quiz2: 20,
        assignment1: 20,
        assignment2: 20,
        labRecord: 350,
        labTest: 15
    };

    const result = calculateSubjectCie({
        registeredSubject: { category: 'Theory + Lab', registeredCredits: 4 },
        rawMarks
    });

    assert.strictEqual(result.evaluationType, 'IPCC');
    assert.strictEqual(result.contributions.theoryTotal, 25);
    assert.strictEqual(result.contributions.practicalTotal, 25);
    assert.strictEqual(result.totalCie, 50);
    assert.strictEqual(result.isEligible, true);
    assert.strictEqual(result.status, 'ELIGIBLE');
});

test('CIE-UNIT-004: calculateSubjectCie flags failure when component minimum is not met', () => {
    // Tests raw sum is 39 < 40 minimum required
    const rawMarks = {
        test1: 20,
        test2: 19, // 39 < 40
        quiz1: 20,
        quiz2: 20,
        assignment1: 20,
        assignment2: 20
    };

    const result = calculateSubjectCie({
        registeredSubject: { category: 'Theory', registeredCredits: 3 },
        rawMarks
    });

    assert.strictEqual(result.isEligible, false);
    assert.strictEqual(result.status, 'NOT_ELIGIBLE');
    assert.strictEqual(result.failedRequirements.length, 1);
    assert.match(result.failedRequirements[0], /Tests requirement not satisfied/);
});

test('CIE-UNIT-005: calculateSubjectCie returns NOT_STARTED status for empty marks without crashing', () => {
    const result = calculateSubjectCie({
        registeredSubject: { category: 'Theory', registeredCredits: 3 },
        rawMarks: {}
    });

    assert.strictEqual(result.totalCie, 0);
    assert.strictEqual(result.isEligible, false);
    assert.strictEqual(result.status, 'NOT_STARTED');
    assert.strictEqual(result.totalEnteredCount, 0);
    assert.strictEqual(result.failedRequirements.length, 0);
});

test('CIE-UNIT-006: calculateSubjectCie handles NCMC 100% CIE evaluation without SEE', () => {
    const sub = { customName: 'Environmental Studies (NCMC)', registeredCredits: 0 };
    assert.strictEqual(determineEvaluationType(sub), 'NCMC');

    const passingMarks = { assessment1: 40, assessment2: 38 }; // 78 / 100
    const passingResult = calculateSubjectCie({
        registeredSubject: sub,
        rawMarks: passingMarks
    });

    assert.strictEqual(passingResult.maxCie, 100);
    assert.strictEqual(passingResult.totalCie, 78);
    assert.strictEqual(passingResult.isEligible, true);
    assert.strictEqual(passingResult.status, 'ELIGIBLE');
    assert.strictEqual(passingResult.evalConfig.hasSee, false);

    const failingMarks = { assessment1: 15, assessment2: 20 }; // 35 < 40
    const failingResult = calculateSubjectCie({
        registeredSubject: sub,
        rawMarks: failingMarks
    });

    assert.strictEqual(failingResult.totalCie, 35);
    assert.strictEqual(failingResult.isEligible, false);
    assert.strictEqual(failingResult.status, 'NOT_ELIGIBLE');
});

