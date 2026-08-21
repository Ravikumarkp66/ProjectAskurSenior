const express = require('express');
const router = express.Router();
const academicController = require('./academic.controller');
const authMiddleware = require('../../middleware/auth');

// All routes here are prefixed with /api/academic (configured in server.js)

// POST /api/academic/setup
router.post('/setup', authMiddleware, academicController.saveSetup);

// POST /api/academic/subjects
router.post('/subjects', authMiddleware, academicController.saveSubjects);

// POST /api/academic/timetable
router.post('/timetable', authMiddleware, academicController.saveTimetable);

// POST /api/academic/finalize-setup
router.post('/finalize-setup', authMiddleware, academicController.finalizeSetup);

// DELETE /api/academic/reset-setup
router.delete('/reset-setup', authMiddleware, academicController.deleteSetup);

// GET /api/academic/dashboard
router.get('/dashboard', authMiddleware, academicController.getDashboard);

// Daily Tasks
router.get('/daily-tasks', authMiddleware, academicController.getDailyTasks);
router.post('/daily-tasks', authMiddleware, academicController.saveDailyTasks);

// Academic Events (Manual)
router.get('/academic-events', authMiddleware, academicController.getAcademicEvents);
router.post('/academic-events', authMiddleware, academicController.saveAcademicEvent);
router.delete('/academic-events/:id', authMiddleware, academicController.deleteAcademicEvent);

// Academic Calendar Events (Global/State/National/College)
router.get('/calendar', authMiddleware, academicController.getCalendarEvents);

// Admin Trigger
router.post('/trigger-whatsapp', authMiddleware, academicController.triggerWhatsApp);

// Mark Attendance
router.post('/mark-attendance', authMiddleware, academicController.markAttendance);

// Timetable Override
router.post('/timetable-override', authMiddleware, academicController.addTimetableOverride);

// Undo Attendance
router.post('/undo-attendance', authMiddleware, academicController.undoAttendance);

module.exports = router;
