/**
 * Academic Evaluation Context Service (F-09)
 * 
 * Thin adapter layer connecting existing AskUrSenior academic data sources:
 * - StudentAccount (Identity, Scheme, Semester, Section)
 * - StudentRegisteredSubject / SectionTimetable (Enrolled Subject)
 * - AcademicSubject (Curriculum definition)
 * - StudentCieRecord / Overrides (Student Marks)
 * - StudentSubjectAttendance / attendanceEngine (Attendance & Lab Conduction N)
 * - EvaluationRuleResolver (Authoritative Active AcademicEvaluationRule)
 * 
 * To the F-08 EvaluationCalculationEngine.
 * Contains NO grading formulas or calculation logic. Purely normalizes data.
 */

const mongoose = require('mongoose');
const StudentAccount = require('../models/StudentAccount');
const AcademicSubject = require('../models/AcademicSubject');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentCieRecord = require('../models/StudentCieRecord');
const StudentSemesterResult = require('../models/StudentSemesterResult');
const StudentSubjectAttendance = require('../models/StudentSubjectAttendance');
const StudentComponentMark = require('../models/StudentComponentMark');

const { resolveActiveEvaluationRule } = require('./evaluationRuleResolver');
const { calculateStudentEvaluation } = require('./evaluationCalculationEngine');

class EvaluationContextError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'EvaluationContextError';
        this.statusCode = statusCode;
    }
}

/**
 * Normalizes student component marks to align with the active rule's components.
 * Accepts existing StudentCieRecord rawMarks, explicit score overrides, and SEE scores.
 */
