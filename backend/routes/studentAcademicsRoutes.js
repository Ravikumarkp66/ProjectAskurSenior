const express = require('express');
const router = express.Router();
const studentAcademicsController = require('../controllers/studentAcademicsController');
const {
    authenticateStudent,
    requireActiveAccount
} = require('../modules/auth/middlewares/authV2.middleware');

// All routes require authenticated and active student account
router.use(authenticateStudent, requireActiveAccount);

// 1. Overview
router.get('/overview', studentAcademicsController.getOverview);

// 2. Semesters (strictly past + current)
router.get('/semesters', studentAcademicsController.getSemesters);
router.get('/semesters/:semesterNumber', studentAcademicsController.getSemesterDetail);

// 3. Sections (within verified batch + branch)
router.get('/sections', studentAcademicsController.getAvailableSections);
router.put('/section', studentAcademicsController.updateSection);
router.post('/placement/confirm', studentAcademicsController.confirmPlacement);
router.post('/section-change-request', studentAcademicsController.requestSectionChange);
router.get('/section-change-request', studentAcademicsController.getStudentSectionChangeRequests);

// 4. Timetable (read-only projection from SectionTimetable & TimetableStructure)
router.get('/timetable', studentAcademicsController.getTimetable);

// 5. Subjects (authoritative curriculum for semester/branch + student registration)
router.get('/subjects', studentAcademicsController.getSubjects);
router.put('/registered-subjects', studentAcademicsController.saveRegisteredSubjects);

// 6. Settings (Admin Baseline read-only vs Student Personal Target editable)
router.get('/settings', studentAcademicsController.getSettings);
router.put('/settings', studentAcademicsController.updatePersonalSettings);

// 7. Academic Calendar & Roadmaps
router.get('/calendar', studentAcademicsController.getCalendar);
router.get('/roadmap', studentAcademicsController.getRoadmap);

module.exports = router;
