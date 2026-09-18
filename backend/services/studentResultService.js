/**
 * Student Result Flow Service (F-10)
 * 
 * Implements the production-ready Student Result Flow for AskUrSenior:
 * 
 * Flow:
 * Student
 *  ↓
 * Registered Subject
 *  ↓
 * Academic Subject
 *  ↓
 * Scheme
 *  ↓
 * Evaluation Group
 *  ↓
 * Active Evaluation Rule
 *  ↓
 * Required Evaluation Components
 *  ↓
 * Resolve component marks (Dynamic StudentEvaluationComponentRecord + Legacy fallback)
 *  ↓
 * Resolve SEE (StudentSemesterResult)
 *  ↓
 * Resolve attendance (StudentSubjectAttendance / Timetable N)
 *  ↓
 * Build F-08 calculation input
 *  ↓
 * Run existing evaluationCalculationEngine (Single calculation authority)
 *  ↓
 * Return canonical calculated subject result
 * 
 * IMPORTANT:
 * - Does NOT calculate SGPA or CGPA (reserved strictly for F-11).
 * - Separates CALCULATE from PUBLISH / SAVE.
 * - Missing data is explicitly distinguished (MISSING, NOT_ENTERED, ZERO, ABSENT, NOT_APPLICABLE).
 */

const mongoose = require('mongoose');
const StudentAccount = require('../models/StudentAccount');
const AcademicSubject = require('../models/AcademicSubject');
const Scheme = require('../models/Scheme');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const AcademicEvaluationGroup = require('../models/AcademicEvaluationGroup');
const AcademicEvaluationRule = require('../models/AcademicEvaluationRule');
const StudentCieRecord = require('../models/StudentCieRecord');
const StudentSemesterResult = require('../models/StudentSemesterResult');
const StudentSubjectAttendance = require('../models/StudentSubjectAttendance');
const StudentEvaluationComponentRecord = require('../models/StudentEvaluationComponentRecord');
const StudentSubjectEvaluationResult = require('../models/StudentSubjectEvaluationResult');

const { resolveActiveEvaluationRule } = require('./evaluationRuleResolver');
const { calculateStudentEvaluation, round } = require('./evaluationCalculationEngine');

class StudentResultError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.name = 'StudentResultError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Builds the complete evaluation context and resolves all component marks, SEE, and attendance.
 * Never mutates or overwrites source records.
 */
