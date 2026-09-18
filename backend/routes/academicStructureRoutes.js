const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requirePermission } = require('../middleware/adminAuth');
const { requireScope } = require('../middleware/scopeAuthorization');

const College = require('../models/College');
const AcademicProgram = require('../models/AcademicProgram');
const Branch = require('../models/Branch');
const Scheme = require('../models/Scheme');
const AcademicBatch = require('../models/AcademicBatch');
const Semester = require('../models/Semester');
const AcademicSection = require('../models/AcademicSection');

const controller = require('../controllers/academicStructureController');

// Standard middleware stack for all academic structure routes
router.use(authMiddleware, requireAdmin);

// ==========================================
// 1. COLLEGES
// ==========================================
router.get('/colleges', controller.listColleges);
router.get('/college/primary', controller.getPrimaryCollege);

router.get('/colleges/:id',
    requireScope({
        module: 'academic_structure',
        action: 'view',
        getTargetContext: (req) => ({ collegeId: req.params.id })
    }),
    controller.getCollegeById
);

// Only Super Admin can create or delete entire colleges
router.post('/colleges', requireSuperAdmin, controller.createCollege);

router.put('/colleges/:id',
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: (req) => ({ collegeId: req.params.id })
    }),
    controller.updateCollege
);

router.delete('/colleges/:id', requireSuperAdmin, controller.deleteCollege);

// ==========================================
// 2. SCHEMES
// ==========================================
router.get('/schemes', controller.listSchemes);

router.post('/schemes',
    requirePermission('academic_structure.create'),
    requireScope({
        module: 'academic_structure',
        action: 'create',
        getTargetContext: (req) => ({ collegeId: req.body.collegeId })
    }),
    controller.createScheme
);

router.put('/schemes/:id',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const scheme = await Scheme.findById(req.params.id);
            return scheme ? { collegeId: scheme.college } : null;
        }
    }),
    controller.updateScheme
);

router.delete('/schemes/:id',
    requirePermission('academic_structure.delete'),
    requireScope({
        module: 'academic_structure',
        action: 'delete',
        getTargetContext: async (req) => {
            const scheme = await Scheme.findById(req.params.id);
            return scheme ? { collegeId: scheme.college } : null;
        }
    }),
    controller.deleteScheme
);

// ==========================================
// 3. PROGRAMS & BRANCHES
// ==========================================
router.get('/programs', controller.listPrograms);

router.post('/programs',
    requirePermission('academic_structure.create'),
    requireScope({
        module: 'academic_structure',
        action: 'create',
        getTargetContext: (req) => ({ collegeId: req.body.collegeId })
    }),
    controller.createProgram
);

router.put('/programs/:id',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const prog = await AcademicProgram.findById(req.params.id);
            return prog ? { collegeId: prog.college, programId: prog._id } : null;
        }
    }),
    controller.updateProgram
);

router.delete('/programs/:id',
    requirePermission('academic_structure.delete'),
    requireScope({
        module: 'academic_structure',
        action: 'delete',
        getTargetContext: async (req) => {
            const prog = await AcademicProgram.findById(req.params.id);
            return prog ? { collegeId: prog.college, programId: prog._id } : null;
        }
    }),
    controller.deleteProgram
);

router.get('/branches', controller.listBranches);

router.post('/branches',
    requirePermission('academic_structure.create'),
    requireScope({
        module: 'academic_structure',
        action: 'create',
        getTargetContext: (req) => ({ collegeId: req.body.collegeId, programId: req.body.programId })
    }),
    controller.createBranch
);

// ==========================================
// 4. BATCHES
// ==========================================
router.get('/batches', controller.listBatches);

router.post('/batches',
    requirePermission('academic_structure.create'),
    requireScope({
        module: 'academic_structure',
        action: 'create',
        getTargetContext: async (req) => {
            let collegeId = req.body.collegeId;
            if (!collegeId) {
                const College = require('../models/College');
                const sit = await College.findOne({ code: 'SIT' });
                collegeId = sit ? sit._id : null;
            }
            return {
                collegeId,
                programId: req.body.programId,
                branchId: req.body.branchId
            };
        }
    }),
    controller.createBatch
);

