const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const StudentTimetable = require('../models/StudentTimetable');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentAcademicEvent = require('../models/StudentAcademicEvent');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');

/**
 * Format Date to YYYY-MM-DD local string
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format minute of day to HH:MM time string
 */
function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Generates and caches the expected teaching schedule for a student and semester
 */
async function generateAndCacheExpectedSchedule(studentId, semester) {
    try {
        // 1. Fetch Configuration
        const config = await StudentTimetableConfiguration.findOne({ 
            student: studentId, 
            $or: [ { semester }, { semester: { $exists: false } } ] 
        });
        if (!config) {
            await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
            return [];
        }

        const startDate = new Date(config.semesterStartDate);
        const endDate = new Date(config.lastWorkingDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
            await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
            return [];
        }

        // 2. Fetch Active Timetable Slots
        const slots = await StudentTimetable.find({ 
            student: studentId, 
            $and: [
                { $or: [ { semester }, { semester: { $exists: false } } ] },
                { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
            ]
        });

        // 3. Fetch Registered Subjects
        const registeredSubjects = await StudentRegisteredSubject.find({ 
            student: studentId, 
            $and: [
                { $or: [ { semester }, { semester: { $exists: false } } ] },
                { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
            ]
        });
        const registeredSubjectIds = new Set(registeredSubjects.map(s => s.subject?.toString()).filter(Boolean));

        // 4. Fetch Student Academic Events overlapping semester range
        const academicEvents = await StudentAcademicEvent.find({
            student: studentId,
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
        });

        // 5. Generate Schedule
        const generatedClasses = [];
        let tempDate = new Date(startDate);
        const workingDaysMap = config.workingDays || new Map();

        while (tempDate <= endDate) {
            const dateStr = formatDate(tempDate);
            const jsDay = tempDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const dayOfWeek = jsDay === 0 ? 7 : jsDay;

            // Resolve working day status
            const dayConfig = (workingDaysMap.get ? workingDaysMap.get(String(dayOfWeek)) : workingDaysMap[String(dayOfWeek)]) || 'Full Day';
            const isManualHoliday = dayConfig === 'Holiday';

            // Filter events active on this specific date
            const activeEvents = academicEvents.filter(e => {
                const startStr = formatDate(e.startDate);
                const endStr = formatDate(e.endDate);
                return startStr <= dateStr && dateStr <= endStr;
            });

            if (!isManualHoliday) {
                // Find timetable slots for this weekday
                const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek && s.lectureType !== 'Break');

                for (const slot of daySlots) {
                    // Check if subject is registered
                    const subjectIdStr = slot.subject?.toString();
                    if (!subjectIdStr || !registeredSubjectIds.has(subjectIdStr)) {
                        continue;
                    }

                    // Saturday Half Day or other Half Day check: only allow slots ending before or at 1:00 PM (780 minutes)
                    if (dayConfig === 'Half Day' && slot.endMinute > 780) {
                        continue;
                    }

                    // Check dynamic event suspensions
                    let isSuspended = false;
                    for (const event of activeEvents) {
                        if (event.classesSuspended) {
                            // Check affected subjects list
                            if (event.affectedSubjects && event.affectedSubjects.length > 0) {
                                if (!event.affectedSubjects.some(subId => subId.toString() === subjectIdStr)) {
                                    continue; // Subject not affected by this event
                                }
                            }

                            if (event.suspensionType === 'full_day') {
                                isSuspended = true;
                                break;
                            } else if (event.suspensionType === 'time_range') {
                                const overlap = slot.startMinute < event.suspensionEndMinute && slot.endMinute > event.suspensionStartMinute;
                                if (overlap) {
                                    isSuspended = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (isSuspended) {
                        continue;
                    }

                    const timeSlotStr = `${minutesToTimeString(slot.startMinute)}-${minutesToTimeString(slot.endMinute)}`;

                    generatedClasses.push({
                        date: dateStr,
                        timeSlot: timeSlotStr,
                        subject: slot.subject,
                        lectureType: slot.lectureType || 'Lecture',
                        dayOfWeek
                    });
                }
            }

            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 7. Sort Chronologically (Ascending)
        generatedClasses.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

        // 8. Cache / Upsert expected schedule
        await StudentExpectedSchedule.findOneAndUpdate(
            { student: studentId, semester },
            {
                student: studentId,
                semester,
                version: config.version || 1,
                classes: generatedClasses,
                lastCalculated: new Date()
            },
            { upsert: true, new: true }
        );

        return generatedClasses;
    } catch (err) {
        console.error('Error generating and caching expected schedule:', err);
        return [];
    }
}

module.exports = {
    generateAndCacheExpectedSchedule,
    formatDate,
    minutesToTimeString
};