function normalizeScoresForComponents(activeRule, rawMarksInput = {}, seeScore = null, runtimeOptions = {}) {
    const normalized = {};

    // 1. Process CIE Components from Rule
    const cieComponents = activeRule.cie?.components || [];

    for (const comp of cieComponents) {
        const key = comp.key;

        // A. Direct key match in rawMarksInput
        if (rawMarksInput[key] !== undefined) {
            normalized[key] = rawMarksInput[key];
            continue;
        }

        // B. Dynamic alias & legacy model mapping
        switch (key) {
            // Standard Theory
            case 'THEORY_TEST':
                if (rawMarksInput.test1 !== undefined || rawMarksInput.test2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.test1) || 0) + (Number(rawMarksInput.test2) || 0);
                } else if (rawMarksInput.tests !== undefined) {
                    normalized[key] = rawMarksInput.tests;
                }
                break;
            case 'THEORY_QUIZ':
                if (rawMarksInput.quiz1 !== undefined || rawMarksInput.quiz2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.quiz1) || 0) + (Number(rawMarksInput.quiz2) || 0);
                } else if (rawMarksInput.quizzes !== undefined) {
                    normalized[key] = rawMarksInput.quizzes;
                }
                break;
            case 'THEORY_ASSIGNMENT':
                if (rawMarksInput.assignment1 !== undefined || rawMarksInput.assignment2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.assignment1) || 0) + (Number(rawMarksInput.assignment2) || 0);
                } else if (rawMarksInput.assignments !== undefined) {
                    normalized[key] = rawMarksInput.assignments;
                }
                break;

            // AEC Theory
            case 'AEC_TEST':
                if (rawMarksInput.test1 !== undefined || rawMarksInput.test2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.test1) || 0) + (Number(rawMarksInput.test2) || 0);
                } else if (rawMarksInput.tests !== undefined) {
                    normalized[key] = rawMarksInput.tests;
                }
                break;
            case 'AEC_QUIZ_ASSIGNMENT':
                if (rawMarksInput.quiz1 !== undefined || rawMarksInput.assignment1 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.quiz1) || 0) + (Number(rawMarksInput.assignment1) || 0);
                } else if (rawMarksInput.continuousAssessment !== undefined) {
                    normalized[key] = rawMarksInput.continuousAssessment;
                }
                break;

            // Integrated IPCC
            case 'IPCC_THEORY_TEST':
                if (rawMarksInput.test1 !== undefined || rawMarksInput.test2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.test1) || 0) + (Number(rawMarksInput.test2) || 0);
                } else if (rawMarksInput.tests !== undefined) {
                    normalized[key] = rawMarksInput.tests;
                }
                break;
            case 'IPCC_THEORY_QUIZ':
                if (rawMarksInput.quiz1 !== undefined || rawMarksInput.quiz2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.quiz1) || 0) + (Number(rawMarksInput.quiz2) || 0);
                } else if (rawMarksInput.quizzes !== undefined) {
                    normalized[key] = rawMarksInput.quizzes;
                }
                break;
            case 'IPCC_THEORY_ASSIGNMENT':
                if (rawMarksInput.assignment1 !== undefined || rawMarksInput.assignment2 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.assignment1) || 0) + (Number(rawMarksInput.assignment2) || 0);
                } else if (rawMarksInput.assignments !== undefined) {
                    normalized[key] = rawMarksInput.assignments;
                }
                break;
            case 'IPCC_LAB_CONDUCTION':
                if (rawMarksInput.labRecord !== undefined) {
                    normalized[key] = rawMarksInput.labRecord;
                } else if (rawMarksInput.conduction !== undefined) {
                    normalized[key] = rawMarksInput.conduction;
                }
                break;
            case 'IPCC_LAB_TEST':
                if (rawMarksInput.labTest !== undefined) {
                    normalized[key] = rawMarksInput.labTest;
                }
                break;

            // Standard Laboratory (Runtime N)
            case 'LAB_CONDUCTION':
                if (rawMarksInput.conduction !== undefined) {
                    normalized[key] = rawMarksInput.conduction;
                } else if (rawMarksInput.labRecord !== undefined) {
                    // When labRecord is provided, pair with runtime sessionsConducted
                    normalized[key] = {
                        rawScore: Number(rawMarksInput.labRecord) || 0,
                        sessionsConducted: runtimeOptions.sessionsConducted
                    };
                }
                break;
            case 'LAB_TEST':
                if (rawMarksInput.labTest !== undefined) {
                    normalized[key] = rawMarksInput.labTest;
                }
                break;

            // NCMC Non-Credit
            case 'NCMC_CIE':
                if (rawMarksInput.cie !== undefined) {
                    normalized[key] = rawMarksInput.cie;
                } else if (rawMarksInput.test1 !== undefined) {
                    normalized[key] = (Number(rawMarksInput.test1) || 0) + (Number(rawMarksInput.test2) || 0);
                } else if (rawMarksInput.total !== undefined) {
                    normalized[key] = rawMarksInput.total;
                }
                break;

            // CAED Practical
            case 'CAED_CLASSWORK':
                if (rawMarksInput.classwork !== undefined) normalized[key] = rawMarksInput.classwork;
                else if (rawMarksInput.sketchbook !== undefined) normalized[key] = rawMarksInput.sketchbook;
                break;
            case 'CAED_EL':
                if (rawMarksInput.el !== undefined) normalized[key] = rawMarksInput.el;
                else if (rawMarksInput.experientialLearning !== undefined) normalized[key] = rawMarksInput.experientialLearning;
                break;
            case 'CAED_TESTS':
                if (rawMarksInput.tests !== undefined) normalized[key] = rawMarksInput.tests;
                else if (rawMarksInput.cadTests !== undefined) normalized[key] = rawMarksInput.cadTests;
                break;

            default:
                // If any generic component key matches case-insensitively
                for (const [k, v] of Object.entries(rawMarksInput)) {
                    if (k.toLowerCase() === key.toLowerCase()) {
                        normalized[key] = v;
                        break;
                    }
                }
                break;
        }
    }

    // Special handling for Project-Based SDC where cie.components is an empty shell
    if (cieComponents.length === 0) {
        if (rawMarksInput.CIE !== undefined) normalized.CIE = rawMarksInput.CIE;
        else if (rawMarksInput.cie !== undefined) normalized.cie = rawMarksInput.cie;
        else if (rawMarksInput.rubrics) normalized.rubrics = rawMarksInput.rubrics;
        else if (rawMarksInput.labRecord !== undefined) normalized.CIE = rawMarksInput.labRecord;
    }

    // 2. Process SEE Component
    if (activeRule.see?.enabled) {
        const seeComps = activeRule.see.components || [];
        const seeKey = seeComps[0]?.key || 'SEE';

        if (seeScore !== null && seeScore !== undefined) {
            normalized[seeKey] = seeScore;
        } else if (rawMarksInput[seeKey] !== undefined) {
            normalized[seeKey] = rawMarksInput[seeKey];
        } else if (rawMarksInput.SEE !== undefined) {
            normalized[seeKey] = rawMarksInput.SEE;
        } else if (rawMarksInput.see !== undefined) {
            normalized[seeKey] = rawMarksInput.see;
        }
    }

    // 3. NCMC completion flags
    if (rawMarksInput.completed !== undefined) normalized.completed = rawMarksInput.completed;
    if (rawMarksInput.isCompleted !== undefined) normalized.isCompleted = rawMarksInput.isCompleted;
    if (rawMarksInput.absent !== undefined) normalized.absent = rawMarksInput.absent;

    return normalized;
}