router.put('/batches/:id',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const batch = await AcademicBatch.findById(req.params.id);
            return batch ? {
                collegeId: batch.college,
                programId: batch.program,
                branchId: batch.branch,
                batchId: batch._id
            } : null;
        }
    }),
    controller.updateBatch
);

router.delete('/batches/:id',
    requirePermission('academic_structure.delete'),
    requireScope({
        module: 'academic_structure',
        action: 'delete',
        getTargetContext: async (req) => {
            const batch = await AcademicBatch.findById(req.params.id);
            return batch ? {
                collegeId: batch.college,
                programId: batch.program,
                branchId: batch.branch,
                batchId: batch._id
            } : null;
        }
    }),
    controller.deleteBatch
);

// ==========================================
// 5. SEMESTERS (ADMIN BASELINE DATES)
// ==========================================
router.get('/semesters', controller.listSemesters);

router.post('/semesters',
    requirePermission('semesters.create'),
    requireScope({
        module: 'semesters',
        action: 'create',
        getTargetContext: async (req) => {
            let collegeId = req.body.collegeId;
            let programId = req.body.programId;
            if ((!collegeId || !programId) && req.body.batchId) {
                const batch = await AcademicBatch.findById(req.body.batchId);
                if (batch) {
                    collegeId = collegeId || batch.college;
                    programId = programId || batch.program;
                }
            }
            return {
                collegeId,
                programId,
                batchId: req.body.batchId,
                semester: req.body.number ? Number(req.body.number) : undefined
            };
        }
    }),
    controller.createSemester
);

router.put('/semesters/:id',
    requirePermission('semesters.update'),
    requireScope({
        module: 'semesters',
        action: 'update',
        getTargetContext: async (req) => {
            const sem = await Semester.findById(req.params.id);
            return sem ? {
                collegeId: sem.college,
                programId: sem.program,
                batchId: sem.batch,
                semester: sem.number
            } : null;
        }
    }),
    controller.updateSemester
);

router.delete('/semesters/:id',
    requirePermission('semesters.finalize'),
    requireScope({
        module: 'semesters',
        action: 'finalize',
        getTargetContext: async (req) => {
            const sem = await Semester.findById(req.params.id);
            return sem ? {
                collegeId: sem.college,
                programId: sem.program,
                batchId: sem.batch,
                semester: sem.number
            } : null;
        }
    }),
    controller.deleteSemester
);

// ==========================================
// 6. SECTIONS
// ==========================================
router.get('/sections', controller.listSections);

router.post('/sections',
    requirePermission('academic_structure.create'),
    requireScope({
        module: 'academic_structure',
        action: 'create',
        getTargetContext: async (req) => {
            let collegeId = req.body.collegeId;
            let programId = req.body.programId;
            if ((!collegeId || !programId) && req.body.batchId) {
                const batch = await AcademicBatch.findById(req.body.batchId);
                if (batch) {
                    collegeId = collegeId || batch.college;
                    programId = programId || batch.program;
                }
            }
            return {
                collegeId,
                programId,
                branchId: req.body.branchId,
                batchId: req.body.batchId,
                semester: req.body.semester ? Number(req.body.semester) : undefined
            };
        }
    }),
    controller.createSection
);

router.put('/sections/:id',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.id);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    controller.updateSection
);

