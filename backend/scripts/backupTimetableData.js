/**
 * Backup Timetable Data Script
 * Dumps targeted collections to backend/backups/timetable_cleanup_<timestamp>.json
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function runBackup() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('ERROR: MONGODB_URI not found');
        process.exit(1);
    }

    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `timetable_cleanup_${timestamp}.json`);

    const collectionsToBackup = [
        'academictimetables',
        'timetableoverrides',
        'student_timetables',
        'student_expected_schedules'
    ];

    const backupData = {
        metadata: {
            createdAt: new Date().toISOString(),
            description: 'Backup of obsolete/duplicate timetable collections prior to cleanup'
        },
        collections: {}
    };

    let totalDocs = 0;
    for (const colName of collectionsToBackup) {
        const docs = await db.collection(colName).find().toArray();
        backupData.collections[colName] = docs;
        console.log(`Backed up ${docs.length} documents from collection: ${colName}`);
        totalDocs += docs.length;
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    console.log(`\nSuccessfully wrote ${totalDocs} documents to: ${backupFile}`);

    // Verify backup readability
    const readBack = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    if (Object.keys(readBack.collections).length === collectionsToBackup.length) {
        console.log('Verification: Backup file successfully parsed and verified intact.');
    } else {
        throw new Error('Verification failed: Parsed collections count mismatch.');
    }

    await mongoose.disconnect();
}

runBackup().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
});
