const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const StudentTimetable = require('../models/StudentTimetable');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const StudentAcademicEvent = require('../models/StudentAcademicEvent');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');

const StudentAccount = require('../models/StudentAccount');

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
        // Check for authoritative section timetable via academic resolver first
        let sectionTimetable = null;
        let officialSemester = null;

        let academicContext = null;
        const student = await StudentAccount.findById(studentId);
        if (student) {
            const { resolveStudentAcademicContext } = require('./studentAcademicResolver');
            academicContext = await resolveStudentAcademicContext(student, semester);
            if (academicContext && academicContext.sectionTimetable && academicContext.sectionTimetable.slots?.length > 0) {
                sectionTimetable = academicContext.sectionTimetable;
                officialSemester = academicContext.officialSemester;
            }
        }

        // Determine date bounds: from official semester or student configuration
        let startDate = null;
        let endDate = null;
        let configVersion = 1;
        let workingDaysMap = null;
        let maxPeriodsMap = null;
        let slots = [];

        if (sectionTimetable && officialSemester) {
            // Authoritative: Actual teaching classes span strictly between Commencement of Regular Classes and Last Working Day
            const rawStart = academicContext?.commencementDate || officialSemester.commencementDate || officialSemester.startDate;
            const rawEnd = academicContext?.lastWorkingDayDate || officialSemester.lastWorkingDayDate || officialSemester.lastWorkingDate || officialSemester.endDate;

            if (rawStart && rawEnd) {
                startDate = new Date(rawStart);
                endDate = new Date(rawEnd);
            }
            const rawSlots = sectionTimetable.slots || [];
            const studentLabBatch = (student?.labBatch || '').toUpperCase();
            if (studentLabBatch && rawSlots.length > 0) {
                slots = rawSlots.filter(s => {
                    const bg = (s.batchGroup || 'ALL').toUpperCase();
                    return bg === 'ALL' || bg === studentLabBatch;
                });
            } else {
                slots = rawSlots;
            }

            // Load institutional timetable structure working days
            const { TimetableStructure, DEFAULT_WORKING_DAYS } = require('../models/TimetableStructure');
            let structWorkingDays = DEFAULT_WORKING_DAYS;
            if (academicContext?.timetableStructure?.workingDays?.length > 0) {
                structWorkingDays = academicContext.timetableStructure.workingDays;
            } else if (sectionTimetable.college) {
                try {
                    const tsDoc = await TimetableStructure.findOne({ college: sectionTimetable.college });
                    if (tsDoc && tsDoc.workingDays && tsDoc.workingDays.length > 0) {
                        structWorkingDays = tsDoc.workingDays;
                    }
                } catch (tsErr) {
                    structWorkingDays = DEFAULT_WORKING_DAYS;
                }
            }

            workingDaysMap = new Map(structWorkingDays.map(wd => [
                String(wd.dayOfWeek),
                wd.status === 'Non-Working' ? 'Holiday' : wd.status
            ]));
            maxPeriodsMap = new Map(structWorkingDays.map(wd => [
                String(wd.dayOfWeek),
                wd.maxPeriods !== undefined && wd.maxPeriods !== null
                    ? Number(wd.maxPeriods)
                    : (wd.status === 'Half Day' ? 4 : (wd.status === 'Non-Working' ? 0 : 999))
            ]));
            configVersion = 1;
        } else {
            // 1. Fallback to Personal Student Timetable Configuration
            const config = await StudentTimetableConfiguration.findOne({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            });
            if (!config) {
                await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
                return [];
            }

            startDate = new Date(config.semesterStartDate);
            endDate = new Date(config.lastWorkingDate);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
                await StudentExpectedSchedule.deleteOne({ student: studentId, semester });
                return [];
            }

            // 2. Fetch Personal Active Timetable Slots
            slots = await StudentTimetable.find({ 
                student: studentId, 
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            });
            workingDaysMap = config.workingDays || new Map();
            configVersion = config.version || 1;
        }

        // Fetch personal timetable slot overrides if any
        const personalSlots = await StudentTimetable.find({ 
            student: studentId, 
            $and: [
                { $or: [ { semester }, { semester: { $exists: false } } ] },
                { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
            ]
        }).populate('subject');

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

        // Fetch Public / Institutional Holidays from CollegeEvent (canonical source of truth)
        const CollegeEvent = require('../models/CollegeEvent');
        const AcademicCalendarItem = require('../models/AcademicCalendarItem');
        let calendarHolidays = [];
        try {
            calendarHolidays = await CollegeEvent.find({
                eventType: 'Holiday / Closure',
                status: { $ne: 'ARCHIVED' },
                startDate: { $lte: endDate },
                endDate: { $gte: startDate }
            }).lean();
        } catch (calErr) {
            calendarHolidays = [];
        }

        // Fallback to legacy AcademicCalendarItem if no college events found
        if ((!calendarHolidays || calendarHolidays.length === 0) && AcademicCalendarItem) {
            try {
                const legacyHolidays = await AcademicCalendarItem.find({
                    kind: 'HOLIDAY',
                    observedByCollege: true,
                    status: 'Published',
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }).lean();
                if (legacyHolidays && legacyHolidays.length > 0) {
                    calendarHolidays = legacyHolidays;
                }
            } catch (legErr) {
                // Ignore fallback error
            }
        }

        // 5. Generate Schedule
        const generatedClasses = [];
        let tempDate = new Date(startDate);
        workingDaysMap = workingDaysMap || new Map();

        while (tempDate <= endDate) {
            const dateStr = formatDate(tempDate);
            const jsDay = tempDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const dayOfWeek = jsDay === 0 ? 7 : jsDay;

            // Resolve working day status
            const dayConfig = (workingDaysMap.get ? workingDaysMap.get(String(dayOfWeek)) : workingDaysMap[String(dayOfWeek)]) || 'Full Day';
            const isManualHoliday = dayConfig === 'Holiday';

            // Check public / institutional holidays
            const effectiveSemesterId = officialSemester?._id || student?.academicSemester;
            const isCalendarHoliday = calendarHolidays.some(h => {
                if (h.scope === 'SEMESTER' && effectiveSemesterId && h.academicSemesterId && h.academicSemesterId.toString() !== effectiveSemesterId.toString()) {
                    return false;
                }
                if (h.scope === 'BRANCH' && student && student.branch && h.branch && h.branch.toString() !== student.branch.toString()) {
                    return false;
                }
                const hStart = formatDate(h.startDate);
                const hEnd = formatDate(h.endDate);
                return hStart <= dateStr && dateStr <= hEnd;
            });

            // Filter events active on this specific date
            const activeEvents = academicEvents.filter(e => {
                const startStr = formatDate(e.startDate);
                const endStr = formatDate(e.endDate);
                return startStr <= dateStr && dateStr <= endStr;
            });

            if (!isManualHoliday && !isCalendarHoliday) {
                // Find timetable slots for this weekday
                const daySlots = slots.filter(s => s.dayOfWeek === dayOfWeek && s.lectureType !== 'Break' && s.lectureType !== 'Free Period');

                for (const slot of daySlots) {
                    let activeSlot = slot;
                    if (personalSlots && personalSlots.length > 0) {
                        const override = personalSlots.find(ps => 
                            ps.dayOfWeek === dayOfWeek && 
                            Number(ps.startMinute) === Number(slot.startMinute)
                        );
                        if (override && override.isPersonalChange) {
                            const isEffective = !override.effectiveDate || override.effectiveDate <= dateStr;
                            if (isEffective) {
                                activeSlot = override;
                            }
                        }
                    }

                    if (activeSlot.lectureType === 'Free Period' || activeSlot.lectureType === 'Break') {
                        continue;
                    }

                    // Check if subject is assigned
                    const subjectIdStr = (activeSlot.subject?._id || activeSlot.subject)?.toString();
                    if (!subjectIdStr) {
                        continue;
                    }

                    // Saturday Half Day or other Half Day check: only allow slots within maxPeriods
                    if (dayConfig === 'Half Day') {
                        const maxAllowed = maxPeriodsMap ? maxPeriodsMap.get(String(dayOfWeek)) : 4;
                        if (maxAllowed !== undefined && slot.periodNumber && slot.periodNumber > maxAllowed) {
                            continue;
                        }
                        if (!maxPeriodsMap && slot.endMinute > 780) {
                            continue;
                        }
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
                        subject: activeSlot.subject?._id || activeSlot.subject,
                        lectureType: activeSlot.lectureType || 'Lecture',
                        dayOfWeek,
                        periodNumber: slot.periodNumber
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
                version: configVersion || 1,
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
