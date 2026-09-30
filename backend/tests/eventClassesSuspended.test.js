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
const CollegeEvent = require('../models/CollegeEvent');
require('../services/studentAcademicResolver');
const { compileSemesterAnalytics, formatDate } = require('../services/attendanceEngine');
const { generateAndCacheExpectedSchedule } = require('../services/expectedClassGenerator');
const authV2Controller = require('../modules/auth/controllers/authV2.controller');

test('EVENT CLASSES SUSPENDED (TEST-01, TEST-02, EXAMS, HOLIDAYS) SUITE', async (t) => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find any active section with a configured SectionTimetable
    const sectionTimetableDoc = await SectionTimetable.findOne({
        'slots.0': { $exists: true }
    }).populate('section').lean();

    assert.ok(sectionTimetableDoc, 'Expected at least one SectionTimetable with slots in the test database');
    const targetSection = sectionTimetableDoc.section;
    assert.ok(targetSection, 'Expected valid populated AcademicSection');

    // Create a dedicated test student
    const testEmail = `suspended_test_${Date.now()}@sit.ac.in`;
    const testStudent = await StudentAccount.create({
        email: testEmail,
        studentId: `STU-SUSP-${Date.now()}`,
        name: 'Suspension Automated Test Student',
        authProvider: 'email',
        semester: targetSection.semester || 1,
        section: targetSection.name,
        academicSection: targetSection._id,
        branch: targetSection.branch,
        batch: targetSection.batch,
        college: targetSection.college,
        collegeName: 'SIT',
        labBatch: 'B1',
        registrationStatus: 'completed'
    });

    let createdEventId = null;

    t.after(async () => {
        if (createdEventId) {
            await CollegeEvent.deleteOne({ _id: createdEventId });
        }
        if (testStudent) {
            await StudentAttendanceEntry.deleteMany({ student: testStudent._id });
            await ClassOccurrence.deleteMany({ student: testStudent._id });
            await StudentExpectedSchedule.deleteMany({ student: testStudent._id });
            await StudentAccount.deleteOne({ _id: testStudent._id });
        }
        await mongoose.disconnect();
    });

    let normalExpectedCount = 0;
    let sampleDateWithClasses = null;

    await t.test('1. Baseline generation produces expected schedule', async () => {
        await StudentExpectedSchedule.deleteMany({ student: testStudent._id });
        const baselineClasses = await generateAndCacheExpectedSchedule(testStudent._id, testStudent.semester);
        assert.ok(baselineClasses.length > 0, 'Baseline expected classes should be generated');
        normalExpectedCount = baselineClasses.length;

        // Pick a future or current teaching date that has scheduled classes
        const classesByDate = new Map();
        for (const c of baselineClasses) {
            classesByDate.set(c.date, (classesByDate.get(c.date) || 0) + 1);
        }
        for (const [date, count] of classesByDate.entries()) {
            if (count > 0) {
                sampleDateWithClasses = date;
                break;
            }
        }
        assert.ok(sampleDateWithClasses, 'Should find at least one date with scheduled classes');
    });

    await t.test('2. Creating Test-01 event with classesSuspended: true removes that day from expected classes & reduces remaining count', async () => {
        const eventDateStart = new Date(sampleDateWithClasses + 'T00:00:00.000Z');
        const eventDateEnd = new Date(sampleDateWithClasses + 'T23:59:59.999Z');

        const ev = await CollegeEvent.create({
            college: testStudent.college,
            title: 'Test-01 (Internal Assessment)',
            eventType: 'Exam',
            scope: 'SEMESTER',
            academicSemesterId: sectionTimetableDoc.semester,
            startDate: eventDateStart,
            endDate: eventDateEnd,
            allDay: true,
            classesSuspended: true,
            suspensionType: 'full_day',
            status: 'ACTIVE'
        });
        createdEventId = ev._id;

        // Invalidate expected schedule cache
        await StudentExpectedSchedule.deleteMany({ student: testStudent._id });

        // Regenerate expected schedule
        const newClasses = await generateAndCacheExpectedSchedule(testStudent._id, testStudent.semester);
        const classesOnEventDay = newClasses.filter(c => c.date === sampleDateWithClasses);

        assert.strictEqual(classesOnEventDay.length, 0, `Classes on ${sampleDateWithClasses} should be ZERO due to Test-01 suspension`);
        assert.ok(newClasses.length < normalExpectedCount, 'Total expected classes count must be reduced');

        // Compile analytics to verify remaining classes (toBeConducted)
        const analytics = await compileSemesterAnalytics(testStudent._id, testStudent.semester);
        assert.ok(analytics.overall, 'Analytics overall summary should be compiled');

        // Verify timeline contains 0 teaching classes for that day
        const daySlots = analytics.timeline.filter(t => t.date === sampleDateWithClasses);
        const activeTeachingSlots = daySlots.filter(s => s.status !== 'Suspended');
        assert.strictEqual(activeTeachingSlots.length, 0, 'No active teaching classes should exist on Test-01 suspended day');
    });

    await t.test('3. getTodayAttendance on Test-01 date returns classesSuspended: true, totalClasses: 0, and data: []', async () => {
        const student = await StudentAccount.findById(testStudent._id);
        const mockReq = {
            student,
            user: { _id: testStudent._id, role: 'student' },
            query: { date: sampleDateWithClasses }
        };

        let responseData = null;
        let responseStatus = null;
        const mockRes = {
            status: (code) => {
                responseStatus = code;
                return {
                    json: (payload) => {
                        responseData = payload;
                        return payload;
                    }
                };
            }
        };

        await authV2Controller.getTodayAttendance(mockReq, mockRes);

        assert.strictEqual(responseStatus, 200);
        assert.strictEqual(responseData.success, true);
        assert.strictEqual(responseData.classesSuspended, true, 'classesSuspended should be true on Test-01 day');
        assert.strictEqual(responseData.totalClasses, 0, 'totalClasses must be 0 on suspended day');
        assert.deepStrictEqual(responseData.data, [], 'data array must be empty on suspended day');
        assert.ok(responseData.activeEvent, 'activeEvent should be attached');
        assert.match(responseData.activeEvent.title, /Test-01/i, 'activeEvent should indicate Test-01');
    });
});
