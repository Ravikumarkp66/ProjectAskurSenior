const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/AskUrSenior/backend/.env' });

const StudentAccount = require('../models/StudentAccount');
const AcademicSection = require('../models/AcademicSection');
const { SectionTimetable } = require('../models/SectionTimetable');
const StudentAttendanceEntry = require('../models/StudentAttendanceEntry');
const ClassOccurrence = require('../models/ClassOccurrence');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const { compileSemesterAnalytics } = require('../services/attendanceEngine');
const { generateAndCacheExpectedSchedule } = require('../services/expectedClassGenerator');
const { resolveStudentSubjects } = require('../services/studentSubjectResolver');
const authV2Controller = require('../modules/auth/controllers/authV2.controller');

test('F-02 ATTENDANCE PERSONALIZATION FRESH SUITE', async (t) => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find any active section with a configured SectionTimetable
    const sectionTimetableDoc = await SectionTimetable.findOne({
        'slots.0': { $exists: true }
    }).populate('section').lean();

    assert.ok(sectionTimetableDoc, 'Expected at least one SectionTimetable with slots in the test database');
    const targetSection = sectionTimetableDoc.section;
    assert.ok(targetSection, 'Expected valid populated AcademicSection');

    // Dynamically find or create a test student (no hard-coded email)
    const testEmail = `f02_test_${Date.now()}@sit.ac.in`;
    const testStudent = await StudentAccount.create({
        email: testEmail,
        studentId: `STU-TEST-${Date.now()}`,
        name: 'F02 Automated Test Student',
        authProvider: 'email',
        semester: targetSection.semester || 1,
        section: targetSection.name,
        academicSection: targetSection._id,
        branch: targetSection.branch,
        batch: targetSection.batch,
        college: targetSection.college,
        labBatch: 'B1',
        registrationStatus: 'completed'
    });

    t.after(async () => {
        if (testStudent) {
            await StudentAttendanceEntry.deleteMany({ student: testStudent._id });
            await ClassOccurrence.deleteMany({ student: testStudent._id });
            await StudentExpectedSchedule.deleteMany({ student: testStudent._id });
            await StudentAccount.deleteOne({ _id: testStudent._id });
        }
        await mongoose.disconnect();
    });

    await t.test('1. Fresh Attendance starts at 0 conducted / Not Started', async () => {
        const analytics = await compileSemesterAnalytics(testStudent._id, testStudent.semester);
        assert.equal(analytics.overall.conducted, 0, 'Initial conducted should be 0');
        assert.equal(analytics.overall.present, 0, 'Initial present should be 0');
        assert.equal(analytics.overall.absent, 0, 'Initial absent should be 0');
        assert.equal(analytics.overall.attendance, null, 'Initial attendance % should be null (Not Started)');
        assert.equal(analytics.overall.statusCategory, 'NOT_STARTED', 'Status category should be NOT_STARTED');
    });

    await t.test('2. Subjects are derived directly from SectionTimetable without StudentRegisteredSubject', async () => {
        const regCount = await StudentRegisteredSubject.countDocuments({ student: testStudent._id });
        assert.equal(regCount, 0, 'Test student should have 0 StudentRegisteredSubject records');

        const analytics = await compileSemesterAnalytics(testStudent._id, testStudent.semester);
        assert.ok(analytics.subjects.length > 0, 'Subjects should be populated directly from SectionTimetable');
        
        const timetableSubjectIds = new Set(
            sectionTimetableDoc.slots
                .filter(s => s.batchGroup === 'ALL' || s.batchGroup === 'B1')
                .map(s => s.subject?.toString())
                .filter(Boolean)
        );

        const analyticsSubjectIds = new Set(analytics.subjects.map(s => s.subjectId?.toString()));
        for (const subjId of timetableSubjectIds) {
            assert.ok(analyticsSubjectIds.has(subjId), `Subject ${subjId} from SectionTimetable must appear in attendance analytics`);
        }
    });

    await t.test('3. Lab Batch filtering: B1 student sees ALL + B1 slots only', async () => {
        const todayReq = {
            student: testStudent,
            query: {
                semester: testStudent.semester,
                date: '2026-09-22'
            }
        };

        let responseData = null;
        const resMock = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(payload) { responseData = payload; return payload; }
        };

        await authV2Controller.getTodayAttendance(todayReq, resMock);
        assert.ok(responseData && responseData.success, 'getTodayAttendance should succeed');

        const daySlots = responseData.data || [];
        for (const slot of daySlots) {
            const matchedTimetableSlots = sectionTimetableDoc.slots.filter(s => 
                s.subject?.toString() === slot.subjectId?.toString() && s.timeSlot === slot.timeSlot
            );
            for (const ts of matchedTimetableSlots) {
                assert.notEqual(ts.batchGroup, 'B2', 'B1 student must NEVER receive B2 lab slots');
            }
        }
    });

    await t.test('4. Lab Batch filtering: B2 student sees ALL + B2 slots only', async () => {
        testStudent.labBatch = 'B2';
        await StudentAccount.updateOne({ _id: testStudent._id }, { labBatch: 'B2' });

        const todayReq = {
            student: testStudent,
            query: {
                semester: testStudent.semester,
                date: '2026-09-22'
            }
        };

        let responseData = null;
        const resMock = {
            status: function() { return this; },
            json: function(payload) { responseData = payload; return payload; }
        };

        await authV2Controller.getTodayAttendance(todayReq, resMock);
        assert.ok(responseData && responseData.success, 'getTodayAttendance should succeed');

        const daySlots = responseData.data || [];
        for (const slot of daySlots) {
            const matchedTimetableSlots = sectionTimetableDoc.slots.filter(s => 
                s.subject?.toString() === slot.subjectId?.toString() && s.timeSlot === slot.timeSlot
            );
            for (const ts of matchedTimetableSlots) {
                assert.notEqual(ts.batchGroup, 'B1', 'B2 student must NEVER receive B1 lab slots');
            }
        }

        testStudent.labBatch = 'B1';
        await StudentAccount.updateOne({ _id: testStudent._id }, { labBatch: 'B1' });
    });

    let testSlot = null;

    await t.test('5. Mark class as Present: creates occurrence and updates analytics to 100%', async () => {
        const todayReq = {
            student: testStudent,
            query: { semester: testStudent.semester, date: '2026-09-21' }
        };
        let responseData = null;
        const resMock = {
            status: function() { return this; },
            json: function(payload) { responseData = payload; return payload; }
        };
        await authV2Controller.getTodayAttendance(todayReq, resMock);
        assert.ok(responseData?.data?.length > 0, 'Expected at least one scheduled slot for testing');

        testSlot = responseData.data[0];

        const markReq = {
            student: testStudent,
            body: {
                subjectId: testSlot.subjectId,
                scheduledSubjectId: testSlot.scheduledSubjectId || testSlot.subjectId,
                date: '2026-09-21',
                timeSlot: testSlot.timeSlot,
                status: 'Present',
                allowFutureOverride: true
            }
        };

        let markResponse = null;
        const markResMock = {
            status: function() { return this; },
            json: function(payload) { markResponse = payload; return payload; }
        };

        await authV2Controller.updateAttendanceHistoryV2(markReq, markResMock);
        assert.ok(markResponse && markResponse.success, 'Marking attendance should return success: true');

        const occ = await ClassOccurrence.findOne({
            student: testStudent._id,
            semester: testStudent.semester,
            date: '2026-09-21',
            timeSlot: testSlot.timeSlot
        });
        assert.ok(occ, 'ClassOccurrence must be created in DB');
        assert.equal(occ.status, 'PRESENT', 'Status in ClassOccurrence should be PRESENT');

        const entry = await StudentAttendanceEntry.findOne({
            student: testStudent._id,
            semester: testStudent.semester,
            date: '2026-09-21',
            timeSlot: testSlot.timeSlot
        });
        assert.ok(entry, 'StudentAttendanceEntry must be created in DB');
        assert.equal(entry.status, 'Present', 'Status in StudentAttendanceEntry should be Present');

        const analytics = await compileSemesterAnalytics(testStudent._id, testStudent.semester);
        assert.equal(analytics.overall.conducted, 1, 'Conducted classes should now be 1');
        assert.equal(analytics.overall.present, 1, 'Present classes should now be 1');
        assert.equal(analytics.overall.absent, 0, 'Absent classes should be 0');
        assert.equal(analytics.overall.attendance, 100.0, 'Attendance % should now be 100%');
    });

    await t.test('6. Repeated mark on same slot: idempotent upsert without duplicate key error', async () => {
        const markReq = {
            student: testStudent,
            body: {
                subjectId: testSlot.subjectId,
                scheduledSubjectId: testSlot.scheduledSubjectId || testSlot.subjectId,
                date: '2026-09-21',
                timeSlot: testSlot.timeSlot,
                status: 'Present',
                allowFutureOverride: true
            }
        };
        let markResponse = null;
        const markResMock = {
            status: function() { return this; },
            json: function(payload) { markResponse = payload; return payload; }
        };

        await authV2Controller.updateAttendanceHistoryV2(markReq, markResMock);
        assert.ok(markResponse && markResponse.success, 'Idempotent mark should succeed');

        const occCount = await ClassOccurrence.countDocuments({
            student: testStudent._id,
            date: '2026-09-21'
        });
        assert.equal(occCount, 1, 'Should NOT create duplicate ClassOccurrence');
    });

    await t.test('7. Mark slot as Absent: updates percentage to 0%', async () => {
        const markReq = {
            student: testStudent,
            body: {
                subjectId: testSlot.subjectId,
                scheduledSubjectId: testSlot.scheduledSubjectId || testSlot.subjectId,
                date: '2026-09-21',
                timeSlot: testSlot.timeSlot,
                status: 'Absent',
                allowFutureOverride: true
            }
        };
        let markResponse = null;
        const markResMock = {
            status: function() { return this; },
            json: function(payload) { markResponse = payload; return payload; }
        };
        await authV2Controller.updateAttendanceHistoryV2(markReq, markResMock);
        assert.ok(markResponse && markResponse.success, 'Marking as Absent should succeed');

        const analytics = await compileSemesterAnalytics(testStudent._id, testStudent.semester);
        assert.equal(analytics.overall.conducted, 1, 'Conducted classes should be 1');
        assert.equal(analytics.overall.present, 0, 'Present classes should now be 0');
        assert.equal(analytics.overall.absent, 1, 'Absent classes should now be 1');
        assert.equal(analytics.overall.attendance, 0.0, 'Attendance % should now be 0%');
    });

    await t.test('8. Reset Day: removes today records and restores unmarked status', async () => {
        const resetReq = {
            student: testStudent,
            body: {
                date: '2026-09-21',
                resetDay: true
            }
        };
        let resetResponse = null;
        const resetResMock = {
            status: function() { return this; },
            json: function(payload) { resetResponse = payload; return payload; }
        };
        await authV2Controller.updateAttendanceHistoryV2(resetReq, resetResMock);
        assert.ok(resetResponse && resetResponse.success, 'Reset day should succeed');

        const occCount = await ClassOccurrence.countDocuments({
            student: testStudent._id,
            date: '2026-09-21'
        });
        assert.equal(occCount, 0, 'ClassOccurrence should be deleted after resetDay');

        const todayReq = {
            student: testStudent,
            query: { semester: testStudent.semester, date: '2026-09-21' }
        };
        let responseData = null;
        const resMock = {
            status: function() { return this; },
            json: function(payload) { responseData = payload; return payload; }
        };
        await authV2Controller.getTodayAttendance(todayReq, resMock);
        assert.ok(responseData?.data?.length > 0, 'Slots should still be returned from SectionTimetable');
        assert.equal(responseData.data[0].status, 'Yet To Be Taken', 'Reset slot must revert to Yet To Be Taken');
    });

    await t.test('9. Dates outside Commencement and Last Working Day return 0 classes with isOutsideSemester', async () => {
        // Date before Commencement (e.g. 2026-09-14)
        const beforeReq = {
            student: testStudent,
            query: { semester: testStudent.semester, date: '2026-09-14' }
        };
        let beforeRes = null;
        const beforeResMock = {
            status: function() { return this; },
            json: function(payload) { beforeRes = payload; return payload; }
        };
        await authV2Controller.getTodayAttendance(beforeReq, beforeResMock);
        assert.ok(beforeRes?.success, 'Should return success response');
        assert.equal(beforeRes.isOutsideSemester, true, 'isOutsideSemester should be true before commencement');
        assert.equal(beforeRes.data?.length, 0, 'data should be empty array before commencement');
        assert.match(beforeRes.message, /commence/i, 'Message should mention regular classes commencement');

        // Date after Last Working Day (e.g. 2026-12-28)
        const afterReq = {
            student: testStudent,
            query: { semester: testStudent.semester, date: '2026-12-28' }
        };
        let afterRes = null;
        const afterResMock = {
            status: function() { return this; },
            json: function(payload) { afterRes = payload; return payload; }
        };
        await authV2Controller.getTodayAttendance(afterReq, afterResMock);
        assert.ok(afterRes?.success, 'Should return success response');
        assert.equal(afterRes.isOutsideSemester, true, 'isOutsideSemester should be true after last working day');
        assert.equal(afterRes.data?.length, 0, 'data should be empty array after last working day');
        assert.match(afterRes.message, /Last working day/i, 'Message should mention last working day');
    });

    await t.test('10. Section switch invalidates StudentExpectedSchedule cache', async () => {
        await StudentExpectedSchedule.create({
            student: testStudent._id,
            semester: testStudent.semester,
            version: 1,
            classes: [{
                date: '2026-09-21',
                timeSlot: '08:00-08:50',
                subject: testSlot?.subjectId || testSlot?.subject?._id || targetSection._id,
                dayOfWeek: 1
            }]
        });

        const preCount = await StudentExpectedSchedule.countDocuments({ student: testStudent._id });
        assert.equal(preCount, 1, 'Pre-condition: cache exists');

        const studentAcademicsController = require('../controllers/studentAcademicsController');
        const anotherSection = await AcademicSection.findOne({
            batch: targetSection.batch,
            branch: targetSection.branch,
            semester: targetSection.semester,
            _id: { $ne: targetSection._id }
        }).lean();

        if (anotherSection) {
            const switchReq = {
                student: testStudent,
                body: { sectionId: anotherSection._id.toString() }
            };
            let switchRes = null;
            const switchResMock = {
                status: function() { return this; },
                json: function(payload) { switchRes = payload; return payload; }
            };

            await studentAcademicsController.updateSection(switchReq, switchResMock);
            assert.ok(switchRes && switchRes.success, 'updateSection should succeed');

            const postCount = await StudentExpectedSchedule.countDocuments({ student: testStudent._id });
            assert.equal(postCount, 0, 'StudentExpectedSchedule cache must be invalidated upon section switch');
        }
    });
});
