/**
 * Surgical Timetable Cleanup Execution Script
 * 
 * Strict safety rules:
 * - Verifies backup file exists and parsed before any deletion
 * - Deletes ONLY:
 *     - academictimetables (4 docs)
 *     - timetableoverrides (1 doc)
 *     - student_timetables (100 docs)
 *     - student_expected_schedules (1 doc)
 * - Leaves section_timetables completely UNMODIFIED (retains 'Draft' status)
 * - Leaves empty legacy collections untouched
 * - Verifies attendance integrity (213 entries, 9 summaries, 9 subject attendances)
 * - Regenerates fresh expected schedule from authoritative SectionTimetable
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { generateAndCacheExpectedSchedule } = require('../services/expectedClassGenerator');

async function runCleanup() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
    }

    // 1. Verify backup exists
    const backupDir = path.resolve(__dirname, '../backups');
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.startsWith('timetable_cleanup_') && f.endsWith('.json'));
    if (backupFiles.length === 0) {
        throw new Error('SAFETY HALT: No backup file found in backups/ directory!');
    }
    const latestBackup = path.join(backupDir, backupFiles.sort().reverse()[0]);
    console.log(`Using verified backup file: ${latestBackup}`);
    const backupData = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));

    const expectedCollections = ['academictimetables', 'timetableoverrides', 'student_timetables', 'student_expected_schedules'];
    for (const col of expectedCollections) {
        if (!backupData.collections[col]) {
            throw new Error(`SAFETY HALT: Collection ${col} missing from backup data!`);
        }
    }
    const totalBackedUp = Object.values(backupData.collections).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`Verified backup contains ${totalBackedUp} documents across 4 collections.`);
    if (totalBackedUp !== 106) {
        throw new Error(`SAFETY HALT: Backup document count is ${totalBackedUp}, expected exactly 106!`);
    }

    // 2. Connect to Database
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    // 3. Pre-deletion Verification
    const preAcademicTimetables = await db.collection('academictimetables').countDocuments();
    const preOverrides = await db.collection('timetableoverrides').countDocuments();
    const preStudentTt = await db.collection('student_timetables').countDocuments();
    const preExpected = await db.collection('student_expected_schedules').countDocuments();
    const preSectionTt = await db.collection('section_timetables').countDocuments();
    const preAttendanceEntries = await db.collection('student_attendance_entries').countDocuments();
    const preAttendanceSummaries = await db.collection('student_attendance_summaries').countDocuments();
    const preSubjectAttendances = await db.collection('student_subject_attendances').countDocuments();

    console.log('\n--- PRE-CLEANUP VERIFICATION ---');
    console.log(`academictimetables: ${preAcademicTimetables}`);
    console.log(`timetableoverrides: ${preOverrides}`);
    console.log(`student_timetables: ${preStudentTt}`);
    console.log(`student_expected_schedules: ${preExpected}`);
    console.log(`section_timetables: ${preSectionTt}`);
    console.log(`student_attendance_entries: ${preAttendanceEntries}`);
    console.log(`student_attendance_summaries: ${preAttendanceSummaries}`);
    console.log(`student_subject_attendances: ${preSubjectAttendances}`);

    if (preAttendanceEntries !== 213 || preAttendanceSummaries !== 9 || preSubjectAttendances !== 9) {
        throw new Error('SAFETY HALT: Pre-cleanup attendance counts do not match authoritative baseline!');
    }
    if (preSectionTt !== 18) {
        throw new Error(`SAFETY HALT: section_timetables count is ${preSectionTt}, expected exactly 18!`);
    }

    // 4. Execute Surgical Deletions
    console.log('\n--- EXECUTING DELETIONS ---');
    const delAcademic = await db.collection('academictimetables').deleteMany({});
    console.log(`Deleted ${delAcademic.deletedCount} documents from 'academictimetables'`);

    const delOverrides = await db.collection('timetableoverrides').deleteMany({});
    console.log(`Deleted ${delOverrides.deletedCount} documents from 'timetableoverrides'`);

    const delStudentTt = await db.collection('student_timetables').deleteMany({});
    console.log(`Deleted ${delStudentTt.deletedCount} documents from 'student_timetables'`);

    const delExpected = await db.collection('student_expected_schedules').deleteMany({});
    console.log(`Deleted ${delExpected.deletedCount} documents from 'student_expected_schedules'`);

    // 5. Post-deletion Count Verification
    const postAcademic = await db.collection('academictimetables').countDocuments();
    const postOverrides = await db.collection('timetableoverrides').countDocuments();
    const postStudentTt = await db.collection('student_timetables').countDocuments();
    const postExpectedInit = await db.collection('student_expected_schedules').countDocuments();
    const postSectionTt = await db.collection('section_timetables').countDocuments();
    const postAttendanceEntries = await db.collection('student_attendance_entries').countDocuments();
    const postAttendanceSummaries = await db.collection('student_attendance_summaries').countDocuments();
    const postSubjectAttendances = await db.collection('student_subject_attendances').countDocuments();

    console.log('\n--- POST-DELETION VERIFICATION ---');
    console.log(`academictimetables: ${postAcademic} (expected 0)`);
    console.log(`timetableoverrides: ${postOverrides} (expected 0)`);
    console.log(`student_timetables: ${postStudentTt} (expected 0)`);
    console.log(`student_expected_schedules: ${postExpectedInit} (cleared for regeneration)`);
    console.log(`section_timetables: ${postSectionTt} (expected 18)`);
    console.log(`student_attendance_entries: ${postAttendanceEntries} (expected 213)`);
    console.log(`student_attendance_summaries: ${postAttendanceSummaries} (expected 9)`);
    console.log(`student_subject_attendances: ${postSubjectAttendances} (expected 9)`);

    if (postAcademic !== 0 || postOverrides !== 0 || postStudentTt !== 0) {
        throw new Error('Verification failed: Obsolete collections are not empty!');
    }
    if (postAttendanceEntries !== 213 || postAttendanceSummaries !== 9 || postSubjectAttendances !== 9) {
        throw new Error('CRITICAL INTEGRITY FAILURE: Attendance data was mutated!');
    }
    if (postSectionTt !== 18) {
        throw new Error('CRITICAL INTEGRITY FAILURE: SectionTimetables count mutated!');
    }

    // Verify 18 SectionTimetables remain Draft
    const sectionTimetables = await db.collection('section_timetables').find().toArray();
    const draftCount = sectionTimetables.filter(st => st.status === 'Draft').length;
    console.log(`\nSectionTimetable status check: ${draftCount} of 18 are 'Draft' (unchanged).`);
    if (draftCount !== 18) {
        throw new Error('Verification failed: SectionTimetable status was unexpectedly changed!');
    }

    // 6. Regenerate Expected Schedule from current SectionTimetable
    console.log('\n--- REGENERATING DERIVED EXPECTED SCHEDULE ---');
    const studentId = '6a573763154f287a1bceb7ee';
    const regeneratedClasses = await generateAndCacheExpectedSchedule(studentId, 1);
    console.log(`Regenerated ${regeneratedClasses.length} expected classes from current SectionTimetable.`);

    const postExpectedRegen = await db.collection('student_expected_schedules').countDocuments();
    console.log(`student_expected_schedules count after regeneration: ${postExpectedRegen}`);

    await mongoose.disconnect();
    console.log('\nCleanup and regeneration completed successfully!');
}

runCleanup().catch(err => {
    console.error('Cleanup execution error:', err);
    process.exit(1);
});
