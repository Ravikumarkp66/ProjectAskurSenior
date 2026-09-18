/**
 * Detailed Audit Investigation Script (100% READ-ONLY)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function detailedAudit() {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    console.log('==================================================');
    console.log('1. INVESTIGATING student_timetables (100 DOCS)');
    console.log('==================================================\n');

    const studentTt = await db.collection('student_timetables').find().toArray();
    const studentsWithTt = new Set(studentTt.map(s => String(s.student)));
    console.log(`Unique student IDs in student_timetables: ${studentsWithTt.size}`);

    for (const sId of studentsWithTt) {
        const studentDoc = await db.collection('student_accounts').findOne({ _id: new mongoose.Types.ObjectId(sId) })
            || await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(sId) });
        const count = studentTt.filter(s => String(s.student) === sId).length;
        const semesters = [...new Set(studentTt.filter(s => String(s.student) === sId).map(s => s.semester))];
        console.log(`Student ID: ${sId} | Name: ${studentDoc?.name || 'N/A'} | USN: ${studentDoc?.usn || studentDoc?.username || 'N/A'} | Section: ${studentDoc?.section || 'N/A'} | Doc Count: ${count} | Semesters: ${semesters.join(', ')}`);
    }

    console.log('\n==================================================');
    console.log('2. INVESTIGATING student_expected_schedules (1 DOC)');
    console.log('==================================================\n');

    const expectedSchedules = await db.collection('student_expected_schedules').find().toArray();
    for (const exp of expectedSchedules) {
        const studentDoc = await db.collection('student_accounts').findOne({ _id: new mongoose.Types.ObjectId(exp.student) })
            || await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(exp.student) });
        console.log(`Expected Schedule ID: ${exp._id} | Student: ${exp.student} (${studentDoc?.name} - ${studentDoc?.usn}) | Semester: ${exp.semester} | Total Classes Generated: ${exp.classes?.length} | Date Range: ${exp.classes?.[0]?.date} to ${exp.classes?.[exp.classes.length - 1]?.date}`);
    }

    console.log('\n==================================================');
    console.log('3. INVESTIGATING academictimetables (4 DOCS) & timetableoverrides (1 DOC)');
    console.log('==================================================\n');

    const legacyTt = await db.collection('academictimetables').find().toArray();
    for (const lt of legacyTt) {
        const userDoc = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(lt.userId) })
            || await db.collection('student_accounts').findOne({ _id: new mongoose.Types.ObjectId(lt.userId) });
        console.log(`Legacy Timetable ID: ${lt._id} | User: ${lt.userId} (${userDoc?.name} - ${userDoc?.email}) | Created: ${lt.createdAt}`);
    }

    const legacyOverrides = await db.collection('timetableoverrides').find().toArray();
    for (const lo of legacyOverrides) {
        const userDoc = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(lo.userId) });
        console.log(`Legacy Override ID: ${lo._id} | User: ${lo.userId} (${userDoc?.name}) | Date: ${lo.date} | Subject: ${lo.newSubjectName}`);
    }

    console.log('\n==================================================');
    console.log('4. INVESTIGATING student_attendance_entries (213 DOCS)');
    console.log('==================================================\n');

    const attEntries = await db.collection('student_attendance_entries').find().toArray();
    const studentsWithAtt = new Set(attEntries.map(e => String(e.student)));
    console.log(`Unique student IDs in student_attendance_entries: ${studentsWithAtt.size}`);

    for (const sId of studentsWithAtt) {
        const studentDoc = await db.collection('student_accounts').findOne({ _id: new mongoose.Types.ObjectId(sId) })
            || await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(sId) });
        const entries = attEntries.filter(e => String(e.student) === sId);
        const statuses = {};
        entries.forEach(e => { statuses[e.status] = (statuses[e.status] || 0) + 1; });
        console.log(`Student ID: ${sId} | Name: ${studentDoc?.name} | USN: ${studentDoc?.usn} | Total Entries: ${entries.length} | Statuses: ${JSON.stringify(statuses)}`);
    }

    console.log('\n==================================================');
    console.log('5. INVESTIGATING 18 SectionTimetable RECORDS INTEGRITY');
    console.log('==================================================\n');

    const sectionTt = await db.collection('section_timetables').find().toArray();
    const sections = await db.collection('academic_sections').find().toArray();
    const subjects = await db.collection('academic_subjects').find().toArray();
    const faculties = await db.collection('faculties').find().toArray();

    const secMap = new Map(sections.map(s => [String(s._id), s]));
    const subjMap = new Map(subjects.map(s => [String(s._id), s]));
    const facMap = new Map(faculties.map(f => [String(f._id), f]));

    let totalSlots = 0;
    let missingSubjectSlots = 0;
    let missingFacultySlots = 0;
    const sectionTimetableDetails = [];

    for (const st of sectionTt) {
        const sec = secMap.get(String(st.section));
        const slots = st.slots || [];
        totalSlots += slots.length;

        for (const slot of slots) {
            if (slot.subject && !subjMap.has(String(slot.subject))) missingSubjectSlots++;
            if (slot.faculty && !facMap.has(String(slot.faculty))) missingFacultySlots++;
        }

        sectionTimetableDetails.push({
            section: sec?.name,
            sectionId: String(st.section),
            status: st.status,
            slotsCount: slots.length,
            batch: st.batch,
            semesterNumber: st.semesterNumber
        });
    }

    sectionTimetableDetails.sort((a, b) => a.section.localeCompare(b.section));
    console.log('18 SectionTimetables breakdown:');
    console.table(sectionTimetableDetails);
    console.log(`Total weekly slots across all 18 sections: ${totalSlots}`);
    console.log(`Missing subject references: ${missingSubjectSlots}`);
    console.log(`Missing faculty references: ${missingFacultySlots}`);

    console.log('\n==================================================');
    console.log('6. INVESTIGATING student_timetable_configurations (10 DOCS)');
    console.log('==================================================\n');

    const configs = await db.collection('student_timetable_configurations').find().toArray();
    for (const cfg of configs) {
        const studentDoc = await db.collection('student_accounts').findOne({ _id: new mongoose.Types.ObjectId(cfg.student) })
            || await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(cfg.student) });
        console.log(`Config ID: ${cfg._id} | Student: ${cfg.student} (${studentDoc?.name} - ${studentDoc?.usn}) | Target: ${cfg.personalAttendanceTarget || cfg.attendanceThreshold} | SemStartDate: ${cfg.semesterStartDate} | LastWorkingDate: ${cfg.lastWorkingDate}`);
    }

    await mongoose.disconnect();
    console.log('\nDetailed investigation completed.');
}

detailedAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
