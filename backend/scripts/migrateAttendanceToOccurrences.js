/**
 * Migration Script: StudentAttendanceEntry -> ClassOccurrence
 * 
 * Idempotently migrates all legacy attendance records into the consolidated ClassOccurrence collection.
 */

const mongoose = require('mongoose');
const StudentAttendanceEntry = require('../models/StudentAttendanceEntry');
const ClassOccurrence = require('../models/ClassOccurrence');

async function migrateAttendanceToOccurrences() {
    console.log('Starting migration: StudentAttendanceEntry -> ClassOccurrence...');
    
    const entries = await StudentAttendanceEntry.find({});
    console.log(`Found ${entries.length} legacy attendance entries to migrate.`);

    let created = 0;
    let updated = 0;

    for (const entry of entries) {
        if (!entry.student || !entry.date) continue;

        const schedSubj = entry.scheduledSubject || entry.subject;
        const actSubj = entry.subject || entry.scheduledSubject;
        if (!schedSubj || !actSubj) continue;

        // Parse minutes from timeSlot if available
        let startMinute = 0;
        let endMinute = 0;
        if (entry.timeSlot && entry.timeSlot.includes('-')) {
            const [sStr, eStr] = entry.timeSlot.split('-');
            const [sH, sM] = (sStr || '').split(':').map(Number);
            const [eH, eM] = (eStr || '').split(':').map(Number);
            if (!isNaN(sH)) startMinute = sH * 60 + (sM || 0);
            if (!isNaN(eH)) endMinute = eH * 60 + (eM || 0);
        }

        const occurrenceType = entry.isExtraClass 
            ? 'EXTRA' 
            : (schedSubj.toString() !== actSubj.toString() ? 'SWAPPED' : 'REGULAR');

        const filter = {
            student: entry.student,
            semester: entry.semester || 1,
            date: entry.date,
            timeSlot: entry.timeSlot || '',
            scheduledSubject: schedSubj
        };

        const updateDoc = {
            $set: {
                student: entry.student,
                semester: entry.semester || 1,
                date: entry.date,
                startMinute,
                endMinute,
                timeSlot: entry.timeSlot || '',
                scheduledSubject: schedSubj,
                actualSubject: actSubj,
                occurrenceType,
                status: entry.status || 'PENDING',
                isExtraClass: Boolean(entry.isExtraClass),
                remarks: entry.remarks || '',
                markedBy: 'STUDENT',
                markedAt: entry.updatedAt || entry.createdAt || new Date()
            }
        };

        const result = await ClassOccurrence.updateOne(filter, updateDoc, { upsert: true });
        if (result.upsertedCount > 0) {
            created++;
        } else if (result.modifiedCount > 0) {
            updated++;
        }
    }

    console.log(`Migration complete. Created: ${created}, Updated: ${updated}, Total Processed: ${entries.length}`);
    return { created, updated, total: entries.length };
}

module.exports = migrateAttendanceToOccurrences;
