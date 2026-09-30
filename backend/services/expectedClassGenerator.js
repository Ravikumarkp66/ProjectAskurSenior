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

function resolveEventSuspension(e) {
    if (!e) return { classesSuspended: false, suspensionType: 'none' };
    const title = (e.title || '').trim();
    const eventType = (e.eventType || e.type || e.kind || '').trim();
    const isHoliday = eventType === 'Holiday / Closure' || eventType === 'HOLIDAY' || eventType === 'Government Holiday' || eventType === 'Vacation' || /vacation|holiday|closure|preparation.*holiday/i.test(title);
    const isTestOrExam = eventType === 'Exam' || eventType === 'EXAM' || eventType === 'CIE / Test' || /test[-\s]?\d+|cie[-\s]?\d+|exam|midterm|see\b/i.test(title);
    
    // Explicit classImpact from AcademicCalendarItem
    if (e.classImpact === 'NONE' || (/evening/i.test(title) && e.classesSuspended === false)) {
        return { classesSuspended: false, suspensionType: 'none' };
    }
    if (e.classImpact === 'FULL_DAY') {
        return { classesSuspended: true, suspensionType: 'full_day' };
    }
    if (e.classImpact === 'TIME_RANGE') {
        return { classesSuspended: true, suspensionType: 'time_range' };
    }

    if (e.classesSuspended === true) {
        return { classesSuspended: true, suspensionType: e.suspensionType || 'full_day' };
    }
    if (e.suspensionType && e.suspensionType !== 'none') {
        return { classesSuspended: true, suspensionType: e.suspensionType };
    }

    if (isHoliday) {
        return { classesSuspended: true, suspensionType: 'full_day' };
    }
    if (isTestOrExam && e.classesSuspended !== false) {
        return { classesSuspended: true, suspensionType: 'full_day' };
    }

    return { classesSuspended: false, suspensionType: 'none' };
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

        // Fetch Public / Institutional Holidays & College Events from CollegeEvent (canonical source of truth)
        const CollegeEvent = require('../models/CollegeEvent');
        const AcademicCalendarItem = require('../models/AcademicCalendarItem');
        let collegeEvents = [];
        const effectiveSemesterId = officialSemester?._id || student?.academicSemester;
        try {
            const collegeEventFilter = {
                status: { $ne: 'ARCHIVED' },
                startDate: { $lte: endDate },
                endDate: { $gte: startDate },
                $or: [
                    { scope: 'GLOBAL' },
                    ...(effectiveSemesterId ? [{
                        scope: 'SEMESTER',
                        academicSemesterId: effectiveSemesterId
                    }] : [{ scope: 'SEMESTER' }])
                ]
            };
            if (student?.college) {
                collegeEventFilter.college = student.college;
            }
            collegeEvents = await CollegeEvent.find(collegeEventFilter).lean();
        } catch (calErr) {
            collegeEvents = [];
        }

        // Fallback to legacy AcademicCalendarItem if no college events found
        if ((!collegeEvents || collegeEvents.length === 0) && AcademicCalendarItem) {
            try {
                const legacyHolidays = await AcademicCalendarItem.find({
                    status: 'Published',
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate }
                }).lean();
                if (legacyHolidays && legacyHolidays.length > 0) {
                    collegeEvents = legacyHolidays.map(h => ({
                        ...h,
                        classesSuspended: h.observedByCollege || h.classesSuspended || h.kind === 'HOLIDAY',
                        suspensionType: h.suspensionType || 'full_day'
                    }));
                }
            } catch (legErr) {
                // Ignore fallback error
            }
        }

        const parseTimeToMinutes = (t) => {
            if (typeof t === 'number') return t;
            if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
            const [h, m] = t.split(':').map(Number);
            return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
        };

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

            // Filter college events active on this specific date
            const activeCollegeEvents = collegeEvents.filter(h => {
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

            // Filter student personal events active on this specific date
            const activeStudentEvents = academicEvents.filter(e => {
                const startStr = formatDate(e.startDate);
                const endStr = formatDate(e.endDate);
                return startStr <= dateStr && dateStr <= endStr;
            });

            // Unified day events
            const dayEvents = [
                ...activeCollegeEvents.map(e => {
                    const susp = resolveEventSuspension(e);
                    return {
                        title: e.title,
                        eventType: e.eventType,
                        classesSuspended: susp.classesSuspended,
                        suspensionType: susp.suspensionType,
                        suspensionStartMinute: parseTimeToMinutes(e.suspensionStartTime || e.startTime),
                        suspensionEndMinute: parseTimeToMinutes(e.suspensionEndTime || e.endTime),
                        affectedSubjects: e.affectedSubjects || []
                    };
                }),
                ...activeStudentEvents.map(e => {
                    const susp = resolveEventSuspension(e);
                    return {
                        title: e.title,
                        eventType: e.eventType,
                        classesSuspended: susp.classesSuspended,
                        suspensionType: susp.suspensionType,
                        suspensionStartMinute: e.suspensionStartMinute || parseTimeToMinutes(e.startTime),
                        suspensionEndMinute: e.suspensionEndMinute || parseTimeToMinutes(e.endTime),
                        affectedSubjects: e.affectedSubjects || []
                    };
                })
            ];

            const fullDaySuspension = dayEvents.find(e => 
                e.classesSuspended && (e.suspensionType === 'full_day' || !e.suspensionType || e.suspensionType === 'none')
            );

            if (isManualHoliday || fullDaySuspension) {
                // Whole day is suspended (Holiday, Test-01, Test-02, Exam, etc.)!
                // Generate zero classes for today — automatically reduces remaining classes count.
                tempDate.setDate(tempDate.getDate() + 1);
                continue;
            }

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

                // Check dynamic event suspensions for this slot (e.g. time-range suspension)
                let isSuspended = false;
                for (const event of dayEvents) {
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
                        } else if (event.suspensionType === 'time_range' && event.suspensionStartMinute < event.suspensionEndMinute) {
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
