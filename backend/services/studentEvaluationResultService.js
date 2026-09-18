/**
 * Student Evaluation Result Service (F-10)
 * 
 * Orchestrates the complete Student Result Flow for AskUrSenior:
 * 1. SOURCE DATA: Resolves legacy CIE, dynamic component marks, SEE, and attendance.
 * 2. CONTEXT & RULE RESOLUTION: Resolves active AcademicEvaluationRule via EvaluationRuleResolver.
 * 3. CALCULATION: Delegates purely to F-08 EvaluationCalculationEngine (no duplicate math).
 * 4. PERSISTENCE: Safely creates or updates StudentSubjectEvaluationResult documents.
 * 5. LIFECYCLE: Enforces DRAFT vs FINALIZED status (protects finalized results from silent overwrites).
 * 6. SEMESTER BATCH: Evaluates subjects independently; single subject failure never halts others.
 * 
 * IMPORTANT: NO SGPA or CGPA is calculated or stored here (reserved strictly for F-11).
 */

const mongoose = require('mongoose');
const StudentAccount = require('../models/StudentAccount');
const AcademicSubject = require('../models/AcademicSubject');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentSubjectEvaluationResult = require('../models/StudentSubjectEvaluationResult');
const StudentComponentMark = require('../models/StudentComponentMark');

const {
    buildStudentEvaluationContext,
    evaluateStudentSubject
} = require('./academicEvaluationContextService');
const { calculateStudentEvaluation } = require('./evaluationCalculationEngine');

class ResultLifecycleError extends Error {
    constructor(message, statusCode = 409) {
        super(message);
        this.name = 'ResultLifecycleError';
        this.statusCode = statusCode;
    }
}

class ResultServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = 'ResultServiceError';
        this.statusCode = statusCode;
    }
}

/**
 * Calculates and persists the official evaluation result for a single subject.
 * 
 * @param {Object} params
 * @param {string|ObjectId} params.studentId - StudentAccount ID or object
 * @param {string|ObjectId} params.subjectId - AcademicSubject ID or code
 * @param {number} [params.semester] - Optional semester override (defaults to student's current)
 * @param {boolean} [params.forceRecalculate=false] - If true, permits recalculating even if FINALIZED
 * @param {Object} [params.overrides] - Optional overrides for testing/simulation
 * @param {Object} [params.userContext] - User performing the action (for auditing)
 * @returns {Promise<Object>} Persisted StudentSubjectEvaluationResult document
 */
