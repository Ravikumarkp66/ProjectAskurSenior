const express = require('express');
const router = express.Router();
const authV2Controller = require('../controllers/authV2.controller');
const {
    validateEmailLogin,
    validateVerifyOtp,
    validateRegister,
    validateCheckUsn
} = require('../validators/authV2.validator');
const {
    authenticateStudent,
    requireActiveAccount,
    v2AuthLimiter,
    v2OtpLimiter
} = require('../middlewares/authV2.middleware');

// Configure Multer for AWS S3 Storage
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3 } = require('../../../utils/s3');

const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profiles/' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Public routes
router.post('/login/google', v2AuthLimiter, authV2Controller.loginGoogle);
router.post('/google', v2AuthLimiter, authV2Controller.loginGoogle);
router.post('/login/email', v2OtpLimiter, validateEmailLogin, authV2Controller.loginEmail);
router.post('/send-otp', v2OtpLimiter, validateEmailLogin, authV2Controller.loginEmail);
router.post('/verify-otp', v2AuthLimiter, validateVerifyOtp, authV2Controller.verifyOtp);
router.post('/register', v2AuthLimiter, validateRegister, authV2Controller.register);
router.post('/complete-profile', v2AuthLimiter, validateRegister, authV2Controller.register);
router.post('/check-usn', validateCheckUsn, authV2Controller.checkUsn);
router.post('/recover-account', authV2Controller.recoverAccount);
router.post('/verify-recovery-otp', authV2Controller.verifyRecoveryOtp);
router.post('/refresh-token', authV2Controller.refreshToken);
router.post('/logout', authV2Controller.logout);
router.get('/session', authV2Controller.getSession);

// Protected routes
router.get('/me', authenticateStudent, requireActiveAccount, authV2Controller.getMe);
router.put('/profile', authenticateStudent, requireActiveAccount, authV2Controller.updateProfile);
router.post('/profile/usn/request-otp', authenticateStudent, requireActiveAccount, authV2Controller.requestUsnChangeOtp);
router.post('/profile/usn/verify-otp', authenticateStudent, requireActiveAccount, authV2Controller.verifyUsnChangeOtp);
router.post('/profile/picture', authenticateStudent, requireActiveAccount, upload.single('profilePicture'), authV2Controller.uploadProfilePicture);
router.delete('/profile/picture', authenticateStudent, requireActiveAccount, authV2Controller.removeProfilePicture);
router.get('/profile/semesters', authenticateStudent, requireActiveAccount, authV2Controller.getSemesters);
router.put('/profile/semesters', authenticateStudent, requireActiveAccount, authV2Controller.updateSemesters);
router.get('/profile/timetable/config', authenticateStudent, requireActiveAccount, authV2Controller.getTimetableConfig);
router.put('/profile/timetable/config', authenticateStudent, requireActiveAccount, authV2Controller.saveTimetableConfig);
router.post('/profile/timetable/generate-preview', authenticateStudent, requireActiveAccount, authV2Controller.generatePreview);
router.get('/profile/timetable/slots', authenticateStudent, requireActiveAccount, authV2Controller.getTimetableSlots);
router.put('/profile/timetable/slots', authenticateStudent, requireActiveAccount, authV2Controller.updateTimetableSlots);
router.post('/profile/timetable/reset', authenticateStudent, requireActiveAccount, authV2Controller.resetTimetable);
router.post('/profile/timetable/undo-reset', authenticateStudent, requireActiveAccount, authV2Controller.undoResetTimetable);
router.get('/profile/timetable/subjects', authenticateStudent, requireActiveAccount, authV2Controller.getAcademicSubjects);
router.get('/profile/timetable/registered-subjects', authenticateStudent, requireActiveAccount, authV2Controller.getRegisteredSubjects);
router.put('/profile/timetable/registered-subjects', authenticateStudent, requireActiveAccount, authV2Controller.saveRegisteredSubjects);
router.put('/profile/timetable/weekly-plan', authenticateStudent, requireActiveAccount, authV2Controller.updateWeeklyPlan);

