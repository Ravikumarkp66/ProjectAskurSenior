const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeScoresForComponents,
    EvaluationContextError
} = require('../academicEvaluationContextService');

// Mock rule fixtures
const standardTheoryRule = {
    _id: 'rule_std_theory',
    name: 'Standard Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'THEORY_TEST', name: 'Tests' },
            { key: 'THEORY_QUIZ', name: 'Quizzes' },
            { key: 'THEORY_ASSIGNMENT', name: 'Assignments / ABL' }
        ]
    },
    see: {
        enabled: true,
        components: [{ key: 'THEORY_SEE', name: 'Theory Exam' }]
    }
};

const aecTheoryRule = {
    _id: 'rule_aec_theory',
    name: 'AEC Theory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'AEC_TEST', name: 'Tests' },
            { key: 'AEC_QUIZ_ASSIGNMENT', name: 'Quiz / Assignment' }
        ]
    },
    see: {
        enabled: true,
        components: [{ key: 'AEC_SEE', name: 'Theory / MCQ Exam' }]
    }
};

const ncmcRule = {
    _id: 'rule_ncmc',
    name: 'NCMC Non-Credit Evaluation Rule',
    contributesToSGPA: false,
    cie: {
        enabled: true,
        components: [{ key: 'NCMC_CIE', name: 'Continuous Evaluation' }]
    },
    see: { enabled: false, components: [] }
};

const ipccRule = {
    _id: 'rule_ipcc',
    name: 'Integrated IPCC Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'IPCC_THEORY_TEST', name: 'Theory Tests' },
            { key: 'IPCC_THEORY_QUIZ', name: 'Theory Quizzes' },
            { key: 'IPCC_THEORY_ASSIGNMENT', name: 'Theory Assignments' },
            { key: 'IPCC_LAB_CONDUCTION', name: 'Lab Conduction' },
            { key: 'IPCC_LAB_TEST', name: 'Lab Test' }
        ]
    },
    see: {
        enabled: true,
        components: [{ key: 'IPCC_SEE', name: 'Integrated Exam' }]
    }
};

const standardLabRule = {
    _id: 'rule_std_lab',
    name: 'Standard Laboratory Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'LAB_CONDUCTION', name: 'Continuous Conduction' },
            { key: 'LAB_TEST', name: 'Lab Internal Test' }
        ]
    },
    see: {
        enabled: true,
        components: [{ key: 'LAB_SEE', name: 'Practical Exam' }]
    }
};

const sdcRule = {
    _id: 'rule_sdc',
    name: 'Project-Based SDC Evaluation Rule',
    contributesToSGPA: true,
    cie: { enabled: true, components: [] },
    see: {
        enabled: true,
        components: [{ key: 'SDC_SEE', name: 'Project Demo' }]
    }
};

const caedRule = {
    _id: 'rule_caed',
    name: 'CAED Practical Evaluation Rule',
    contributesToSGPA: true,
    cie: {
        enabled: true,
        components: [
            { key: 'CAED_CLASSWORK', name: 'Classwork' },
            { key: 'CAED_EL', name: 'EL' },
            { key: 'CAED_TESTS', name: 'CAD Tests' }
        ]
    },
    see: {
        enabled: true,
        components: [{ key: 'CAED_SEE', name: 'CAD Exam' }]
    }
};

