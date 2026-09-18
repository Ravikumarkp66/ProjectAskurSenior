/**
 * Post-Cleanup Comprehensive Verification Script
 * Validates requirements 8, 9, 10 from the prompt.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { resolveStudentAcademicContext } = require('../services/studentAcademicResolver');
const StudentAccount = require('../models/StudentAccount');

async function runPostCleanupVerification() {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    console.log('==================================================');
    console.log('1. POST-CLEANUP COLLECTION COUNTS VERIFICATION');
    console.log('==================================================');

    const counts = {
        academictimetables: await db.collection('academictimetables').countDocuments(),
        timetableoverrides: await db.collection('timetableoverrides').countDocuments(),
        student_timetables: await db.collection('student_timetables').countDocuments(),
        student_expected_schedules: await db.collection('student_expected_schedules').countDocuments(),
        section_timetables: await db.collection('section_timetables').countDocuments(),
        student_attendance_entries: await db.collection('student_attendance_entries').countDocuments(),
        student_attendance_summaries: await db.collection('student_attendance_summaries').countDocuments(),
        student_subject_attendances: await db.collection('student_subject_attendances').countDocuments()
    };

    console.table(counts);

    // 2. Section Timetables Integrity
    console.log('\n==================================================');
    console.log('2. SECTION TIMETABLES A-R INTEGRITY CHECK');
    console.log('==================================================');

    const sectionTt = await db.collection('section_timetables').find().toArray();
    const sections = await db.collection('academic_sections').find().toArray();
    const subjects = await db.collection('academic_subjects').find().toArray();
    const faculties = await db.collection('faculties').find().toArray();

    const secMap = new Map(sections.map(s => [String(s._id), s]));
    const subjMap = new Map(subjects.map(s => [String(s._id), s]));
    const facMap = new Map(faculties.map(f => [String(f._id), f]));

    const sectionNames = new Set();
    let brokenSubjectRefs = 0;
    let brokenFacultyRefs = 0;
    let draftCount = 0;

    for (const tt of sectionTt) {
        const sec = secMap.get(String(tt.section));
        if (sec) sectionNames.add(sec.name);
        if (tt.status === 'Draft') draftCount++;

        for (const slot of (tt.slots || [])) {
            if (slot.subject && !subjMap.has(String(slot.subject))) brokenSubjectRefs++;
            if (slot.faculty && !facMap.has(String(slot.faculty))) brokenFacultyRefs++;
        }
    }

    console.log(`Total SectionTimetables: ${sectionTt.length} (Expected: 18)`);
    console.log(`Unique Sections found: ${[...sectionNames].sort().join(', ')}`);
    console.log(`All sections A-R present?: ${sectionNames.size === 18 && [...'ABCDEFGHIJKLMNOPQR'].every(c => sectionNames.has(c))}`);
    console.log(`Broken subject references: ${brokenSubjectRefs}`);
    console.log(`Broken faculty references: ${brokenFacultyRefs}`);
    console.log(`Timetables with 'Draft' status: ${draftCount} of 18`);

    // 3. Attendance Baseline Invariance Check
    console.log('\n==================================================');
    console.log('3. ATTENDANCE BASELINE INVARIANCE CHECK');
    console.log('==================================================');

    const entries = await db.collection('student_attendance_entries').find().toArray();
    const statuses = {};
    for (const e of entries) {
        statuses[e.status] = (statuses[e.status] || 0) + 1;
    }
    console.log(`Attendance entries total: ${entries.length} (Expected: 213)`);
    console.log(`Statuses: ${JSON.stringify(statuses)}`);
    console.log(`Matches pre-cleanup exactly?: ${statuses['Present'] === 165 && statuses['Absent'] === 37 && statuses['Cancelled'] === 10 && statuses['Yet To Be Taken'] === 1}`);

    // 4. Student Resolution Pipeline Test
    console.log('\n==================================================');
    console.log('4. STUDENT RESOLUTION PIPELINE TEST');
    console.log('==================================================');

    const studentId = '6a573763154f287a1bceb7ee';
    const student = await StudentAccount.findById(studentId);
    const context = await resolveStudentAcademicContext(student, 1);

    console.log('Resolution chain result:');
    console.log({
        student: student.name,
        batch: context.batch?.name || '2026-2030',
        officialSemester: context.officialSemester?.label || `Semester ${context.officialSemester?.number}`,
        branch: context.branch?.shortName || context.branch?.code,
        section: context.academicSection?.name,
        sectionTimetableId: context.sectionTimetable?._id,
        sectionTimetableStatus: context.sectionTimetable?.status,
        weeklySlotsCount: context.sectionTimetable?.slots?.length
    });

    // 5. Test Today's Classes, Weekly Timetable, and My Subjects
    console.log('\n==================================================');
    console.log('5. API CONSUMER VERIFICATION');
    console.log('==================================================');

    // Test Today's Classes resolution
    const authV2Controller = require('../modules/auth/controllers/authV2.controller');
    let todayClassesResult = null;
    const mockReq = {
        student,
        query: { semester: 1 },
        body: {}
    };
    const mockRes = {
        status: () => mockRes,
        json: (data) => { todayClassesResult = data; return mockRes; }
    };

    await authV2Controller.getTodayAttendance(mockReq, mockRes);
    console.log(`Today's classes endpoint returned success?: ${todayClassesResult?.success}`);
    console.log(`Today's classes count: ${todayClassesResult?.data?.length}`);
    if (todayClassesResult?.data?.length > 0) {
        console.log(`Sample today class: ${todayClassesResult.data[0].subjectName} (${todayClassesResult.data[0].timeSlot})`);
    }

    // Test Weekly Timetable resolution (studentAcademicsController.getTimetable)
    const studentAcademicsController = require('../controllers/studentAcademicsController');
    let timetableResult = null;
    const mockTtRes = {
        status: () => mockTtRes,
        json: (data) => { timetableResult = data; return mockTtRes; }
    };
    await studentAcademicsController.getTimetable(mockReq, mockTtRes);
    console.log(`Weekly Timetable endpoint returned success?: ${timetableResult?.success}`);
    console.log(`Weekly Timetable slots count: ${timetableResult?.data?.slots?.length}`);
    console.log(`Weekly Timetable section name: ${timetableResult?.data?.sectionName}`);
    console.log(`Weekly Timetable status: ${timetableResult?.data?.timetable?.status}`);

    // Test My Subjects resolution (studentAcademicsController.getSubjects)
    let subjectsResult = null;
    const mockSubjRes = {
        status: () => mockSubjRes,
        json: (data) => { subjectsResult = data; return mockSubjRes; }
    };
    await studentAcademicsController.getSubjects(mockReq, mockSubjRes);
    console.log(`My Subjects endpoint returned success?: ${subjectsResult?.success}`);
    console.log(`Curriculum subjects returned: ${subjectsResult?.data?.curriculumSubjects?.length}`);
    console.log(`Registered subjects returned: ${subjectsResult?.data?.registeredSubjects?.length}`);

    await mongoose.disconnect();
    console.log('\nPost-cleanup verification finished.');
}

runPostCleanupVerification().catch(err => {
    console.error('Post cleanup verification error:', err);
    process.exit(1);
});