// Attendance Overview & Planning (Phase 5.1)
router.get('/profile/attendance/subjects', authenticateStudent, requireActiveAccount, authV2Controller.getSubjectProgress);
router.get('/profile/attendance/history/:subjectId', authenticateStudent, requireActiveAccount, authV2Controller.getAttendanceHistory);
router.put('/profile/attendance/history/:attendanceId', authenticateStudent, requireActiveAccount, authV2Controller.updateAttendanceHistory);
router.post('/profile/attendance/history/extra', authenticateStudent, requireActiveAccount, authV2Controller.addExtraClass);
router.delete('/profile/attendance/history/extra/:attendanceId', authenticateStudent, requireActiveAccount, authV2Controller.deleteExtraClass);

// Phase 5 V2 Attendance Routes (Dynamic Attendance Engine)
router.get('/profile/attendance', authenticateStudent, requireActiveAccount, authV2Controller.getAttendanceDashboardV2);
router.get('/profile/attendance/analytics', authenticateStudent, requireActiveAccount, authV2Controller.getAttendanceAnalyticsV2);
router.get('/profile/attendance/today', authenticateStudent, requireActiveAccount, authV2Controller.getTodayAttendance);
router.get('/profile/attendance/subject/:subjectId', authenticateStudent, requireActiveAccount, authV2Controller.getSubjectAttendanceDetailV2);
router.put('/profile/attendance/entry', authenticateStudent, requireActiveAccount, authV2Controller.updateAttendanceHistoryV2);
router.put('/profile/attendance/target', authenticateStudent, requireActiveAccount, authV2Controller.updateAttendanceTarget);
router.put('/profile/attendance/baseline', authenticateStudent, requireActiveAccount, authV2Controller.saveBaselineAttendance);
router.post('/profile/attendance/extra-class', authenticateStudent, requireActiveAccount, authV2Controller.addExtraClassV2);
router.delete('/profile/attendance/extra-class/:historyId', authenticateStudent, requireActiveAccount, authV2Controller.deleteExtraClassV2);
router.post('/profile/attendance/promote', authenticateStudent, requireActiveAccount, authV2Controller.promoteSemesterV2);
router.get('/profile/attendance/export', authenticateStudent, requireActiveAccount, authV2Controller.exportSemesterReportV2);
router.post('/profile/attendance/recalculate', authenticateStudent, requireActiveAccount, authV2Controller.recalculateAllAttendanceV2);

// Phase 6 – Academic Events CRUD routes
router.get('/profile/events', authenticateStudent, requireActiveAccount, authV2Controller.getAcademicEvents);
router.post('/profile/events', authenticateStudent, requireActiveAccount, authV2Controller.createAcademicEvent);
router.put('/profile/events/:id', authenticateStudent, requireActiveAccount, authV2Controller.updateAcademicEvent);
router.delete('/profile/events/:id', authenticateStudent, requireActiveAccount, authV2Controller.deleteAcademicEvent);

// CIE Analyzer Routes
router.get('/profile/cie', authenticateStudent, requireActiveAccount, (req, res) => authV2Controller.getCieDashboard(req, res));
router.put('/profile/cie', authenticateStudent, requireActiveAccount, (req, res) => authV2Controller.saveCieRecord(req, res));

// SGPA Calculator Routes
router.get('/profile/sgpa', authenticateStudent, requireActiveAccount, (req, res) => authV2Controller.getSgpaDashboard(req, res));
router.put('/profile/sgpa', authenticateStudent, requireActiveAccount, (req, res) => authV2Controller.saveSgpaRecord(req, res));

// Academic Summary Route
router.get('/profile/academic-summary', authenticateStudent, requireActiveAccount, (req, res) => authV2Controller.getAcademicSummary(req, res));

module.exports = router;