/**
 * Builds the normalized evaluation context for a student and subject.
 * 
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} [options.studentId]
 * @param {Object} [options.student]
 * @param {string|mongoose.Types.ObjectId} [options.subjectId]
 * @param {string} [options.subjectCode]
 * @param {string|mongoose.Types.ObjectId} [options.registeredSubjectId]
 * @param {number} [options.semester]
 * @param {Object} [options.rawMarksOverride]
 * @param {number} [options.seeScoreOverride]
 * @param {number} [options.sessionsConductedOverride]
 * @param {Object|number} [options.attendanceOverride]
 * @param {boolean} [options.isNcmcCompletedOverride]
 * @returns {Promise<{ normalizedInput: Object, metadata: Object }>}
 */
async function buildStudentEvaluationContext(options = {}) {
    // 1. Resolve Student
    let student = options.student;
    if (!student && options.studentId) {
        student = await StudentAccount.findById(options.studentId).lean();
    }
    if (!student) {
        throw new EvaluationContextError('Student record or valid studentId is required');
    }

    const effectiveSemester = options.semester ? Number(options.semester) : (student.semester || 1);

    // 2. Resolve Subject and RegisteredSubject
    let registeredSubject = null;
    let subject = null;

    if (options.registeredSubjectId) {
        registeredSubject = await StudentRegisteredSubject.findById(options.registeredSubjectId)
            .populate('subject')
            .lean();
        if (registeredSubject && registeredSubject.subject) {
            subject = registeredSubject.subject;
        }
    }

    if (!subject) {
        const query = {};
        if (options.subjectId) query._id = options.subjectId;
        else if (options.subjectCode) query.code = options.subjectCode.trim().toUpperCase();

        if (student.scheme) query.scheme = student.scheme;

        subject = await AcademicSubject.findOne(query).lean();
    }

    if (!subject) {
        throw new EvaluationContextError(`Academic subject not found for query: ${JSON.stringify(options)}`);
    }

    if (!registeredSubject) {
        registeredSubject = await StudentRegisteredSubject.findOne({
            student: student._id,
            subject: subject._id,
            $or: [{ semester: effectiveSemester }, { semester: { $exists: false } }]
        }).lean();
    }

    // 3. Resolve Authoritative Active Evaluation Rule (F-07 / F-08 Resolver)
    const ruleResolution = await resolveActiveEvaluationRule({
        schemeId: student.scheme || subject.scheme,
        subjectId: subject._id
    });
    const activeRule = ruleResolution.rule;
    const evaluationGroup = ruleResolution.group;

    // 4. Collect Attendance Data
    let attendancePercentage = null;
    let attendedClasses = null;
    let conductedClasses = null;
    let runtimeLabSessions = options.sessionsConductedOverride !== undefined ? options.sessionsConductedOverride : null;

    if (options.attendanceOverride !== undefined && options.attendanceOverride !== null) {
        if (typeof options.attendanceOverride === 'number') {
            attendancePercentage = options.attendanceOverride;
            attendedClasses = options.attendanceOverride;
            conductedClasses = 100;
        } else if (typeof options.attendanceOverride === 'object') {
            attendancePercentage = options.attendanceOverride.percentage !== undefined && options.attendanceOverride.percentage !== null
                ? Number(options.attendanceOverride.percentage)
                : (options.attendanceOverride.total > 0 ? (options.attendanceOverride.attended / options.attendanceOverride.total) * 100 : null);
            attendedClasses = options.attendanceOverride.attended !== undefined ? options.attendanceOverride.attended : null;
            conductedClasses = options.attendanceOverride.total !== undefined ? options.attendanceOverride.total : null;
            if (options.attendanceOverride.sessionsConducted !== undefined) {
                runtimeLabSessions = options.attendanceOverride.sessionsConducted;
            }
        }
    } else {
        const attDoc = await StudentSubjectAttendance.findOne({
            student: student._id,
            subject: subject._id
        }).lean();

        if (attDoc && attDoc.analytics) {
            conductedClasses = attDoc.analytics.conducted || 0;
            attendedClasses = attDoc.analytics.present || 0;
            if (conductedClasses > 0) {
                attendancePercentage = (attendedClasses / conductedClasses) * 100;
            } else {
                attendancePercentage = 0;
            }
            if (runtimeLabSessions === null && conductedClasses > 0) {
                runtimeLabSessions = conductedClasses;
            }
        }
    }

    // 5. Collect Marks from StudentComponentMark / StudentCieRecord / StudentSemesterResult
    let rawMarks = options.rawMarksOverride ? { ...options.rawMarksOverride } : null;
    let seeScore = options.seeScoreOverride !== undefined ? options.seeScoreOverride : null;

    if (!rawMarks) {
        rawMarks = {};

        // A. Query legacy StudentCieRecord if present
        const query = {
            student: student._id,
            subject: subject._id,
            semester: effectiveSemester
        };
        if (registeredSubject) {
            query.registeredSubject = registeredSubject._id;
        }

        const cieDoc = await StudentCieRecord.findOne(query).lean();
        if (cieDoc && cieDoc.rawMarks) {
            Object.assign(rawMarks, cieDoc.rawMarks);
        }

        // B. Query dynamic StudentComponentMark (takes precedence for specific component keys)
        const compMarks = await StudentComponentMark.find({
            student: student._id,
            subject: subject._id,
            semester: effectiveSemester
        }).lean();

        if (compMarks && compMarks.length > 0) {
            for (const cm of compMarks) {
                if (cm.isAbsent) {
                    rawMarks[cm.componentKey] = 'ABSENT';
                } else if (cm.rawScore !== null && cm.rawScore !== undefined) {
                    rawMarks[cm.componentKey] = cm.rawScore;
                }
                if (cm.metadata && cm.metadata.sessionsConducted && !runtimeLabSessions) {
                    runtimeLabSessions = cm.metadata.sessionsConducted;
                }
            }
        }
    }

    if (seeScore === null && activeRule.see?.enabled) {
        const semResult = await StudentSemesterResult.findOne({
            student: student._id,
            semester: effectiveSemester
        }).lean();

        if (semResult && Array.isArray(semResult.subjects)) {
            const subjRes = semResult.subjects.find(s => 
                (s.subject && s.subject.toString() === subject._id.toString()) ||
                (registeredSubject && s.registeredSubject && s.registeredSubject.toString() === registeredSubject._id.toString())
            );
            if (subjRes && subjRes.seeRawMarks !== undefined && subjRes.seeRawMarks !== null) {
                seeScore = subjRes.seeRawMarks;
            }
        }
    }

    // 6. Normalize Scores for F-08 Input Contract
    const runtimeOptions = {
        sessionsConducted: runtimeLabSessions
    };
    const normalizedScores = normalizeScoresForComponents(activeRule, rawMarks, seeScore, runtimeOptions);

    // 7. Construct Normalized F-08 Input Object
    const normalizedInput = {
        rule: activeRule,
        student: {
            _id: student._id,
            studentId: student.studentId,
            name: student.name,
            usn: student.usn,
            semester: effectiveSemester,
            section: student.section
        },
        subject: {
            _id: subject._id,
            code: subject.code,
            name: subject.name,
            credits: subject.credits !== undefined ? subject.credits : (registeredSubject?.registeredCredits || 0)
        },
        scores: normalizedScores,
        attendance: {
            percentage: attendancePercentage !== null ? Math.round(attendancePercentage * 100) / 100 : null,
            attended: attendedClasses,
            total: conductedClasses,
            isMissing: attendancePercentage === null
        },
        runtimeContext: {
            sessionsConducted: runtimeLabSessions !== null ? runtimeLabSessions : undefined,
            isNcmcCompleted: options.isNcmcCompletedOverride !== undefined 
                ? options.isNcmcCompletedOverride 
                : (normalizedScores.completed !== false && !normalizedScores.absent)
        }
    };

    const metadata = {
        evaluationGroupName: evaluationGroup.name,
        evaluationGroupId: evaluationGroup._id,
        ruleId: activeRule._id,
        ruleName: activeRule.name,
        ruleVersion: activeRule.version || 1,
        registeredSubjectId: registeredSubject?._id || null
    };

    return {
        normalizedInput,
        metadata
    };
}

/**
 * End-to-end service function: Evaluates a student's subject evaluation using the F-08 engine.
 *
 * @param {Object} options - Options passed to buildStudentEvaluationContext
 * @returns {Promise<Object>} F-08 evaluation result enriched with context metadata
 */
async function evaluateStudentSubject(options = {}) {
    const { normalizedInput, metadata } = await buildStudentEvaluationContext(options);
    const evaluation = await calculateStudentEvaluation(normalizedInput);

    return {
        ...evaluation,
        metadata: {
            ...metadata,
            calculatedAt: new Date()
        }
    };
}

module.exports = {
    buildStudentEvaluationContext,
    evaluateStudentSubject,
    normalizeScoresForComponents,
    EvaluationContextError
};
