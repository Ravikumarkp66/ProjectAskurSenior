/**
 * Comprehensive Timetable & Class Data Audit Script (READ-ONLY)
 *
 * Performs a 100% read-only inspection of the active MongoDB database
 * to produce an exhaustive inventory of all timetable/class/attendance collections.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function runAudit() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('ERROR: MONGODB_URI not found in environment');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000
    });
    console.log('Connected to MongoDB successfully.\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    collections.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`=== ALL DATABASE COLLECTIONS (${collections.length} TOTAL) ===`);
    const collectionInventory = [];

    for (const colInfo of collections) {
        const colName = colInfo.name;
        const count = await db.collection(colName).countDocuments();
        collectionInventory.push({ name: colName, count });
    }

    // Print all collections with counts
    for (const col of collectionInventory) {
        console.log(`- ${col.name.padEnd(35)} : ${col.count} documents`);
    }

    console.log('\n==================================================');
    console.log('1. DEEP INSPECTION: TIMETABLE & CLASS COLLECTIONS');
    console.log('==================================================\n');

    // Filter relevant collections matching timetable, class, schedule, occur, attend
    const pattern = /time|class|sched|occur|attend|expect|slot/i;
    const relevantCols = collectionInventory.filter(c => pattern.test(c.name));

    console.log(`Relevant collections detected: ${relevantCols.map(c => c.name).join(', ')}\n`);

    for (const col of relevantCols) {
        const colName = col.name;
        const count = col.count;
        console.log(`--------------------------------------------------`);
        console.log(`COLLECTION: ${colName} (Count: ${count})`);
        console.log(`--------------------------------------------------`);

        if (count > 0) {
            const sampleDocs = await db.collection(colName).find().limit(3).toArray();
            console.log(`Field names sample: ${Object.keys(sampleDocs[0] || {}).join(', ')}`);
            console.log(`Sample doc 1:`, JSON.stringify(sampleDocs[0], null, 2).slice(0, 500) + '...');
        } else {
            console.log('Collection is EMPTY (0 documents).');
        }
        console.log('');
    }

    console.log('\n==================================================');
    console.log('2. AUTHORITATIVE SECTION TIMETABLE AUDIT');
    console.log('==================================================\n');

    // SectionTimetable collection
    const sectionTimetables = await db.collection('section_timetables').find().toArray();
    console.log(`Total documents in 'section_timetables': ${sectionTimetables.length}`);

    // Fetch batches, semesters, sections
    const batches = await db.collection('academic_batches').find().toArray();
    const semesters = await db.collection('semesters').find().toArray();
    const sections = await db.collection('academic_sections').find().toArray();

    const batchMap = new Map(batches.map(b => [String(b._id), b]));
    const semMap = new Map(semesters.map(s => [String(s._id), s]));
    const secMap = new Map(sections.map(s => [String(s._id), s]));

    console.log(`Active Academic Sections in DB: ${sections.length}`);
    const activeSections = sections.filter(s => s.isActive !== false && s.status !== 'Inactive');
    console.log(`Active sections count: ${activeSections.length}`);
    console.log(`Active section names: ${activeSections.map(s => s.name).sort().join(', ')}`);

    console.log('\nAuditing each SectionTimetable record:');
    let validCount = 0;
    let orphanCount = 0;

    for (const tt of sectionTimetables) {
        const secId = String(tt.section || tt.academicSection || '');
        const sec = secMap.get(secId);
        const slotsCount = Array.isArray(tt.slots) ? tt.slots.length : 0;

        if (sec) {
            validCount++;
            const batch = batchMap.get(String(sec.batch || ''));
            const sem = semMap.get(String(sec.academicSemester || ''));
            console.log(`[VALID] ID: ${tt._id} | Section: ${sec.name} (Sec ID: ${sec._id}) | Status: ${tt.status} | AcademicYear: ${tt.academicYear} | Term: ${tt.termType} | Slots: ${slotsCount} | Batch: ${batch?.name || 'unknown'} | Sem: ${sec.semester || sem?.number || 'unknown'}`);
        } else {
            orphanCount++;
            console.log(`[ORPHAN/UNKNOWN SECTION] ID: ${tt._id} | Section ID referenced: ${secId} | Slots: ${slotsCount} | Status: ${tt.status}`);
        }
    }

    console.log(`\nSectionTimetable Summary: ${validCount} Valid, ${orphanCount} Orphan.`);

    console.log('\n==================================================');
    console.log('3. AUDITING STUDENT TIMETABLE & EXPECTED CLASSES');
    console.log('==================================================\n');

    // student_timetables
    const studentTtCount = await db.collection('student_timetables').countDocuments();
    console.log(`'student_timetables' document count: ${studentTtCount}`);
    if (studentTtCount > 0) {
        const sample = await db.collection('student_timetables').find().limit(5).toArray();
        console.log('Sample student_timetables docs:', JSON.stringify(sample, null, 2));
    }

    // student_expected_schedules
    const studentExpectedCount = await db.collection('student_expected_schedules').countDocuments();
    console.log(`'student_expected_schedules' document count: ${studentExpectedCount}`);
    if (studentExpectedCount > 0) {
        const sample = await db.collection('student_expected_schedules').find().limit(5).toArray();
        console.log('Sample student_expected_schedules docs:', JSON.stringify(sample, null, 2));
    }

    // class_occurrences
    const classOccCount = await db.collection('class_occurrences').countDocuments();
    console.log(`'class_occurrences' document count: ${classOccCount}`);
    if (classOccCount > 0) {
        const sample = await db.collection('class_occurrences').find().limit(5).toArray();
        console.log('Sample class_occurrences docs:', JSON.stringify(sample, null, 2));
    }

    // student_timetable_configurations
    const configCount = await db.collection('student_timetable_configurations').countDocuments();
    console.log(`'student_timetable_configurations' document count: ${configCount}`);
    if (configCount > 0) {
        const sample = await db.collection('student_timetable_configurations').find().limit(3).toArray();
        console.log('Sample student_timetable_configurations docs:', JSON.stringify(sample, null, 2));
    }

    // student_timetable_backups
    const backupCount = await db.collection('student_timetable_backups').countDocuments();
    console.log(`'student_timetable_backups' document count: ${backupCount}`);

    // modules/academic collections if any (timetables, academic_configs, timetable_overrides)
    for (const modColName of ['timetables', 'academic_configs', 'timetable_overrides', 'expected_classes', 'expected_class_records', 'daily_classes', 'class_sessions', 'scheduled_classes']) {
        const exists = collections.some(c => c.name === modColName);
        if (exists) {
            const count = await db.collection(modColName).countDocuments();
            console.log(`Detected legacy/other collection '${modColName}': count = ${count}`);
            if (count > 0) {
                const sample = await db.collection(modColName).find().limit(2).toArray();
                console.log(`Sample from ${modColName}:`, JSON.stringify(sample, null, 2));
            }
        } else {
            console.log(`Collection '${modColName}' does NOT exist in DB.`);
        }
    }

    console.log('\n==================================================');
    console.log('4. AUDITING ATTENDANCE REFERENCES TO TIMETABLES/CLASSES');
    console.log('==================================================\n');

    // Check attendance collections
    for (const attColName of ['student_attendance_records', 'student_attendance_entries', 'student_attendance_summaries', 'student_subject_attendances', 'attendance_records']) {
        const exists = collections.some(c => c.name === attColName);
        if (exists) {
            const count = await db.collection(attColName).countDocuments();
            console.log(`Checking '${attColName}' (${count} documents):`);
            if (count > 0) {
                const sample = await db.collection(attColName).find().limit(1).toArray();
                console.log(`Fields: ${Object.keys(sample[0] || {}).join(', ')}`);

                // Check for timetable references
                const hasTimetableRef = await db.collection(attColName).countDocuments({
                    $or: [
                        { timetable: { $exists: true } },
                        { timetableId: { $exists: true } },
                        { sectionTimetable: { $exists: true } },
                        { slotId: { $exists: true } },
                        { classOccurrence: { $exists: true } },
                        { expectedClass: { $exists: true } }
                    ]
                });
                console.log(`Documents with timetable/occurrence references: ${hasTimetableRef} / ${count}`);
            }
        }
    }

    console.log('\nAudit complete.');
    await mongoose.disconnect();
}

runAudit().catch(err => {
    console.error('Audit failed with error:', err);
    process.exit(1);
});