router.delete('/sections/:id',
    requirePermission('academic_structure.delete'),
    requireScope({
        module: 'academic_structure',
        action: 'delete',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.id);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    controller.deleteSection
);

// ==========================================
// 7. ADMIN SCOPES MANAGEMENT (SUPER ADMIN)
// ==========================================
router.get('/admins/:adminId/scopes', controller.getAdminScopes);
router.post('/admins/:adminId/scopes', requireSuperAdmin, controller.assignAdminScope);
router.delete('/admins/:adminId/scopes/:scopeId', requireSuperAdmin, controller.removeAdminScope);

// ==========================================
// 8. ACADEMIC CALENDAR (HOLIDAYS & EVENTS)
// ==========================================
const calendarController = require('../controllers/academicCalendarController');

router.get('/calendar-items', requirePermission('events.view'), calendarController.listCalendarItems);
router.post('/calendar-items/sync-government-holidays', requirePermission('events.create'), calendarController.syncGovernmentHolidays);
router.get('/calendar-items/:id', requirePermission('events.view'), calendarController.getCalendarItemById);
router.post('/calendar-items', requirePermission('events.create'), calendarController.createCalendarItem);
router.put('/calendar-items/:id', requirePermission('events.update'), calendarController.updateCalendarItem);
router.delete('/calendar-items/:id', requirePermission('events.delete'), calendarController.deleteCalendarItem);

// ==========================================
// 8.5 INSTITUTIONAL TIMETABLE STRUCTURE (SUPER ADMIN AUTHORITY)
// ==========================================
const timetableStructureController = require('../controllers/timetableStructureController');

router.get('/timetable-structure', timetableStructureController.getTimetableStructure);
router.put('/timetable-structure', requireSuperAdmin, timetableStructureController.updateTimetableStructure);

// ==========================================
// 9. SECTION TIMETABLES (PERIOD-BASED)
// ==========================================
const timetableController = require('../controllers/sectionTimetableController');

router.get('/period-definitions', timetableController.getPeriodDefinitions);

router.get('/section-timetables/:sectionId',
    requireScope({
        module: 'academic_structure',
        action: 'view',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.sectionId);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    timetableController.getSectionTimetable
);

router.put('/section-timetables/:sectionId',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.sectionId);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    timetableController.updateSectionTimetable
);

router.post('/section-timetables/:sectionId/publish',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.sectionId);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    timetableController.publishSectionTimetable
);

router.post('/section-timetables/:sectionId/archive',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.sectionId);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    timetableController.archiveSectionTimetable
);

router.post('/section-timetables/:sectionId/reopen',
    requirePermission('academic_structure.update'),
    requireScope({
        module: 'academic_structure',
        action: 'update',
        getTargetContext: async (req) => {
            const sec = await AcademicSection.findById(req.params.sectionId);
            return sec ? {
                collegeId: sec.college,
                programId: sec.program,
                branchId: sec.branch,
                batchId: sec.batch,
                semester: sec.semester,
                sectionId: sec._id
            } : null;
        }
    }),
    timetableController.reopenSectionTimetable
);

// ==========================================
// 8. SECTION CHANGE REQUESTS
// ==========================================
router.get('/section-change-requests',
    requirePermission('academic_structure.view'),
    controller.listSectionChangeRequests
);

router.post('/section-change-requests/:id/approve',
    requirePermission('academic_structure.update'),
    controller.approveSectionChangeRequest
);

router.post('/section-change-requests/:id/reject',
    requirePermission('academic_structure.update'),
    controller.rejectSectionChangeRequest
);

// ==========================================
// 9. EVENTS (STEP 5)
// ==========================================
const eventController = require('../controllers/collegeEventController');

const requireEventPermission = (action) => {
    return (req, res, next) => {
        if (req.isSuperAdmin) return next();
        const perms = req.adminPermissions || {};
        if (perms.events?.[action] || perms.academic_structure?.[action] || perms.events?.manage) {
            return next();
        }
        return res.status(403).json({
            success: false,
            error: `Forbidden: You do not have 'events.${action}' permission to perform this action.`
        });
    };
};

router.get('/events', eventController.listEvents);
router.get('/events/:id', eventController.getEventById);

router.post('/events',
    requireEventPermission('create'),
    eventController.createEvent
);

router.put('/events/:id',
    requireEventPermission('update'),
    eventController.updateEvent
);

router.delete('/events/:id',
    requireEventPermission('delete'),
    eventController.deleteEvent
);

module.exports = router;


