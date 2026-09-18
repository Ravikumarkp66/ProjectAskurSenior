const express = require('express');
const router = express.Router();
const {
    authenticateStudent,
    requireActiveAccount
} = require('../modules/auth/middlewares/authV2.middleware');
const { getStudentSemesterResults } = require('../services/studentResultService');

// All routes require authenticated and active student account
// Security: Student ID is derived strictly from authentication session.
router.use(authenticateStudent, requireActiveAccount);

/**
 * GET /api/student/results/:semester
 * Retrieves canonical calculated subject results for the authenticated student and semester.
 */
router.get('/:semester', async (req, res) => {
    try {
        const studentId = req.student?._id || req.userId;
        const semester = parseInt(req.params.semester, 10) || 1;

        const result = await getStudentSemesterResults(studentId, semester);

        return res.json({
            success: true,
            semester: result.semester,
            scheme: result.scheme,
            student: result.student,
            subjects: result.subjects,
            data: result
        });
    } catch (err) {
        console.error('[StudentResultAPI] Error calculating results:', err);
        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Failed to calculate student semester results',
            message: err.message || 'Failed to calculate student semester results'
        });
    }
});

/**
 * GET /api/student/results
 * Defaults to current semester of the authenticated student.
 */
router.get('/', async (req, res) => {
    try {
        const studentId = req.student?._id || req.userId;
        const semester = req.student?.academicProfile?.currentSemester || req.student?.semester || 1;

        const result = await getStudentSemesterResults(studentId, semester);

        return res.json({
            success: true,
            semester: result.semester,
            scheme: result.scheme,
            student: result.student,
            subjects: result.subjects,
            data: result
        });
    } catch (err) {
        console.error('[StudentResultAPI] Error calculating results:', err);
        return res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Failed to calculate student semester results',
            message: err.message || 'Failed to calculate student semester results'
        });
    }
});

module.exports = router;