async function calculateAndSaveSubjectResult(params = {}) {
    const {
        studentId,
        subjectId,
        subjectCode,
        semester,
        forceRecalculate = false,
        overrides = {},
        userContext = null
    } = params;

    // 1. Build evaluation context via F-09 context adapter
    const contextOptions = {
        student: studentId,
        semester,
        rawMarksOverride: overrides.rawMarks,
        seeScoreOverride: overrides.seeScore,
        attendanceOverride: overrides.attendance,
        sessionsConductedOverride: overrides.sessionsConducted,
        isNcmcCompletedOverride: overrides.isNcmcCompleted
    };

    if (subjectId) {
        contextOptions.subject = subjectId;
    } else if (subjectCode) {
        contextOptions.subjectCode = subjectCode;
    } else {
        throw new ResultServiceError('Either subjectId or subjectCode must be provided');
    }

    const { normalizedInput, metadata } = await buildStudentEvaluationContext(contextOptions);

    // 2. Identify effective IDs
    const resolvedStudentId = normalizedInput.student._id;
    const resolvedSubjectId = normalizedInput.subject._id;
    const resolvedSemester = normalizedInput.student.semester;
    const resolvedSchemeId = normalizedInput.rule.scheme;
    const registeredSubjectId = metadata.registeredSubjectId;

    // 3. Check for existing evaluated result to protect lifecycle
    const existingResult = await StudentSubjectEvaluationResult.findOne({
        student: resolvedStudentId,
        subject: resolvedSubjectId,
        semester: resolvedSemester
    });

    if (existingResult && existingResult.lifecycleStatus === 'FINALIZED' && !forceRecalculate) {
        throw new ResultLifecycleError(
            `Subject evaluation result is FINALIZED for student ${normalizedInput.student.usn || resolvedStudentId}, ` +
            `subject ${normalizedInput.subject.code || resolvedSubjectId}, semester ${resolvedSemester}. ` +
            `Recalculation blocked. Pass forceRecalculate=true to override.`
        );
    }

    // 4. Delegate to F-08 Calculation Engine (Single calculation authority)
    const calculation = await calculateStudentEvaluation(normalizedInput);

    // 5. Build Persisted Document Payload
    const cieComponents = (calculation.calculated?.components || [])
        .filter(c => c.type !== 'THEORY_EXAM' && c.type !== 'PRACTICAL_EXAM')
        .map(c => ({
            key: c.key,
            name: c.name,
            type: c.type,
            partition: c.key.includes('THEORY') ? 'THEORY' : (c.key.includes('LAB') || c.type === 'LAB_RECORD' || c.type === 'LAB_TEST' ? 'PRACTICAL' : null),
            rawScore: c.rawScore,
            rawMax: c.rawMax,
            convertedScore: c.convertedScore,
            targetMax: c.targetMax,
            isAbsent: !!c.isAbsent,
            isMissing: !!c.isMissing,
            wasClamped: !!c.wasClamped,
            source: 'EvaluationContext',
            metadata: (c.metadata && typeof c.metadata === 'object') ? c.metadata : (normalizedInput.runtimeContext?.sessionsConducted ? { sessionsConducted: normalizedInput.runtimeContext.sessionsConducted } : {})
        }));

    const seeComponents = (calculation.calculated?.components || [])
        .filter(c => c.type === 'THEORY_EXAM' || c.type === 'PRACTICAL_EXAM')
        .map(c => ({
            key: c.key,
            name: c.name,
            type: c.type,
            rawScore: c.rawScore,
            rawMax: c.rawMax,
            convertedScore: c.convertedScore,
            targetMax: c.targetMax,
            isAbsent: !!c.isAbsent,
            isMissing: !!c.isMissing,
            wasClamped: !!c.wasClamped,
            source: 'EvaluationContext'
        }));

    // Multi-partition structure for IPCC
    const partitions = (calculation.calculated?.partitions || []).map(p => ({
        partition: p.partition ? p.partition.toUpperCase() : 'THEORY',
        total: p.score !== undefined ? p.score : p.total,
        maxMarks: p.maxMarks || 25,
        minRequired: p.minRequired || 10,
        passed: p.passed !== undefined ? p.passed : true
    }));

    // Condition results
    const conditionResults = (calculation.eligibility?.conditionResults || []).map(cr => ({
        type: cr.type,
        description: cr.description,
        required: cr.threshold !== undefined ? cr.threshold : cr.required,
        actual: cr.actual,
        met: cr.passed !== undefined ? cr.passed : cr.met
    }));

    const resultPayload = {
        student: resolvedStudentId,
        subject: resolvedSubjectId,
        registeredSubject: registeredSubjectId,
        semester: resolvedSemester,
        scheme: resolvedSchemeId,

        // Versioning & Rule Lineage Snapshot
        evaluationGroup: metadata.evaluationGroupId,
        evaluationGroupName: metadata.evaluationGroupName,
        evaluationRule: metadata.ruleId,
        ruleVersion: metadata.ruleVersion || 1,
        ruleName: metadata.ruleName,
        pattern: calculation.pattern || metadata.evaluationGroupName,

        // CIE
        cie: {
            enabled: normalizedInput.rule.cie?.enabled !== false,
            total: calculation.calculated.cie,
            maxMarks: calculation.calculated.cieMax || 50,
            status: calculation.calculated.cie !== null ? 'COMPLETE' : 'INCOMPLETE',
            components: cieComponents
        },

        // SEE
        see: {
            enabled: normalizedInput.rule.see?.enabled !== false,
            total: calculation.calculated.see,
            maxMarks: calculation.calculated.seeMax || (normalizedInput.rule.see?.enabled === false ? 0 : 50),
            status: normalizedInput.rule.see?.enabled === false
                ? 'NOT_APPLICABLE'
                : (calculation.calculated.see !== null ? 'ENTERED' : 'PENDING'),
            components: seeComponents
        },

        partitions,

        // Aggregate
        aggregate: {
            total: calculation.calculated.aggregate,
            maxMarks: calculation.calculated.aggregateMax || 100,
            percentage: calculation.calculated.aggregate !== null && calculation.calculated.aggregateMax > 0
                ? Math.round((calculation.calculated.aggregate / calculation.calculated.aggregateMax) * 10000) / 100
                : null
        },

        // Eligibility
        eligibility: {
            eligible: calculation.eligibility.eligible,
            passed: calculation.eligibility.passed,
            failedConditions: calculation.eligibility.failedConditions || [],
            conditionResults
        },

        // Result & Grade
        result: {
            status: calculation.result.status,
            letterGrade: calculation.result.letterGrade,
            gradePoint: calculation.result.gradePoint
        },

        // SGPA Metadata (strictly metadata, NO semester GPA)
        sgpa: {
            contributesToSGPA: calculation.sgpa.contributesToSGPA,
            credits: calculation.sgpa.credits,
            gradePoint: calculation.sgpa.gradePoint,
            weightedGradePoints: calculation.sgpa.weightedGradePoints
        },

        // Attendance snapshot
        attendance: {
            percentage: normalizedInput.attendance?.percentage !== undefined ? normalizedInput.attendance.percentage : null,
            attended: normalizedInput.attendance?.attended !== undefined ? normalizedInput.attendance.attended : null,
            total: normalizedInput.attendance?.total !== undefined ? normalizedInput.attendance.total : null
        },

        // Lifecycle & recalculation tracking
        lifecycleStatus: existingResult?.lifecycleStatus === 'FINALIZED' && forceRecalculate ? 'FINALIZED' : 'DRAFT',
        isStale: false,
        staleReason: null,
        calculatedAt: new Date()
    };

    // 6. Safe atomic upsert
    const savedResult = await StudentSubjectEvaluationResult.findOneAndUpdate(
        {
            student: resolvedStudentId,
            subject: resolvedSubjectId,
            semester: resolvedSemester
        },
        { $set: resultPayload },
        { upsert: true, new: true, runValidators: true }
    );

    return savedResult;
}