async function buildComponentResolutionContext(options = {}) {
    const {
        student: studentInput,
        subject: subjectInput,
        registeredSubject: registeredSubjectInput,
        subjectCode,
        semester: semesterInput,
        overrides = {},
        prefetchedData = null
    } = options;

    // 1. Resolve Student
    let student = null;
    if (studentInput && typeof studentInput === 'object' && studentInput._id) {
        student = studentInput;
    } else if (studentInput) {
        student = await StudentAccount.findById(studentInput).lean();
    }
    if (!student) {
        throw new StudentResultError('Student not found or invalid student ID', 404);
    }

    const effectiveSemester = semesterInput || student.academicProfile?.currentSemester || 1;
    const studentSchemeId = student.academicProfile?.scheme;

    // 2. Resolve Academic Subject & Registered Subject
    let subject = null;
    let registeredSubject = null;

    if (registeredSubjectInput) {
        registeredSubject = typeof registeredSubjectInput === 'object' && registeredSubjectInput._id
            ? registeredSubjectInput
            : await StudentRegisteredSubject.findById(registeredSubjectInput).populate('subject').lean();
        if (registeredSubject?.subject) {
            subject = registeredSubject.subject;
        }
    }

    if (!subject) {
        if (subjectInput && typeof subjectInput === 'object' && subjectInput._id) {
            subject = subjectInput;
        } else if (subjectInput) {
            subject = await AcademicSubject.findById(subjectInput).lean();
        } else if (subjectCode) {
            subject = await AcademicSubject.findOne({ code: subjectCode }).lean();
        }
    }

    if (!subject) {
        throw new StudentResultError(`Academic Subject not found: ${subjectCode || subjectInput || 'unspecified'}`, 404);
    }

    if (!registeredSubject) {
        registeredSubject = await StudentRegisteredSubject.findOne({
            student: student._id,
            subject: subject._id,
            $or: [{ semester: effectiveSemester }, { semester: { $exists: false } }]
        }).lean();
    }

    // 3. Resolve Scheme and Active Evaluation Rule (Rule-driven)
    const effectiveSchemeId = subject.scheme || studentSchemeId;
    if (!effectiveSchemeId) {
        throw new StudentResultError(`No academic scheme associated with student ${student.usn} or subject ${subject.code}`);
    }

    const { rule: activeRule, group: evaluationGroup } = await resolveActiveEvaluationRule({
        scheme: effectiveSchemeId,
        subjectId: subject._id,
        subject
    });

    // 4. Resolve Dynamic Component Records (New Flexible Storage)
    let dynamicComponentDocs;
    if (prefetchedData && prefetchedData.dynamicDocs !== undefined) {
        dynamicComponentDocs = prefetchedData.dynamicDocs;
    } else {
        dynamicComponentDocs = await StudentEvaluationComponentRecord.find({
            student: student._id,
            subject: subject._id,
            semester: effectiveSemester
        }).lean();
    }

    const dynamicMarksMap = new Map();
    for (const d of dynamicComponentDocs) {
        dynamicMarksMap.set(d.componentKey, d);
    }

    // 5. Resolve Legacy CIE Source (StudentCieRecord)
    let legacyCieRecord = null;
    if (prefetchedData && prefetchedData.cieRecord !== undefined) {
        legacyCieRecord = prefetchedData.cieRecord;
    } else {
        if (registeredSubject) {
            legacyCieRecord = await StudentCieRecord.findOne({
                student: student._id,
                registeredSubject: registeredSubject._id,
                semester: effectiveSemester
            }).lean();
        }
        if (!legacyCieRecord) {
            legacyCieRecord = await StudentCieRecord.findOne({
                student: student._id,
                subject: subject._id,
                semester: effectiveSemester
            }).lean();
        }
    }

    const legacyRawMarks = legacyCieRecord?.rawMarks || {};

    // 6. Resolve Attendance and Runtime Lab Sessions N
    let attendancePercentage = null;
    let attendedClasses = null;
    let conductedClasses = null;
    let runtimeLabSessions = overrides.sessionsConducted !== undefined ? overrides.sessionsConducted : null;

    if (overrides.attendance !== undefined && overrides.attendance !== null) {
        if (typeof overrides.attendance === 'number') {
            attendancePercentage = overrides.attendance;
            attendedClasses = overrides.attendance;
            conductedClasses = 100;
        } else if (typeof overrides.attendance === 'object') {
            attendancePercentage = overrides.attendance.percentage !== undefined ? Number(overrides.attendance.percentage) : null;
            attendedClasses = overrides.attendance.attended !== undefined ? overrides.attendance.attended : null;
            conductedClasses = overrides.attendance.total !== undefined ? overrides.attendance.total : null;
            if (overrides.attendance.sessionsConducted !== undefined) {
                runtimeLabSessions = overrides.attendance.sessionsConducted;
            }
        }
    } else {
        let attDoc = null;
        if (prefetchedData && prefetchedData.attendanceDoc !== undefined) {
            attDoc = prefetchedData.attendanceDoc;
        } else {
            attDoc = await StudentSubjectAttendance.findOne({
                student: student._id,
                subject: subject._id
            }).lean();
        }

        if (attDoc && attDoc.analytics) {
            conductedClasses = attDoc.analytics.conducted || 0;
            attendedClasses = attDoc.analytics.present || 0;
            if (conductedClasses > 0) {
                attendancePercentage = Math.round(((attendedClasses / conductedClasses) * 100) * 100) / 100;
            } else {
                attendancePercentage = 0;
            }
            if (runtimeLabSessions === null && conductedClasses > 0) {
                runtimeLabSessions = conductedClasses;
            }
        }
    }

    // Default runtime lab sessions to 10 if unassigned for lab-conduction subjects
    if (runtimeLabSessions === null && activeRule?.cie?.components?.some(c => c.key === 'LAB_CONDUCTION')) {
        runtimeLabSessions = 10;
    }

    // 7. Resolve SEE from StudentSemesterResult (ignored for NCMC)
    let seeScore = overrides.seeScore !== undefined ? overrides.seeScore : null;

    if (seeScore === null && activeRule.see?.enabled) {
        let semResult = null;
        if (prefetchedData && prefetchedData.semResult !== undefined) {
            semResult = prefetchedData.semResult;
        } else {
            semResult = await StudentSemesterResult.findOne({
                student: student._id,
                semester: effectiveSemester
            }).lean();
        }

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

    // 8. Resolve Every Required Component from Active Rule
    // Explicitly determine source, raw score, and status without guessing
    const resolvedScores = {};
    const componentStatusList = [];

    const cieComponents = activeRule.cie?.components || [];

    for (const comp of cieComponents) {
        const key = comp.key;
        let rawMarks = null;
        let maxRawMarks = comp.conversion?.sourceMax || (comp.entries?.count * comp.entries?.maxMarksEach) || 50;
        let status = 'NOT_ENTERED'; // 'NOT_ENTERED' | 'ENTERED' | 'MISSING' | 'ABSENT' | 'NOT_APPLICABLE'
        let isAbsent = false;
        let sourceUsed = 'NONE';
        let metadata = {};

        // A. Priority 1: Explicit Override (for simulation / testing)
        if (overrides.rawMarks && overrides.rawMarks[key] !== undefined) {
            rawMarks = overrides.rawMarks[key];
            sourceUsed = 'OVERRIDE';
        }
        // B. Priority 2: Flexible Component Record (StudentEvaluationComponentRecord)
        else if (dynamicMarksMap.has(key)) {
            const rec = dynamicMarksMap.get(key);
            rawMarks = rec.rawMarks;
            maxRawMarks = rec.maxRawMarks || maxRawMarks;
            isAbsent = rec.isAbsent || rec.status === 'ABSENT';
            status = rec.status || (rawMarks !== null ? 'ENTERED' : 'NOT_ENTERED');
            sourceUsed = 'StudentEvaluationComponentRecord';
            metadata = rec.metadata || {};
            if (rec.metadata?.sessionsConducted && !runtimeLabSessions) {
                runtimeLabSessions = rec.metadata.sessionsConducted;
            }
        }
        // C. Priority 3: Legacy Compatibility Source (StudentCieRecord)
        else if (legacyCieRecord) {
            // Map legacy fields only where an explicit adapter exists
            switch (key) {
                // Standard Theory
                case 'THEORY_TEST':
                    if (legacyRawMarks.test1 !== null && legacyRawMarks.test1 !== undefined || legacyRawMarks.test2 !== null && legacyRawMarks.test2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.test1) || 0) + (Number(legacyRawMarks.test2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'THEORY_QUIZ':
                    if (legacyRawMarks.quiz1 !== null && legacyRawMarks.quiz1 !== undefined || legacyRawMarks.quiz2 !== null && legacyRawMarks.quiz2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.quiz1) || 0) + (Number(legacyRawMarks.quiz2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'THEORY_ASSIGNMENT':
                    if (legacyRawMarks.assignment1 !== null && legacyRawMarks.assignment1 !== undefined || legacyRawMarks.assignment2 !== null && legacyRawMarks.assignment2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.assignment1) || 0) + (Number(legacyRawMarks.assignment2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                // AEC Theory
                case 'AEC_TEST':
                    if (legacyRawMarks.test1 !== null && legacyRawMarks.test1 !== undefined || legacyRawMarks.test2 !== null && legacyRawMarks.test2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.test1) || 0) + (Number(legacyRawMarks.test2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'AEC_QUIZ_ASSIGNMENT':
                    if (legacyRawMarks.quiz1 !== null && legacyRawMarks.quiz1 !== undefined || legacyRawMarks.assignment1 !== null && legacyRawMarks.assignment1 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.quiz1) || 0) + (Number(legacyRawMarks.assignment1) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                // Integrated IPCC
                case 'IPCC_THEORY_TEST':
                    if (legacyRawMarks.test1 !== null && legacyRawMarks.test1 !== undefined || legacyRawMarks.test2 !== null && legacyRawMarks.test2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.test1) || 0) + (Number(legacyRawMarks.test2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'IPCC_THEORY_QUIZ':
                    if (legacyRawMarks.quiz1 !== null && legacyRawMarks.quiz1 !== undefined || legacyRawMarks.quiz2 !== null && legacyRawMarks.quiz2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.quiz1) || 0) + (Number(legacyRawMarks.quiz2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'IPCC_THEORY_ASSIGNMENT':
                    if (legacyRawMarks.assignment1 !== null && legacyRawMarks.assignment1 !== undefined || legacyRawMarks.assignment2 !== null && legacyRawMarks.assignment2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.assignment1) || 0) + (Number(legacyRawMarks.assignment2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'IPCC_LAB_CONDUCTION':
                    if (legacyRawMarks.labRecord !== null && legacyRawMarks.labRecord !== undefined) {
                        rawMarks = Number(legacyRawMarks.labRecord);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'IPCC_LAB_TEST':
                    if (legacyRawMarks.labTest !== null && legacyRawMarks.labTest !== undefined) {
                        rawMarks = Number(legacyRawMarks.labTest);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                // Standard Laboratory
                case 'LAB_CONDUCTION':
                    if (legacyRawMarks.labRecord !== null && legacyRawMarks.labRecord !== undefined) {
                        rawMarks = Number(legacyRawMarks.labRecord);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'LAB_TEST_VIVA':
                case 'LAB_TEST':
                    if (legacyRawMarks.labTest !== null && legacyRawMarks.labTest !== undefined) {
                        rawMarks = Number(legacyRawMarks.labTest);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                // NCMC
                case 'NCMC_CIE':
                    if (legacyRawMarks.cie !== null && legacyRawMarks.cie !== undefined) {
                        rawMarks = Number(legacyRawMarks.cie);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                // CAED / Drawing
                case 'CAED_CLASSWORK':
                case 'CAED_COURSEWORK':
                    if (legacyRawMarks.assignment1 !== null && legacyRawMarks.assignment1 !== undefined) {
                        rawMarks = Number(legacyRawMarks.assignment1);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'CAED_EL':
                case 'CAED_EXPERIENTIAL':
                    if (legacyRawMarks.assignment2 !== null && legacyRawMarks.assignment2 !== undefined) {
                        rawMarks = Number(legacyRawMarks.assignment2);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;
                case 'CAED_TESTS':
                case 'CAED_TEST':
                    if (legacyRawMarks.test1 !== null && legacyRawMarks.test1 !== undefined || legacyRawMarks.test2 !== null && legacyRawMarks.test2 !== undefined) {
                        rawMarks = (Number(legacyRawMarks.test1) || 0) + (Number(legacyRawMarks.test2) || 0);
                        sourceUsed = 'StudentCieRecord';
                    }
                    break;

                default:
                    // Support dynamic component keys directly entered (e.g. SDC Phase 1, Phase 2, M1, etc.)
                    if (legacyRawMarks[key] !== null && legacyRawMarks[key] !== undefined && !isNaN(Number(legacyRawMarks[key]))) {
                        rawMarks = Number(legacyRawMarks[key]);
                        sourceUsed = 'StudentCieRecord';
                    } else {
                        rawMarks = null;
                    }
            }
        }

        // Determine explicit status
        if (isAbsent || rawMarks === 'ABSENT') {
            status = 'ABSENT';
            rawMarks = 0;
            isAbsent = true;
        } else if (rawMarks === null || rawMarks === undefined) {
            status = 'NOT_ENTERED';
            rawMarks = null;
        } else if (rawMarks === 0) {
            status = 'ZERO';
        } else {
            status = 'ENTERED';
        }

        // Prepare input for F-08
        if (key === 'LAB_CONDUCTION' && comp.type === 'LAB_RECORD') {
            resolvedScores[key] = {
                rawScore: rawMarks !== null ? rawMarks : 0,
                sessionsConducted: runtimeLabSessions
            };
        } else if (isAbsent) {
            resolvedScores[key] = 'ABSENT';
        } else if (rawMarks !== null) {
            resolvedScores[key] = rawMarks;
        }

        componentStatusList.push({
            key,
            name: comp.name,
            type: comp.type,
            rawMarks,
            maxRawMarks,
            status,
            isAbsent,
            source: sourceUsed,
            metadata
        });
    }

    // 9. Process SEE Component in Status List
    const seeComponents = activeRule.see?.components || [];
    for (const comp of seeComponents) {
        const key = comp.key;
        let status = 'NOT_ENTERED';
        let rawMarks = seeScore;
        const maxRawMarks = comp.conversion?.sourceMax || (comp.entries?.count * comp.entries?.maxMarksEach) || (comp.key.includes('50') ? 50 : 100);

        if (!activeRule.see?.enabled) {
            status = 'NOT_APPLICABLE';
            rawMarks = null;
        } else if (rawMarks === 'ABSENT') {
            status = 'ABSENT';
            rawMarks = 0;
            resolvedScores[key] = 'ABSENT';
        } else if (rawMarks === null || rawMarks === undefined) {
            status = 'NOT_ENTERED';
            rawMarks = null;
        } else if (rawMarks === 0) {
            status = 'ZERO';
            resolvedScores[key] = 0;
        } else {
            status = 'ENTERED';
            resolvedScores[key] = rawMarks;
        }

        componentStatusList.push({
            key,
            name: comp.name,
            type: comp.type,
            rawMarks,
            maxRawMarks,
            status,
            isAbsent: status === 'ABSENT',
            source: activeRule.see?.enabled ? (overrides.seeScore !== undefined ? 'OVERRIDE' : 'StudentSemesterResult') : 'NONE'
        });
    }

    // 10. Normalized F-08 Input Contract
    const normalizedF08Input = {
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
        scores: resolvedScores,
        attendance: {
            percentage: attendancePercentage,
            attended: attendedClasses,
            total: conductedClasses,
            isMissing: attendancePercentage === null
        },
        runtimeContext: {
            sessionsConducted: runtimeLabSessions !== null ? runtimeLabSessions : undefined,
            isNcmcCompleted: overrides.isNcmcCompleted !== undefined
                ? overrides.isNcmcCompleted
                : (resolvedScores.NCMC_CIE !== undefined || resolvedScores.completed === true)
        }
    };

    return {
        student,
        subject,
        registeredSubject,
        schemeId: effectiveSchemeId,
        evaluationGroup,
        activeRule,
        normalizedF08Input,
        componentStatusList,
        attendanceInfo: {
            percentage: attendancePercentage,
            attended: attendedClasses,
            total: conductedClasses,
            sessionsConducted: runtimeLabSessions,
            status: attendancePercentage === null
                ? 'NOT_AVAILABLE'
                : (attendancePercentage >= 85 ? 'SATISFIED' : 'SHORTAGE')
        },
        legacyRawMarks: legacyRawMarks || {}
    };
}

/**
 * Calculates the canonical subject result for a student using the F-08 engine.
 * Purely deterministic calculation. Does NOT persist or publish automatically.
 * 
 * @param {Object} options
 * @returns {Promise<Object>} Canonical subject result structure
 */
async function calculateSubjectResult(options = {}) {
    const context = await buildComponentResolutionContext(options);
    const { normalizedF08Input, activeRule, evaluationGroup, componentStatusList, attendanceInfo } = context;

    // Run existing F-08 Calculation Engine (Single calculation authority)
    const calculation = await calculateStudentEvaluation(normalizedF08Input);

    // Merge calculated normalized scores back into the component status list
    const allRuleComps = (activeRule.cie?.components || []).concat(activeRule.see?.components || []);
    const components = componentStatusList.map(comp => {
        const match = (calculation.calculated?.components || []).find(c => c.key === comp.key);
        const ruleComp = allRuleComps.find(c => c.key === comp.key);
        const targetMax = match ? match.targetMax : (ruleComp?.conversion?.targetMax || comp.maxRawMarks);
        const entryCount = ruleComp?.entries?.count || 1;
        const entryMaxRaw = ruleComp?.entries?.maxMarksEach || comp.maxRawMarks;
        const entryMaxReduced = round(targetMax / entryCount, 2);
        const entryMode = ruleComp?.entryMode || 'COUNTED';
        const manualEntries = ruleComp?.entries?.manualEntries || [];
        const aggregationMethod = ruleComp?.aggregation?.method || 'SUM';

        return {
            key: comp.key,
            name: comp.name,
            type: comp.type,
            rawMarks: comp.rawMarks,
            rawMaxMarks: comp.maxRawMarks,
            normalizedMarks: match ? match.convertedScore : null,
            targetMax,
            entryCount,
            entryMaxRaw,
            entryMaxReduced,
            entryMode,
            manualEntries,
            aggregationMethod,
            status: comp.status,
            isAbsent: comp.isAbsent,
            source: comp.source,
            metadata: comp.metadata || {}
        };
    });

    // Determine canonical structure per Section 9
    return {
        student: {
            _id: context.student._id,
            usn: context.student.usn,
            name: context.student.name,
            semester: context.normalizedF08Input.student.semester,
            section: context.student.section || ''
        },
        subject: {
            _id: context.subject._id,
            code: context.subject.code,
            name: context.subject.name,
            credits: calculation.sgpa.credits
        },
        registeredSubject: context.registeredSubject?._id || null,
        evaluationRule: {
            _id: activeRule._id,
            name: activeRule.name,
            version: activeRule.version || 1
        },
        evaluationGroup: {
            _id: evaluationGroup._id,
            name: evaluationGroup.name
        },
        pattern: calculation.pattern || evaluationGroup.name,

        components,
        rawMarks: context.legacyRawMarks || {},

        cie: {
            obtained: calculation.calculated.cie,
            max: calculation.calculated.cieMax || 50
        },

        see: {
            obtained: calculation.calculated.see,
            max: calculation.calculated.seeMax || (activeRule.see?.enabled === false ? 0 : 50),
            enabled: activeRule.see?.enabled !== false
        },

        partitions: calculation.calculated.partitions || [],

        aggregate: {
            obtained: calculation.calculated.aggregate,
            max: calculation.calculated.aggregateMax || 100
        },

        attendance: {
            percentage: attendanceInfo.percentage,
            status: activeRule.eligibility?.conditions?.some(c => c.type === 'ATTENDANCE_MIN')
                ? attendanceInfo.status
                : 'NOT_APPLICABLE'
        },

        eligibility: {
            eligible: calculation.eligibility.eligible,
            passed: calculation.eligibility.passed,
            reasons: calculation.eligibility.failedConditions || []
        },

        grade: {
            letter: calculation.result.letterGrade,
            gradePoint: calculation.result.gradePoint
        },

        contributesToSGPA: calculation.sgpa.contributesToSGPA,

        calculatedAt: new Date()
    };
}

/**
 * Calculates results for all registered subjects in a student's semester.
 * One failed subject does NOT abort calculation of unrelated subjects.
 * 
 * @param {Object} options
 * @returns {Promise<Object>} Semester calculation summary
 */
async function calculateSemesterResults(options = {}) {
    const { studentId, student: preloadedStudent, semester: semesterInput, overrides = {} } = options;

    const student = preloadedStudent || await StudentAccount.findById(studentId).lean();
    if (!student) {
        throw new StudentResultError(`Student not found with ID: ${studentId}`, 404);
    }

    const targetSemester = semesterInput || student.academicProfile?.currentSemester || 1;

    let registeredSubjects = await StudentRegisteredSubject.find({
        student: student._id,
        $and: [
            { $or: [{ semester: targetSemester }, { semester: { $exists: false } }] },
            { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
        ]
    }).populate('subject').lean();

    let validRegistered = registeredSubjects.filter(r => r.subject);

    // If no manual registration exists, fall back to authoritative curriculum subjects
    if (validRegistered.length === 0) {
        const { resolveStudentCurriculumSubjects } = require('./studentSubjectResolver');
        const curriculumSubjects = await resolveStudentCurriculumSubjects(student, targetSemester);
        validRegistered = (curriculumSubjects || []).map(cs => ({
            _id: cs._id,
            subject: cs,
            registeredCredits: cs.credits,
            category: cs.category || 'Theory'
        }));
        registeredSubjects = validRegistered;
    }

    const subjectIds = validRegistered.map(r => r.subject._id);
    const regIds = validRegistered.map(r => r._id);

    // Batch pre-fetch all dynamic components, CIE records, attendance, and semester results in parallel
    const [
        allDynamicDocs,
        allCieRecords,
        allAttendanceDocs,
        semResultDoc
    ] = await Promise.all([
        StudentEvaluationComponentRecord.find({
            student: student._id,
            semester: targetSemester,
            subject: { $in: subjectIds }
        }).lean(),
        StudentCieRecord.find({
            student: student._id,
            semester: targetSemester,
            $or: [
                { registeredSubject: { $in: regIds } },
                { subject: { $in: subjectIds } }
            ]
        }).lean(),
        StudentSubjectAttendance.find({
            student: student._id,
            subject: { $in: subjectIds }
        }).lean(),
        StudentSemesterResult.findOne({
            student: student._id,
            semester: targetSemester
        }).lean()
    ]);

    // Build fast in-memory lookup maps
    const dynamicBySubj = new Map();
    for (const d of allDynamicDocs) {
        const k = d.subject?.toString();
        if (k) {
            if (!dynamicBySubj.has(k)) dynamicBySubj.set(k, []);
            dynamicBySubj.get(k).push(d);
        }
    }

    const cieByReg = new Map();
    const cieBySubj = new Map();
    for (const c of allCieRecords) {
        if (c.registeredSubject) cieByReg.set(c.registeredSubject.toString(), c);
        if (c.subject) cieBySubj.set(c.subject.toString(), c);
    }

    const attBySubj = new Map();
    for (const a of allAttendanceDocs) {
        if (a.subject) attBySubj.set(a.subject.toString(), a);
    }

    // Process all subjects in parallel using Promise.all
    const calculatedItems = await Promise.all(registeredSubjects.map(async (reg) => {
        if (!reg.subject) {
            return {
                error: {
                    registeredSubjectId: reg._id,
                    subjectCode: reg.customCode || 'CUSTOM',
                    error: 'Unmapped subject does not link to AcademicSubject'
                }
            };
        }

        try {
            const subjectResult = await calculateSubjectResult({
                student,
                subject: reg.subject,
                registeredSubject: reg,
                semester: targetSemester,
                overrides: overrides[reg.subject.code] || overrides[reg.subject._id.toString()] || {},
                prefetchedData: {
                    dynamicDocs: dynamicBySubj.get(reg.subject._id.toString()) || [],
                    cieRecord: cieByReg.get(reg._id.toString()) || cieBySubj.get(reg.subject._id.toString()) || null,
                    attendanceDoc: attBySubj.get(reg.subject._id.toString()) || null,
                    semResult: semResultDoc
                }
            });
            return { result: subjectResult };
        } catch (err) {
            return {
                error: {
                    registeredSubjectId: reg._id,
                    subjectId: reg.subject._id,
                    subjectCode: reg.subject.code,
                    subjectName: reg.subject.name,
                    error: err.message,
                    statusCode: err.statusCode || 500
                }
            };
        }
    }));

    const results = [];
    const errors = [];
    for (const item of calculatedItems) {
        if (item.result) results.push(item.result);
        if (item.error) errors.push(item.error);
    }

    return {
        student: {
            _id: student._id,
            usn: student.usn,
            name: student.name
        },
        semester: targetSemester,
        totalRegistered: registeredSubjects.length,
        calculatedCount: results.length,
        errorCount: errors.length,
        results,
        errors
    };
}

/**
 * Retrieves the evaluation component state for a student and subject.
 * Lists all active rule components alongside any entered marks from StudentEvaluationComponentRecord.
 */
async function getEvaluationComponentState(options = {}) {
    const { studentId, subjectId, registeredSubjectId, semester: semesterInput } = options;

    const student = await StudentAccount.findById(studentId).lean();
    if (!student) throw new StudentResultError('Student not found', 404);

    const subject = await AcademicSubject.findById(subjectId).lean();
    if (!subject) throw new StudentResultError('Subject not found', 404);

    const effectiveSemester = semesterInput || student.academicProfile?.currentSemester || 1;
    const effectiveSchemeId = subject.scheme || student.academicProfile?.scheme;

    const { rule: activeRule, group: evaluationGroup } = await resolveActiveEvaluationRule({
        scheme: effectiveSchemeId,
        subjectId: subject._id
    });

    const enteredRecords = await StudentEvaluationComponentRecord.find({
        student: student._id,
        subject: subject._id,
        semester: effectiveSemester
    }).lean();

    const enteredMap = new Map();
    for (const r of enteredRecords) {
        enteredMap.set(r.componentKey, r);
    }

    const cieComponents = (activeRule.cie?.components || []).map(comp => {
        const record = enteredMap.get(comp.key);
        return {
            key: comp.key,
            name: comp.name,
            type: comp.type,
            ruleMaxMarks: comp.conversion?.sourceMax || (comp.entries?.count * comp.entries?.maxMarksEach) || 50,
            targetContribution: comp.conversion?.targetMax || null,
            rawMarks: record ? record.rawMarks : null,
            isAbsent: record ? record.isAbsent : false,
            status: record ? record.status : 'NOT_ENTERED',
            enteredBy: record?.enteredBy || null,
            updatedAt: record?.updatedAt || null,
            metadata: record?.metadata || {}
        };
    });

    return {
        studentId: student._id,
        usn: student.usn,
        subjectId: subject._id,
        subjectCode: subject.code,
        semester: effectiveSemester,
        evaluationRule: {
            _id: activeRule._id,
            name: activeRule.name,
            version: activeRule.version || 1
        },
        evaluationGroup: {
            _id: evaluationGroup._id,
            name: evaluationGroup.name
        },
        components: cieComponents
    };
}

/**
 * Records or updates a student evaluation component mark in the flexible storage collection.
 * Validates strictly against the active AcademicEvaluationRule.
 */
async function saveEvaluationComponentMark(data = {}, userContext = null) {
    const {
        studentId,
        registeredSubjectId = null,
        subjectId,
        semester: semesterInput,
        componentKey,
        rawMarks = null,
        isAbsent = false,
        metadata = {}
    } = data;

    if (!studentId || !subjectId || !componentKey) {
        throw new StudentResultError('studentId, subjectId, and componentKey are required');
    }

    // 1. Resolve Student
    const student = await StudentAccount.findById(studentId).lean();
    if (!student) throw new StudentResultError('Student not found', 404);

    const effectiveSemester = semesterInput || student.academicProfile?.currentSemester || 1;

    // 2. Resolve Subject
    const subject = await AcademicSubject.findById(subjectId).lean();
    if (!subject) throw new StudentResultError('Subject not found', 404);

    const effectiveSchemeId = subject.scheme || student.academicProfile?.scheme;

    // 3. Resolve Active Rule
    const { rule: activeRule } = await resolveActiveEvaluationRule({
        scheme: effectiveSchemeId,
        subjectId: subject._id
    });

    // 4. Validate that componentKey actually exists in the active evaluation rule
    const validComponent = (activeRule.cie?.components || []).find(c => c.key === componentKey.trim());
    if (!validComponent) {
        throw new StudentResultError(
            `Component key "${componentKey}" is not defined in active evaluation rule "${activeRule.name}" (v${activeRule.version}) for ${subject.code}`,
            400,
            { validKeys: (activeRule.cie?.components || []).map(c => c.key) }
        );
    }

    // 5. Validate Mark Range
    const maxAllowed = validComponent.conversion?.sourceMax || (validComponent.entries?.count * validComponent.entries?.maxMarksEach) || 100;

    let cleanRawMarks = rawMarks !== null && rawMarks !== undefined ? Number(rawMarks) : null;
    if (cleanRawMarks !== null) {
        if (isNaN(cleanRawMarks) || cleanRawMarks < 0) {
            throw new StudentResultError(`rawMarks must be a non-negative number, received: ${rawMarks}`);
        }
        if (cleanRawMarks > maxAllowed) {
            throw new StudentResultError(`rawMarks (${cleanRawMarks}) cannot exceed component maximum (${maxAllowed})`);
        }
    }

    // Determine normalized score from rule definition
    let normalizedMarks = null;
    if (cleanRawMarks !== null && !isAbsent) {
        const targetMax = validComponent.conversion?.enabled && validComponent.conversion?.targetMax !== null
            ? validComponent.conversion.targetMax
            : maxAllowed;
        normalizedMarks = round((cleanRawMarks / maxAllowed) * targetMax, 2);
    } else if (isAbsent) {
        normalizedMarks = 0;
    }

    const status = isAbsent ? 'ABSENT' : (cleanRawMarks !== null ? 'ENTERED' : 'NOT_ENTERED');

    // 6. Safe Atomic Upsert (Idempotent: One current record per student + subject + semester + componentKey)
    const updatePayload = {
        student: student._id,
        registeredSubject: registeredSubjectId || null,
        subject: subject._id,
        semester: effectiveSemester,
        scheme: effectiveSchemeId,
        evaluationRule: activeRule._id,
        componentKey: componentKey.trim(),
        rawMarks: cleanRawMarks,
        maxRawMarks: maxAllowed,
        normalizedMarks,
        status,
        isAbsent: Boolean(isAbsent),
        metadata,
        updatedBy: userContext?.id || userContext?._id || null
    };

    const doc = await StudentEvaluationComponentRecord.findOneAndUpdate(
        {
            student: student._id,
            subject: subject._id,
            semester: effectiveSemester,
            componentKey: componentKey.trim()
        },
        {
            $set: updatePayload,
            $setOnInsert: { enteredBy: userContext?.id || userContext?._id || null }
        },
        { upsert: true, new: true, runValidators: true }
    );

    return doc;
}

/**
 * Explicitly publishes/persists an evaluated subject result to StudentSubjectEvaluationResult.
 * Clearly separated from regular deterministic calculation per Section 10.
 */
async function publishSubjectResult(options = {}, userContext = null) {
    const calculated = await calculateSubjectResult(options);

    const payload = {
        student: calculated.student._id,
        subject: calculated.subject._id,
        registeredSubject: calculated.registeredSubject,
        semester: calculated.student.semester,
        scheme: calculated.evaluationRule.scheme || userContext?.schemeId,
        evaluationGroup: calculated.evaluationGroup._id,
        evaluationGroupName: calculated.evaluationGroup.name,
        evaluationRule: calculated.evaluationRule._id,
        ruleVersion: calculated.evaluationRule.version,
        ruleName: calculated.evaluationRule.name,
        pattern: calculated.pattern,
        cie: calculated.cie,
        see: calculated.see,
        partitions: calculated.partitions,
        aggregate: calculated.aggregate,
        eligibility: calculated.eligibility,
        result: calculated.grade,
        sgpa: {
            contributesToSGPA: calculated.contributesToSGPA,
            credits: calculated.subject.credits,
            gradePoint: calculated.grade.gradePoint,
            weightedGradePoints: round(calculated.subject.credits * calculated.grade.gradePoint, 2)
        },
        attendance: calculated.attendance,
        lifecycleStatus: 'FINALIZED',
        finalizedAt: new Date(),
        finalizedBy: userContext?.id || userContext?._id || null,
        isStale: false,
        calculatedAt: calculated.calculatedAt
    };

    return await StudentSubjectEvaluationResult.findOneAndUpdate(
        {
            student: calculated.student._id,
            subject: calculated.subject._id,
            semester: calculated.student.semester
        },
        { $set: payload },
        { upsert: true, new: true, runValidators: true }
    );
}

/**
 * Minimal Student Semester Results Service (F-10 Phase 1)
 * Retrieves canonical calculated subject results for the authenticated student.
 * 
 * @param {string|mongoose.Types.ObjectId} studentId
 * @param {number} semester
 * @returns {Promise<{ semester: number, subjects: Array }>}
 */
async function getStudentSemesterResults(studentId, semester) {
    const semNum = Number(semester) || 1;
    const studentDoc = await StudentAccount.findById(studentId).lean();

    const [schemeDoc, distinctSemesters, batchResult] = await Promise.all([
        studentDoc?.academicProfile?.scheme ? Scheme.findById(studentDoc.academicProfile.scheme).lean() : null,
        StudentRegisteredSubject.distinct('semester', { student: studentDoc?._id || studentId }),
        calculateSemesterResults({
            studentId,
            student: studentDoc,
            semester: semNum
        })
    ]);

    const schemeName = schemeDoc?.name || 'Scheme 2025';

    const subjects = (batchResult.results || []).map(r => ({
        subjectId: r.subject._id,
        registeredSubjectId: r.registeredSubject || null,
        registeredSubject: r.registeredSubject || null,
        code: r.subject.code,
        name: r.subject.name,
        subjectCode: r.subject.code,
        subjectName: r.subject.name,
        credits: r.subject.credits,
        category: r.subject.category || 'Theory',
        evaluationGroup: r.evaluationGroup?.name || r.pattern,
        evaluationRuleVersion: r.evaluationRule?.version || 1,
        pattern: r.pattern,
        rawMarks: r.rawMarks || {},
        cie: {
            components: (r.components || []).filter(c => c.type !== 'THEORY_EXAM' && c.type !== 'PRACTICAL_EXAM' && !c.key.includes('SEE')).map(c => ({
                key: c.key,
                name: c.name,
                type: c.type,
                rawMarks: c.rawMarks,
                rawMaxMarks: c.rawMaxMarks,
                normalizedMarks: c.normalizedMarks,
                targetMax: c.targetMax,
                entryCount: c.entryCount,
                entryMaxRaw: c.entryMaxRaw,
                entryMaxReduced: c.entryMaxReduced,
                entryMode: c.entryMode,
                manualEntries: c.manualEntries,
                aggregationMethod: c.aggregationMethod,
                status: c.status,
                isAbsent: c.isAbsent,
                metadata: c.metadata || {}
            })),
            total: r.cie.obtained,
            obtained: r.cie.obtained,
            max: r.cie.max
        },
        see: {
            marks: r.see.obtained,
            obtained: r.see.obtained,
            max: r.see.max,
            enabled: r.see.enabled
        },
        aggregate: {
            marks: r.aggregate.obtained,
            obtained: r.aggregate.obtained,
            max: r.aggregate.max
        },
        attendance: {
            percentage: r.attendance?.percentage !== undefined ? r.attendance.percentage : null,
            status: r.attendance?.status || (r.attendance?.percentage === null ? 'NOT_AVAILABLE' : 'SATISFIED')
        },
        eligibility: {
            eligible: r.eligibility.eligible,
            reasons: r.eligibility.reasons || [],
            failedConditions: r.eligibility.reasons || []
        },
        grade: {
            letter: r.grade.letter,
            gradePoint: r.grade.gradePoint
        },
        contributesToSGPA: r.contributesToSGPA,
        components: (r.components || []).map(c => ({
            key: c.key,
            name: c.name,
            type: c.type,
            rawMarks: c.rawMarks,
            rawMaxMarks: c.rawMaxMarks,
            normalizedMarks: c.normalizedMarks,
            targetMax: c.targetMax,
            entryCount: c.entryCount,
            entryMaxRaw: c.entryMaxRaw,
            entryMaxReduced: c.entryMaxReduced,
            entryMode: c.entryMode,
            manualEntries: c.manualEntries,
            aggregationMethod: c.aggregationMethod,
            status: c.status,
            isAbsent: c.isAbsent,
            metadata: c.metadata || {}
        })),
        partitions: r.partitions || []
    }));

    const passedSubjects = subjects.filter(s => s.grade.letter !== 'F' && s.grade.letter !== 'NP' && s.grade.letter !== 'NE').length;
    const failedSubjects = subjects.filter(s => s.grade.letter === 'F' || s.grade.letter === 'NP' || s.grade.letter === 'NE').length;
    const totalCreditsAttempted = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);
    const totalCreditsEarned = subjects.filter(s => s.grade.letter !== 'F' && s.grade.letter !== 'NP' && s.grade.letter !== 'NE').reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

    const availableSemesters = distinctSemesters && distinctSemesters.length > 0
        ? distinctSemesters.map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b)
        : [1];

    const currentSemester = studentDoc?.academicProfile?.currentSemester || 1;

    return {
        semester: semNum,
        availableSemesters,
        scheme: schemeName,
        student: {
            _id: studentDoc?._id || studentId,
            usn: studentDoc?.usn || '',
            name: studentDoc?.name || '',
            branch: studentDoc?.branch || '',
            currentSemester,
            cgpa: studentDoc?.cgpa ?? null
        },
        summary: {
            totalSubjects: subjects.length,
            passedSubjects,
            failedSubjects,
            totalCreditsAttempted,
            totalCreditsEarned,
            cgpa: studentDoc?.cgpa ?? null,
            sgpaStatus: 'PENDING_F11_PROCESSING',
            sgpaMessage: 'SGPA & CGPA will appear after semester result processing.'
        },
        subjects
    };
}

module.exports = {
    calculateSubjectResult,
    calculateSemesterResults,
    getStudentSemesterResults,
    getEvaluationComponentState,
    saveEvaluationComponentMark,
    publishSubjectResult,
    buildComponentResolutionContext,
    StudentResultError
};