describe('F-09: Academic Evaluation Context Service', () => {

    describe('Score Normalization & Legacy Model Adaptation', () => {
        test('CASE 1: Standard Theory maps legacy test1/test2, quiz1/quiz2, assignment1/assignment2', () => {
            const legacyMarks = {
                test1: 45, test2: 45,
                quiz1: 18, quiz2: 18,
                assignment1: 19, assignment2: 19
            };
            const normalized = normalizeScoresForComponents(standardTheoryRule, legacyMarks, 88);

            assert.equal(normalized.THEORY_TEST, 90);
            assert.equal(normalized.THEORY_QUIZ, 36);
            assert.equal(normalized.THEORY_ASSIGNMENT, 38);
            assert.equal(normalized.THEORY_SEE, 88);
        });

        test('CASE 2: AEC Theory maps test1+test2 and quiz1+assignment1', () => {
            const legacyMarks = {
                test1: 42, test2: 48,
                quiz1: 9, assignment1: 9
            };
            const normalized = normalizeScoresForComponents(aecTheoryRule, legacyMarks, 45);

            assert.equal(normalized.AEC_TEST, 90);
            assert.equal(normalized.AEC_QUIZ_ASSIGNMENT, 18);
            assert.equal(normalized.AEC_SEE, 45);
        });

        test('CASE 3: NCMC maps continuous assessment and completion flag with NO SEE', () => {
            const raw = {
                cie: 35,
                completed: true
            };
            const normalized = normalizeScoresForComponents(ncmcRule, raw, 50); // SEE passed in, but rule has SEE disabled

            assert.equal(normalized.NCMC_CIE, 35);
            assert.equal(normalized.completed, true);
            assert.equal(normalized.SEE, undefined); // SEE is disabled in rule, not attached
        });

        test('CASE 4: Integrated IPCC maps theory tests, quizzes, assignments and practical labRecord, labTest', () => {
            const legacyMarks = {
                test1: 40, test2: 45,
                quiz1: 17, quiz2: 18,
                assignment1: 18, assignment2: 17,
                labRecord: 310,
                labTest: 13
            };
            const normalized = normalizeScoresForComponents(ipccRule, legacyMarks, 85);

            assert.equal(normalized.IPCC_THEORY_TEST, 85);
            assert.equal(normalized.IPCC_THEORY_QUIZ, 35);
            assert.equal(normalized.IPCC_THEORY_ASSIGNMENT, 35);
            assert.equal(normalized.IPCC_LAB_CONDUCTION, 310);
            assert.equal(normalized.IPCC_LAB_TEST, 13);
            assert.equal(normalized.IPCC_SEE, 85);
        });

        test('CASE 5: Standard Laboratory pairs labRecord with runtime sessionsConducted (N)', () => {
            const legacyMarks = {
                labRecord: 270,
                labTest: 14
            };
            const runtimeOptions = { sessionsConducted: 9 };
            const normalized = normalizeScoresForComponents(standardLabRule, legacyMarks, 44, runtimeOptions);

            assert.deepEqual(normalized.LAB_CONDUCTION, { rawScore: 270, sessionsConducted: 9 });
            assert.equal(normalized.LAB_TEST, 14);
            assert.equal(normalized.LAB_SEE, 44);
        });

        test('CASE 6: Project-Based SDC handles direct CIE and dynamic rubrics', () => {
            const directInput = { CIE: 44, SDC_SEE: 45 };
            const normDirect = normalizeScoresForComponents(sdcRule, directInput);
            assert.equal(normDirect.CIE, 44);
            assert.equal(normDirect.SDC_SEE, 45);

            const rubricInput = {
                rubrics: [{ name: 'Phase 1', score: 18 }, { name: 'Phase 2', score: 25 }],
                see: 40
            };
            const normRubric = normalizeScoresForComponents(sdcRule, rubricInput);
            assert.equal(normRubric.rubrics.length, 2);
            assert.equal(normRubric.SDC_SEE, 40);
        });

        test('CASE 7: CAED Practical maps classwork, experiential learning, and CAD tests', () => {
            const caedMarks = {
                classwork: 72,
                el: 18,
                tests: 88,
                see: 46
            };
            const normalized = normalizeScoresForComponents(caedRule, caedMarks);

            assert.equal(normalized.CAED_CLASSWORK, 72);
            assert.equal(normalized.CAED_EL, 18);
            assert.equal(normalized.CAED_TESTS, 88);
            assert.equal(normalized.CAED_SEE, 46);
        });
    });

    describe('EvaluationContextError Class', () => {
        test('CASE 8: EvaluationContextError properties', () => {
            const err = new EvaluationContextError('Subject not found', 404);
            assert.equal(err.name, 'EvaluationContextError');
            assert.equal(err.statusCode, 404);
            assert.equal(err.message, 'Subject not found');
        });
    });
});