/**
 * Calculates and persists results for ALL registered subjects in a student's semester.
 * 
 * Fault-tolerant: A failure in one subject (e.g. missing rule or unconfigured group)
 * does NOT abort the calculation of other valid subjects.
 * 
 * @param {Object} params
 * @param {string|ObjectId} params.studentId - StudentAccount ID
 * @param {number} [params.semester] - Semester number
 * @param {boolean} [params.forceRecalculate=false] - Force recalculation of finalized results
 * @returns {Promise<Object>} Summary with successful and failed subject lists
 */
async function calculateAndSaveSemesterResults(params = {}) {
    const { studentId, semester, forceRecalculate = false, overrides = {} } = params;

    const student = await StudentAccount.findById(studentId).lean();
    if (!student) {
        throw new ResultServiceError(`Student not found with ID: ${studentId}`, 404);
    }

    const targetSemester = semester || student.academicProfile?.currentSemester || 1;

    // Find all active registered subjects for this student and semester
    const registeredSubjects = await StudentRegisteredSubject.find({
        student: student._id,
        $and: [
            { $or: [{ semester: targetSemester }, { semester: { $exists: false } }] },
            { $or: [{ isActive: true }, { isActive: { $exists: false } }] }
        ]
    }).populate('subject').lean();

    const successful = [];
    const failed = [];

    for (const reg of registeredSubjects) {
        const subjectDoc = reg.subject;
        if (!subjectDoc) {
            failed.push({
                registeredSubjectId: reg._id,
                subjectCode: reg.customCode || 'CUSTOM',
                error: 'Custom or unmapped subject does not have a linked AcademicSubject document'
            });
            continue;
        }

        try {
            const resultDoc = await calculateAndSaveSubjectResult({
                studentId: student._id,
                subjectId: subjectDoc._id,
                semester: targetSemester,
                forceRecalculate,
                overrides: overrides[subjectDoc.code] || overrides[subjectDoc._id.toString()] || {}
            });

            successful.push(resultDoc);
        } catch (err) {
            failed.push({
                registeredSubjectId: reg._id,
                subjectId: subjectDoc._id,
                subjectCode: subjectDoc.code,
                subjectName: subjectDoc.name,
                error: err.message,
                statusCode: err.statusCode || 500
            });
        }
    }

    return {
        student: {
            _id: student._id,
            usn: student.usn,
            name: student.name
        },
        semester: targetSemester,
        totalRegistered: registeredSubjects.length,
        successCount: successful.length,
        failedCount: failed.length,
        successful,
        failed
    };
}

/**
 * Retrieves the persisted evaluation result for a single subject.
 */
async function getSubjectEvaluationResult(params = {}) {
    const { studentId, subjectId, semester } = params;
    const query = { student: studentId, subject: subjectId };
    if (semester) query.semester = semester;

    return await StudentSubjectEvaluationResult.findOne(query)
        .populate('subject')
        .populate('evaluationGroup')
        .populate('evaluationRule')
        .lean();
}

/**
 * Retrieves all evaluated subject results for a student's semester.
 */
async function getSemesterEvaluationResults(params = {}) {
    const { studentId, semester } = params;
    const query = { student: studentId };
    if (semester) query.semester = semester;

    return await StudentSubjectEvaluationResult.find(query)
        .populate('subject')
        .populate('evaluationGroup')
        .populate('evaluationRule')
        .sort({ 'subject.code': 1, createdAt: 1 })
        .lean();
}

