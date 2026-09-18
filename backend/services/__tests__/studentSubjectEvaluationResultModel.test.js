/**
 * StudentSubjectEvaluationResult Model & Schema Test Suite (F-10 Step 1)
 * 
 * Verifies the data model architecture for evaluated student subject results:
 * - 7 evaluation pattern result shapes (Standard Theory, AEC, NCMC, IPCC, Standard Lab, SDC, CAED)
 * - Support for dynamic administrator-defined components without hardcoded fields
 * - Preservation of rule version lineage
 * - Clear distinction between missing marks (null) and zero marks (0)
 * - NCMC representation without SEE and excluded from SGPA
 * - Schema validation, default values, and index definitions
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const StudentSubjectEvaluationResult = require('../../models/StudentSubjectEvaluationResult');

// Reusable mock ObjectIds
const mockStudentId = new mongoose.Types.ObjectId();
const mockSubjectId = new mongoose.Types.ObjectId();
const mockRegisteredSubjectId = new mongoose.Types.ObjectId();
const mockSchemeId = new mongoose.Types.ObjectId();
const mockGroupId = new mongoose.Types.ObjectId();
const mockRuleId = new mongoose.Types.ObjectId();

describe('F-10 Step 1: StudentSubjectEvaluationResult Model Architecture', () => {

    // -------------------------------------------------------------
    // 1. Pattern 1: Standard Theory
    // -------------------------------------------------------------
    test('Pattern 1: Standard Theory evaluated result shape validates successfully', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            registeredSubject: mockRegisteredSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'Standard Theory',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Standard Theory Evaluation Rule',
            pattern: 'Standard Theory',
            cie: {
                enabled: true,
                total: 46,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'THEORY_TEST',
                        name: 'Internal Assessment Tests',
                        type: 'ASSESSMENT',
                        rawScore: 90,
                        rawMax: 100,
                        convertedScore: 30.6,
                        targetMax: 34,
                        source: 'StudentCieRecord'
                    },
                    {
                        key: 'THEORY_QUIZ',
                        name: 'Quizzes / Higher Order Tests',
                        type: 'ASSESSMENT',
                        rawScore: 38,
                        rawMax: 40,
                        convertedScore: 7.6,
                        targetMax: 8,
                        source: 'StudentCieRecord'
                    },
                    {
                        key: 'THEORY_ASSIGNMENT',
                        name: 'Assignments / ABL',
                        type: 'ASSESSMENT',
                        rawScore: 39,
                        rawMax: 40,
                        convertedScore: 7.8,
                        targetMax: 8,
                        source: 'StudentCieRecord'
                    }
                ]
            },
            see: {
                enabled: true,
                total: 45,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'THEORY_SEE',
                        name: 'Semester End Theory Examination',
                        type: 'THEORY_EXAM',
                        rawScore: 90,
                        rawMax: 100,
                        convertedScore: 45,
                        targetMax: 50,
                        source: 'StudentSemesterResult'
                    }
                ]
            },
            aggregate: {
                total: 91,
                maxMarks: 100,
                percentage: 91
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: [],
                conditionResults: [
                    { type: 'CIE_MIN', required: 20, actual: 46, met: true, description: 'CIE >= 20/50' },
                    { type: 'SEE_MIN', required: 18, actual: 45, met: true, description: 'SEE >= 18/50' },
                    { type: 'ATTENDANCE_MIN', required: 85, actual: 92, met: true, description: 'Attendance >= 85%' },
                    { type: 'AGGREGATE_MIN', required: 40, actual: 91, met: true, description: 'Aggregate >= 40/100' }
                ]
            },
            result: {
                status: 'PASS',
                letterGrade: 'O',
                gradePoint: 10
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 3,
                gradePoint: 10,
                weightedGradePoints: 30
            },
            attendance: {
                percentage: 92,
                attended: 46,
                total: 50
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'Pattern 1 should validate cleanly without errors');
        assert.equal(doc.cie.components.length, 3);
        assert.equal(doc.see.components.length, 1);
        assert.equal(doc.result.letterGrade, 'O');
        assert.equal(doc.sgpa.contributesToSGPA, true);
    });

    // -------------------------------------------------------------
    // 2. Pattern 2: AEC Theory (Tests 34 + Quiz/Assignment 16)
    // -------------------------------------------------------------
    test('Pattern 2: AEC Theory evaluated result shape validates successfully', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'AEC Theory',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'AEC Theory Evaluation Rule',
            pattern: 'AEC Theory',
            cie: {
                enabled: true,
                total: 40,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'AEC_TEST',
                        name: 'Tests',
                        type: 'ASSESSMENT',
                        rawScore: 80,
                        rawMax: 100,
                        convertedScore: 27.2,
                        targetMax: 34
                    },
                    {
                        key: 'AEC_QUIZ_ASSIGNMENT',
                        name: 'Quiz & Continuous Assessments',
                        type: 'ASSESSMENT',
                        rawScore: 16,
                        rawMax: 20,
                        convertedScore: 12.8,
                        targetMax: 16
                    }
                ]
            },
            see: {
                enabled: true,
                total: 35,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'AEC_SEE',
                        name: 'AEC Theory / MCQ Exam',
                        type: 'THEORY_EXAM',
                        rawScore: 35,
                        rawMax: 50,
                        convertedScore: 35,
                        targetMax: 50
                    }
                ]
            },
            aggregate: {
                total: 75,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'PASS',
                letterGrade: 'A',
                gradePoint: 8
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 1,
                gradePoint: 8,
                weightedGradePoints: 8
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'Pattern 2 should validate cleanly');
        assert.equal(doc.cie.components.length, 2);
        assert.equal(doc.see.components[0].targetMax, 50);
    });

    // -------------------------------------------------------------
    // 3. Pattern 3: NCMC Non-Credit (0 Credits, No SEE, PP/NP)
    // -------------------------------------------------------------
    test('Pattern 3: NCMC Non-Credit validates without SEE, 0 credits, and SGPA false', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'NCMC Non-Credit',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'NCMC Non-Credit Evaluation Rule',
            pattern: 'NCMC Non-Credit',
            cie: {
                enabled: true,
                total: 35, // Student scored 35/100, but completed activities
                maxMarks: 100,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'NCMC_CIE',
                        name: 'Continuous Internal Evaluation',
                        type: 'ASSESSMENT',
                        rawScore: 35,
                        rawMax: 100,
                        convertedScore: 35,
                        targetMax: 100
                    }
                ]
            },
            see: {
                enabled: false,
                total: null,
                maxMarks: 0,
                status: 'NOT_APPLICABLE',
                components: []
            },
            aggregate: {
                total: 35,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'COMPLETED',
                letterGrade: 'PP',
                gradePoint: 0
            },
            sgpa: {
                contributesToSGPA: false,
                credits: 0,
                gradePoint: 0,
                weightedGradePoints: 0
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'NCMC should validate cleanly');
        assert.equal(doc.see.enabled, false);
        assert.equal(doc.see.total, null);
        assert.equal(doc.see.maxMarks, 0);
        assert.equal(doc.result.letterGrade, 'PP');
        assert.equal(doc.sgpa.contributesToSGPA, false);
        assert.equal(doc.sgpa.credits, 0);
        assert.equal(doc.sgpa.weightedGradePoints, 0);
    });

    // -------------------------------------------------------------
    // 4. Pattern 4: Integrated IPCC (Two Partitions: Theory + Practical)
    // -------------------------------------------------------------
    test('Pattern 4: Integrated IPCC validates with Theory and Practical partitions', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'Integrated IPCC',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Integrated IPCC Evaluation Rule',
            pattern: 'Integrated IPCC',
            cie: {
                enabled: true,
                total: 45,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'IPCC_THEORY_TEST',
                        name: 'Theory Tests',
                        type: 'ASSESSMENT',
                        partition: 'THEORY',
                        rawScore: 90,
                        rawMax: 100,
                        convertedScore: 15.3,
                        targetMax: 17
                    },
                    {
                        key: 'IPCC_THEORY_QUIZ',
                        name: 'Theory Quizzes',
                        type: 'ASSESSMENT',
                        partition: 'THEORY',
                        rawScore: 35,
                        rawMax: 40,
                        convertedScore: 3.5,
                        targetMax: 4
                    },
                    {
                        key: 'IPCC_THEORY_ASSIGNMENT',
                        name: 'Theory Assignments / ABL',
                        type: 'ASSESSMENT',
                        partition: 'THEORY',
                        rawScore: 38,
                        rawMax: 40,
                        convertedScore: 3.8,
                        targetMax: 4
                    },
                    {
                        key: 'IPCC_LAB_CONDUCTION',
                        name: 'Lab Conduction & Continuous Assessment',
                        type: 'LAB_RECORD',
                        partition: 'PRACTICAL',
                        rawScore: 315,
                        rawMax: 350,
                        convertedScore: 13.5,
                        targetMax: 15
                    },
                    {
                        key: 'IPCC_LAB_TEST',
                        name: 'Lab Internal Test',
                        type: 'LAB_TEST',
                        partition: 'PRACTICAL',
                        rawScore: 14,
                        rawMax: 15,
                        convertedScore: 9.33,
                        targetMax: 10
                    }
                ]
            },
            partitions: [
                {
                    partition: 'THEORY',
                    total: 22.6,
                    maxMarks: 25,
                    minRequired: 10,
                    passed: true
                },
                {
                    partition: 'PRACTICAL',
                    total: 22.83,
                    maxMarks: 25,
                    minRequired: 10,
                    passed: true
                }
            ],
            see: {
                enabled: true,
                total: 42,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'IPCC_SEE',
                        name: 'Semester End Examination',
                        type: 'THEORY_EXAM',
                        rawScore: 84,
                        rawMax: 100,
                        convertedScore: 42,
                        targetMax: 50
                    }
                ]
            },
            aggregate: {
                total: 87.43,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'PASS',
                letterGrade: 'A+',
                gradePoint: 9
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 4,
                gradePoint: 9,
                weightedGradePoints: 36
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'IPCC should validate cleanly');
        assert.equal(doc.partitions.length, 2);
        assert.equal(doc.partitions[0].partition, 'THEORY');
        assert.equal(doc.partitions[1].partition, 'PRACTICAL');
        assert.equal(doc.cie.components.filter(c => c.partition === 'THEORY').length, 3);
        assert.equal(doc.cie.components.filter(c => c.partition === 'PRACTICAL').length, 2);
    });

    // -------------------------------------------------------------
    // 5. Pattern 5: Standard Laboratory (Runtime N metadata)
    // -------------------------------------------------------------
    test('Pattern 5: Standard Laboratory captures runtime N in component metadata', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'Standard Laboratory',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Standard Laboratory Evaluation Rule',
            pattern: 'Standard Laboratory',
            cie: {
                enabled: true,
                total: 48,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'LAB_CONDUCTION',
                        name: 'Conduction and Continuous Evaluation',
                        type: 'LAB_RECORD',
                        rawScore: 295,
                        rawMax: 315, // N=9 conducted sessions * 35 = 315
                        convertedScore: 32.78,
                        targetMax: 35,
                        metadata: {
                            sessionsConducted: 9,
                            marksPerSession: 35
                        }
                    },
                    {
                        key: 'LAB_TEST_VIVA',
                        name: 'Lab Test and Viva Voce',
                        type: 'LAB_TEST',
                        rawScore: 14.5,
                        rawMax: 15,
                        convertedScore: 14.5,
                        targetMax: 15
                    }
                ]
            },
            see: {
                enabled: true,
                total: 45,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'LAB_SEE',
                        name: 'Practical / Lab SEE Exam',
                        type: 'PRACTICAL_EXAM',
                        rawScore: 45,
                        rawMax: 50,
                        convertedScore: 45,
                        targetMax: 50
                    }
                ]
            },
            aggregate: {
                total: 92.78,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'PASS',
                letterGrade: 'O',
                gradePoint: 10
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 1.5,
                gradePoint: 10,
                weightedGradePoints: 15
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'Standard Lab should validate cleanly');
        assert.equal(doc.cie.components[0].metadata.sessionsConducted, 9);
        assert.equal(doc.cie.components[0].rawMax, 315);
    });

    // -------------------------------------------------------------
    // 6. Pattern 6: Project-Based SDC (Dynamic Administrator Rubrics)
    // -------------------------------------------------------------
    test('Pattern 6: Project-Based SDC supports dynamic administrator components without hardcoding', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 2,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'Project-Based SDC',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Project-Based SDC Evaluation Rule',
            pattern: 'Project-Based SDC',
            cie: {
                enabled: true,
                total: 45,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    // Dynamic administrator-defined components
                    {
                        key: 'PHASE_1_SYNOPSIS',
                        name: 'Phase 1: Project Synopsis & Literature Review',
                        type: 'PROJECT',
                        rawScore: 10,
                        rawMax: 10,
                        convertedScore: 10,
                        targetMax: 10,
                        source: 'AdminRubric'
                    },
                    {
                        key: 'PHASE_2_PROTOTYPE',
                        name: 'Phase 2: System Architecture & Prototype Demo',
                        type: 'PROJECT',
                        rawScore: 18,
                        rawMax: 20,
                        convertedScore: 18,
                        targetMax: 20,
                        source: 'AdminRubric'
                    },
                    {
                        key: 'MIDTERM_PRESENTATION',
                        name: 'Mid-term Progress Presentation',
                        type: 'ASSESSMENT',
                        rawScore: 9,
                        rawMax: 10,
                        convertedScore: 9,
                        targetMax: 10,
                        source: 'AdminRubric'
                    },
                    {
                        key: 'REPORT_DOCUMENTATION',
                        name: 'Technical Report & Codebase Review',
                        type: 'PROJECT',
                        rawScore: 8,
                        rawMax: 10,
                        convertedScore: 8,
                        targetMax: 10,
                        source: 'AdminRubric'
                    }
                ]
            },
            see: {
                enabled: true,
                total: 48,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'FINAL_PROJECT_DEFENSE',
                        name: 'Final Project Demo & External Viva',
                        type: 'PROJECT',
                        rawScore: 48,
                        rawMax: 50,
                        convertedScore: 48,
                        targetMax: 50
                    }
                ]
            },
            aggregate: {
                total: 93,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'PASS',
                letterGrade: 'O',
                gradePoint: 10
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 2,
                gradePoint: 10,
                weightedGradePoints: 20
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'Project-based SDC should validate cleanly with dynamic keys');
        assert.equal(doc.cie.components.length, 4);
        assert.equal(doc.cie.components[0].key, 'PHASE_1_SYNOPSIS');
        assert.equal(doc.cie.components[1].key, 'PHASE_2_PROTOTYPE');
    });

    // -------------------------------------------------------------
    // 7. Pattern 7: CAED Practical
    // -------------------------------------------------------------
    test('Pattern 7: CAED Practical validates rule-configured components', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationGroupName: 'CAED Practical',
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'CAED Practical Evaluation Rule',
            pattern: 'CAED Practical',
            cie: {
                enabled: true,
                total: 42,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'CAED_CLASSWORK',
                        name: 'Classwork Drawing & Sketchbook',
                        type: 'ASSESSMENT',
                        rawScore: 68,
                        rawMax: 80,
                        convertedScore: 17,
                        targetMax: 20
                    },
                    {
                        key: 'CAED_EL',
                        name: 'Experiential Learning',
                        type: 'ASSESSMENT',
                        rawScore: 18,
                        rawMax: 20,
                        convertedScore: 9,
                        targetMax: 10
                    },
                    {
                        key: 'CAED_TESTS',
                        name: 'CAD & Manual Tests',
                        type: 'ASSESSMENT',
                        rawScore: 80,
                        rawMax: 100,
                        convertedScore: 16,
                        targetMax: 20
                    }
                ]
            },
            see: {
                enabled: true,
                total: 40,
                maxMarks: 50,
                status: 'ENTERED',
                components: [
                    {
                        key: 'CAED_SEE',
                        name: 'Computer Aided Drawing Examination',
                        type: 'PRACTICAL_EXAM',
                        rawScore: 40,
                        rawMax: 50,
                        convertedScore: 40,
                        targetMax: 50
                    }
                ]
            },
            aggregate: {
                total: 82,
                maxMarks: 100
            },
            eligibility: {
                eligible: true,
                passed: true,
                failedConditions: []
            },
            result: {
                status: 'PASS',
                letterGrade: 'A+',
                gradePoint: 9
            },
            sgpa: {
                contributesToSGPA: true,
                credits: 3,
                gradePoint: 9,
                weightedGradePoints: 27
            }
        });

        const validationError = doc.validateSync();
        assert.equal(validationError, undefined, 'CAED should validate cleanly');
        assert.equal(doc.cie.components.length, 3);
        assert.equal(doc.cie.components[0].key, 'CAED_CLASSWORK');
    });

    // -------------------------------------------------------------
    // 8. Missing Marks vs Zero Marks Distinction
    // -------------------------------------------------------------
    test('Distinguishes explicitly between missing marks (null) and scored zero (0)', () => {
        const docWithZero = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Test Rule',
            cie: {
                total: 0,
                maxMarks: 50,
                status: 'COMPLETE',
                components: [
                    {
                        key: 'TEST_1',
                        name: 'Internal Assessment',
                        type: 'ASSESSMENT',
                        rawScore: 0, // Scored zero
                        rawMax: 50,
                        convertedScore: 0,
                        targetMax: 50,
                        isMissing: false,
                        isAbsent: false
                    }
                ]
            }
        });

        const docWithMissing = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Test Rule',
            cie: {
                total: null,
                maxMarks: 50,
                status: 'INCOMPLETE',
                components: [
                    {
                        key: 'TEST_1',
                        name: 'Internal Assessment',
                        type: 'ASSESSMENT',
                        rawScore: null, // Marks not yet entered
                        rawMax: 50,
                        convertedScore: null,
                        targetMax: 50,
                        isMissing: true,
                        isAbsent: false
                    }
                ]
            }
        });

        assert.equal(docWithZero.validateSync(), undefined);
        assert.equal(docWithMissing.validateSync(), undefined);

        assert.strictEqual(docWithZero.cie.components[0].rawScore, 0);
        assert.strictEqual(docWithZero.cie.components[0].isMissing, false);

        assert.strictEqual(docWithMissing.cie.components[0].rawScore, null);
        assert.strictEqual(docWithMissing.cie.components[0].convertedScore, null);
        assert.strictEqual(docWithMissing.cie.components[0].isMissing, true);
    });

    // -------------------------------------------------------------
    // 9. Version Lineage Preservation
    // -------------------------------------------------------------
    test('Preserves exact evaluation rule reference, version number, and rule name', () => {
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationRule: mockRuleId,
            ruleVersion: 2, // Explicit version 2
            ruleName: 'Standard Theory Evaluation Rule v2',
            pattern: 'Standard Theory'
        });

        assert.equal(doc.ruleVersion, 2);
        assert.equal(doc.ruleName, 'Standard Theory Evaluation Rule v2');
        assert.equal(doc.evaluationRule.toString(), mockRuleId.toString());
    });

    // -------------------------------------------------------------
    // 10. Recalculation & Stale State Tracking
    // -------------------------------------------------------------
    test('Tracks stale status, reason, inputs hash, and calculatedAt timestamp', () => {
        const now = new Date();
        const doc = new StudentSubjectEvaluationResult({
            student: mockStudentId,
            subject: mockSubjectId,
            semester: 1,
            scheme: mockSchemeId,
            evaluationGroup: mockGroupId,
            evaluationRule: mockRuleId,
            ruleVersion: 1,
            ruleName: 'Standard Theory Rule',
            isStale: true,
            staleReason: 'Raw CIE marks updated in StudentCieRecord',
            calculatedAt: now,
            inputsHash: 'a1b2c3d4e5'
        });

        assert.equal(doc.isStale, true);
        assert.equal(doc.staleReason, 'Raw CIE marks updated in StudentCieRecord');
        assert.equal(doc.calculatedAt, now);
        assert.equal(doc.inputsHash, 'a1b2c3d4e5');
    });

    // -------------------------------------------------------------
    // 11. Schema Validation Rejections
    // -------------------------------------------------------------
    test('Rejects document if required identity or rule version fields are missing', () => {
        const invalidDoc = new StudentSubjectEvaluationResult({});
        const error = invalidDoc.validateSync();

        assert.ok(error, 'Expected validation error for empty document');
        assert.ok(error.errors.student, 'Student is required');
        assert.ok(error.errors.subject, 'Subject is required');
        assert.ok(error.errors.semester, 'Semester is required');
        assert.ok(error.errors.scheme, 'Scheme is required');
        assert.ok(error.errors.evaluationGroup, 'EvaluationGroup is required');
        assert.ok(error.errors.evaluationRule, 'EvaluationRule is required');
        assert.ok(error.errors.ruleName, 'RuleName is required');
    });

    // -------------------------------------------------------------
    // 12. Model Indexes Verification
    // -------------------------------------------------------------
    test('Defines compound unique index on student + subject + semester', () => {
        const indexes = StudentSubjectEvaluationResult.schema.indexes();
        
        // Find compound unique index
        const compoundUniqueIndex = indexes.find(([spec, options]) => 
            spec.student === 1 && spec.subject === 1 && spec.semester === 1 && options?.unique === true
        );
        assert.ok(compoundUniqueIndex, 'Expected compound unique index on { student: 1, subject: 1, semester: 1 }');

        // Find lookup indexes
        const studentSemIndex = indexes.find(([spec]) => spec.student === 1 && spec.semester === 1 && !spec.subject);
        assert.ok(studentSemIndex, 'Expected index on { student: 1, semester: 1 }');

        const ruleVersionIndex = indexes.find(([spec]) => spec.evaluationRule === 1 && spec.ruleVersion === 1);
        assert.ok(ruleVersionIndex, 'Expected index on { evaluationRule: 1, ruleVersion: 1 }');

        const groupIndex = indexes.find(([spec]) => spec.evaluationGroup === 1 && !spec.evaluationRule);
        assert.ok(groupIndex, 'Expected index on { evaluationGroup: 1 }');

        const staleIndex = indexes.find(([spec]) => spec.isStale === 1);
        assert.ok(staleIndex, 'Expected index on { isStale: 1 }');
    });
});
