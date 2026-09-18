/**
 * Student Evaluation Result Controller (F-10 Part 11)
 * 
 * Thin HTTP controller exposing endpoints for student subject evaluation:
 * - GET student subject result (canonical result calculation without persistent mutation)
 * - GET student semester results (fault-tolerant, subject-by-subject)
 * - GET evaluation component state (component definitions & current marks)
 * - POST/PUT student evaluation component marks (strictly validated against active rule)
 * - POST publish/save subject result (explicit persistence operation)
 */

const studentResultService = require('../services/studentResultService');

/**
 * Authorization helper: Verifies the requesting user can access the target student's data.
 * Students can only view their own data; Admins and Faculty can view any student.
 */
function assertStudentAccess(req, targetStudentId) {
    if (!req.user) return; // Let auth middleware handle unauthenticated
    const requestingUserId = (req.user.id || req.user._id || '').toString();
    const targetIdStr = targetStudentId.toString();

    const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
    const isFaculty = req.user.role === 'faculty';

    if (!isAdmin && !isFaculty && requestingUserId !== targetIdStr) {
        const error = new Error('Access denied: You are only authorized to view your own academic results');
        error.statusCode = 403;
        throw error;
    }
}

/**
 * Calculates and returns the canonical subject result.
 * GET /api/evaluation-results/subject
 * GET /api/evaluation-results/student/:studentId/subject/:subjectId
 */
async function getSubjectResult(req, res) {
    try {
        const targetStudentId = req.params.studentId || req.query.studentId || req.user?.id || req.user?._id;
        const targetSubjectId = req.params.subjectId || req.query.subjectId;
        const subjectCode = req.query.subjectCode;
        const semester = req.query.semester ? Number(req.query.semester) : undefined;

        if (!targetStudentId) {
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }
        if (!targetSubjectId && !subjectCode) {
            return res.status(400).json({ success: false, message: 'subjectId or subjectCode is required' });
        }

        assertStudentAccess(req, targetStudentId);

        const result = await studentResultService.calculateSubjectResult({
            studentId: targetStudentId,
            subjectId: targetSubjectId,
            subjectCode,
            semester
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            name: err.name,
            message: err.message,
            details: err.details || null
        });
    }
}

/**
 * Calculates and returns results for all registered subjects in a student's semester.
 * GET /api/evaluation-results/semester
 * GET /api/evaluation-results/student/:studentId/semester/:semester
 */
async function getSemesterResults(req, res) {
    try {
        const targetStudentId = req.params.studentId || req.query.studentId || req.user?.id || req.user?._id;
        const semester = req.params.semester ? Number(req.params.semester) : (req.query.semester ? Number(req.query.semester) : undefined);

        if (!targetStudentId) {
            return res.status(400).json({ success: false, message: 'studentId is required' });
        }

        assertStudentAccess(req, targetStudentId);

        const summary = await studentResultService.calculateSemesterResults({
            studentId: targetStudentId,
            semester
        });

        return res.status(200).json({
            success: true,
            data: summary
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            name: err.name,
            message: err.message
        });
    }
}

/**
 * Retrieves the evaluation component state for a subject.
 * GET /api/evaluation-results/components
 */
async function getEvaluationComponentState(req, res) {
    try {
        const studentId = req.query.studentId || req.user?.id || req.user?._id;
        const subjectId = req.query.subjectId;
        const registeredSubjectId = req.query.registeredSubjectId;
        const semester = req.query.semester ? Number(req.query.semester) : undefined;

        if (!studentId || !subjectId) {
            return res.status(400).json({ success: false, message: 'studentId and subjectId are required' });
        }

        assertStudentAccess(req, studentId);

        const state = await studentResultService.getEvaluationComponentState({
            studentId,
            subjectId,
            registeredSubjectId,
            semester
        });

        return res.status(200).json({
            success: true,
            data: state
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            name: err.name,
            message: err.message
        });
    }
}

/**
 * Records or updates a student evaluation component mark.
 * POST /api/evaluation-results/components
 */
async function recordComponentMark(req, res) {
    try {
        // Only Admin or Faculty can enter component marks
        const isAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
        const isFaculty = req.user?.role === 'faculty';

        if (!isAdmin && !isFaculty) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only faculty or administrator accounts can record component marks'
            });
        }

        const mark = await studentResultService.saveEvaluationComponentMark(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: 'Evaluation component mark recorded successfully',
            data: mark
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            name: err.name,
            message: err.message,
            details: err.details || null
        });
    }
}

/**
 * Explicitly publishes/persists an evaluated subject result.
 * POST /api/evaluation-results/publish
 */
async function publishSubjectResult(req, res) {
    try {
        const isAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
        const isFaculty = req.user?.role === 'faculty';

        if (!isAdmin && !isFaculty) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only faculty or administrator accounts can publish evaluation results'
            });
        }

        const published = await studentResultService.publishSubjectResult(req.body, req.user);

        return res.status(200).json({
            success: true,
            message: 'Subject evaluation result published successfully',
            data: published
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            name: err.name,
            message: err.message,
            details: err.details || null
        });
    }
}

module.exports = {
    getSubjectResult,
    getSemesterResults,
    getEvaluationComponentState,
    recordComponentMark,
    publishSubjectResult
};