/**
 * Records a single component mark in the flexible StudentComponentMark collection.
 * Flags existing evaluation result as stale so it can be recalculated cleanly.
 */
async function recordComponentMark(params = {}) {
    const {
        studentId,
        subjectId,
        registeredSubjectId = null,
        semester,
        schemeId,
        evaluationGroupId = null,
        componentKey,
        componentName = '',
        rawScore = null,
        rawMax = null,
        isAbsent = false,
        source = 'FACULTY_ENTRY',
        metadata = {},
        recordedBy = null
    } = params;

    if (!studentId || !subjectId || !semester || !componentKey) {
        throw new ResultServiceError('studentId, subjectId, semester, and componentKey are required');
    }

    // Resolve scheme if not provided
    let effectiveSchemeId = schemeId;
    if (!effectiveSchemeId) {
        const student = await StudentAccount.findById(studentId).lean();
        effectiveSchemeId = student?.academicProfile?.scheme;
    }

    const updatePayload = {
        student: studentId,
        subject: subjectId,
        registeredSubject: registeredSubjectId,
        semester,
        scheme: effectiveSchemeId,
        evaluationGroup: evaluationGroupId,
        componentKey: componentKey.trim(),
        componentName: componentName.trim() || componentKey.trim(),
        rawScore: rawScore !== null && rawScore !== undefined ? Number(rawScore) : null,
        rawMax: rawMax !== null && rawMax !== undefined ? Number(rawMax) : null,
        isAbsent: Boolean(isAbsent),
        source,
        metadata,
        recordedBy
    };

    const savedMark = await StudentComponentMark.findOneAndUpdate(
        {
            student: studentId,
            subject: subjectId,
            semester,
            componentKey: componentKey.trim()
        },
        { $set: updatePayload },
        { upsert: true, new: true, runValidators: true }
    );

    // Flag any existing draft evaluation result as stale
    await StudentSubjectEvaluationResult.updateOne(
        {
            student: studentId,
            subject: subjectId,
            semester,
            lifecycleStatus: 'DRAFT'
        },
        {
            $set: {
                isStale: true,
                staleReason: `Component mark updated for ${componentKey}`
            }
        }
    );

    return savedMark;
}

/**
 * Batch records multiple component marks for a student and subject.
 */
async function batchRecordComponentMarks(params = {}) {
    const { studentId, subjectId, semester, marks = [], source = 'FACULTY_ENTRY', recordedBy = null } = params;

    if (!Array.isArray(marks) || marks.length === 0) {
        throw new ResultServiceError('marks array cannot be empty');
    }

    const saved = [];
    for (const item of marks) {
        const markDoc = await recordComponentMark({
            studentId,
            subjectId,
            semester,
            componentKey: item.componentKey || item.key,
            componentName: item.componentName || item.name,
            rawScore: item.rawScore !== undefined ? item.rawScore : item.score,
            rawMax: item.rawMax !== undefined ? item.rawMax : item.maxMarks,
            isAbsent: item.isAbsent || false,
            metadata: item.metadata || {},
            source,
            recordedBy
        });
        saved.push(markDoc);
    }

    return saved;
}

/**
 * Finalizes an evaluated subject result.
 */
async function finalizeSubjectResult(params = {}) {
    const { studentId, subjectId, semester, finalizedBy = null } = params;

    const result = await StudentSubjectEvaluationResult.findOne({
        student: studentId,
        subject: subjectId,
        semester
    });

    if (!result) {
        throw new ResultServiceError('Subject evaluation result not found to finalize', 404);
    }

    result.lifecycleStatus = 'FINALIZED';
    result.finalizedAt = new Date();
    result.finalizedBy = finalizedBy;
    result.isStale = false;
    result.staleReason = null;

    await result.save();
    return result;
}

/**
 * Unfinalizes a subject result (Admin only) to allow edits/recalculations.
 */
async function unfinalizeSubjectResult(params = {}) {
    const { studentId, subjectId, semester } = params;

    const result = await StudentSubjectEvaluationResult.findOne({
        student: studentId,
        subject: subjectId,
        semester
    });

    if (!result) {
        throw new ResultServiceError('Subject evaluation result not found to unfinalize', 404);
    }

    result.lifecycleStatus = 'DRAFT';
    result.finalizedAt = null;
    result.finalizedBy = null;

    await result.save();
    return result;
}

module.exports = {
    calculateAndSaveSubjectResult,
    calculateAndSaveSemesterResults,
    getSubjectEvaluationResult,
    getSemesterEvaluationResults,
    recordComponentMark,
    batchRecordComponentMarks,
    finalizeSubjectResult,
    unfinalizeSubjectResult,
    ResultLifecycleError,
    ResultServiceError
};
