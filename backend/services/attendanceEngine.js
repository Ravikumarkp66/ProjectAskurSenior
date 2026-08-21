const StudentAccount = require('../models/StudentAccount');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const StudentTimetable = require('../models/StudentTimetable');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const AcademicSubjectCms = require('../models/AcademicSubject');
const StudentAcademicEvent = require('../models/StudentAcademicEvent');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');
const StudentAttendanceEntry = require('../models/StudentAttendanceEntry');
const SemesterSnapshot = require('../models/SemesterSnapshot');

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
 * Compiles a single Semester Analytics Object (Single Source of Truth)
 */
async function compileSemesterAnalytics(studentId, semester, filters = {}) {
    // 1. Fetch Student Profile
    const student = await StudentAccount.findById(studentId);
    if (!student) {
        throw new Error('Student account not found');
    }

    const currentSemester = student.semester || 1;
    const isArchived = semester < currentSemester;

    let configuration = null;
    let expectedClasses = [];
    let subjects = [];
    let holidays = [];
    let events = [];
    let entries = [];

    // 2. Fetch Data (Snapshot vs. Live)
    if (isArchived) {
        const snapshot = await SemesterSnapshot.findOne({ student: studentId, semester });
        if (snapshot) {
            configuration = snapshot.configuration;
            expectedClasses = snapshot.expectedClasses || [];
            subjects = snapshot.subjects || [];
            events = snapshot.events || [];
            holidays = snapshot.holidays || [];
        }
    } else {
        // Live data configuration
        configuration = await StudentTimetableConfiguration.findOne({ 
            student: studentId, 
            $or: [ { semester }, { semester: { $exists: false } } ] 
        });

        if (configuration) {
            const startDate = new Date(configuration.semesterStartDate);
            const endDate = new Date(configuration.lastWorkingDate);

            // Fetch live expected classes schedule cache
            let cachedSchedule = await StudentExpectedSchedule.findOne({ student: studentId, semester });
            if (!cachedSchedule || !cachedSchedule.classes || cachedSchedule.classes.length === 0) {
                const { generateAndCacheExpectedSchedule } = require('./expectedClassGenerator');
                const classes = await generateAndCacheExpectedSchedule(studentId, semester);
                cachedSchedule = { classes };
            }
            expectedClasses = cachedSchedule.classes || [];

            // Fetch registered subjects
            subjects = await StudentRegisteredSubject.find({ 
                student: studentId, 
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            }).populate('subject');

            // Fetch Student Academic Events overlapping semester range
            events = await StudentAcademicEvent.find({
                student: studentId,
                startDate: { $lte: endDate },
                endDate: { $gte: startDate }
            });

            // Holidays are mapped as events of type 'Government Holiday'
            holidays = events.filter(e => e.eventType === 'Government Holiday');
        }
    }

    // Fetch entries (decisions)
    entries = await StudentAttendanceEntry.find({ student: studentId, semester });

    // 3. Compile Timeline
    let timeline = compileRawTimeline(expectedClasses, entries);
    timeline = mergeConsecutiveLabs(timeline);
    const todayStr = formatDate(new Date());

    // 4. Apply Filters to Timeline
    let filteredTimeline = [...timeline];
    if (filters.subjectId) {
        filteredTimeline = filteredTimeline.filter(t => t.subject.toString() === filters.subjectId.toString());
    }
    if (filters.category) {
        const catLower = filters.category.toLowerCase();
        if (catLower === 'lab') {
            filteredTimeline = filteredTimeline.filter(t => t.lectureType?.toLowerCase() === 'lab');
        } else {
            filteredTimeline = filteredTimeline.filter(t => t.lectureType?.toLowerCase() !== 'lab');
        }
    }
    if (filters.month) {
        filteredTimeline = filteredTimeline.filter(t => {
            const monthVal = new Date(t.date).getMonth() + 1; // 1-indexed
            const monthStr = String(monthVal).padStart(2, '0');
            return monthStr === String(filters.month) || 
                   new Date(t.date).toLocaleDateString('en-US', { month: 'long' }).toLowerCase() === filters.month.toLowerCase();
        });
    }
    if (filters.startDate) {
        filteredTimeline = filteredTimeline.filter(t => t.date >= filters.startDate);
    }
    if (filters.endDate) {
        filteredTimeline = filteredTimeline.filter(t => t.date <= filters.endDate);
    }
    if (filters.status) {
        filteredTimeline = filteredTimeline.filter(t => t.status === filters.status);
    }
    if (filters.lectureType) {
        const typeLower = filters.lectureType.toLowerCase();
        if (typeLower === 'theory') {
            filteredTimeline = filteredTimeline.filter(t => t.lectureType?.toLowerCase() !== 'lab');
        } else if (typeLower === 'lab') {
            filteredTimeline = filteredTimeline.filter(t => t.lectureType?.toLowerCase() === 'lab');
        }
    }

    // Group Timeline by Date (Calculated early for streaks)
    const groupedTimeline = groupTimelineByDate(filteredTimeline);

    // 5. Subject Progress & Analytics
    const subjectsData = [];
    let totalExpected = 0;
    let totalConducted = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalMedical = 0;
    let totalOnDuty = 0;
    let totalCancelled = 0;

    const threshold = configuration?.attendanceThreshold || 75;

    for (const reg of subjects) {
        const subjectId = reg.subject?._id || reg.subject;
        if (!subjectId) continue;

        const subjectIdStr = subjectId.toString();
        const subjTimeline = timeline.filter(t => t.subject.toString() === subjectIdStr);

        const theoryTimeline = subjTimeline.filter(t => t.lectureType?.toLowerCase() !== 'lab');
        const labTimeline = subjTimeline.filter(t => t.lectureType?.toLowerCase() === 'lab');

        const baselinePresent = reg.baseline?.present || 0;
        const baselineConducted = reg.baseline?.conducted || 0;
        const baselineAbsent = Math.max(0, baselineConducted - baselinePresent);

        const pushSubjectData = (nameSuffix, codeSuffix, categoryType, subTimeline) => {
            const subjAnalytics = computeTimelineStats(subTimeline, todayStr);

            subjAnalytics.baseline = { present: baselinePresent, conducted: baselineConducted };
            subjAnalytics.conducted += baselineConducted;
            subjAnalytics.present += baselinePresent;
            subjAnalytics.absent += baselineAbsent;
            subjAnalytics.expected += baselineConducted;

            totalExpected += subjAnalytics.expected;
            totalConducted += subjAnalytics.conducted;
            totalPresent += subjAnalytics.present;
            totalAbsent += subjAnalytics.absent;
            totalMedical += subjAnalytics.medicalLeave;
            totalOnDuty += subjAnalytics.onDuty;
            totalCancelled += subjAnalytics.cancelled;

            const remaining = Math.max(0, subjAnalytics.expected - subjAnalytics.conducted);
            const ifAttendAll = subjAnalytics.expected > 0 
                ? parseFloat(((subjAnalytics.present + remaining) / subjAnalytics.expected * 100).toFixed(2)) 
                : 0.0;
            const ifMissNext3 = subjAnalytics.expected > 0 
                ? parseFloat(((subjAnalytics.present + Math.max(0, remaining - 3)) / subjAnalytics.expected * 100).toFixed(2)) 
                : 0.0;
            const ifMissNext5 = subjAnalytics.expected > 0 
                ? parseFloat(((subjAnalytics.present + Math.max(0, remaining - 5)) / subjAnalytics.expected * 100).toFixed(2)) 
                : 0.0;

            const subjPct = subjAnalytics.conducted > 0 
                ? (subjAnalytics.present / subjAnalytics.conducted * 100) 
                : 100.0;
            let healthStatus = '🟢 Safe';
            if (subjPct < threshold) {
                healthStatus = '🔴 Critical';
            } else if (ifMissNext3 < threshold) {
                healthStatus = '🟡 Warning';
            }

            const reqFrac = threshold / 100;
            const canMiss = Math.max(0, Math.floor(subjAnalytics.present / reqFrac - subjAnalytics.conducted));
            const needToAttend = reqFrac >= 1 ? 0 : Math.max(0, Math.ceil((threshold * subjAnalytics.conducted - 100 * subjAnalytics.present) / (100 - threshold)));

            const codeBase = reg.customCode || reg.subject?.code || '';
            const nameBase = reg.customName || reg.subject?.name || 'Unknown';

            subjectsData.push({
                subjectId,
                name: nameBase + nameSuffix,
                code: codeBase + codeSuffix,
                category: categoryType,
                credits: reg.registeredCredits || 0,
                attendancePercentage: parseFloat(subjPct.toFixed(2)),
                analytics: {
                    ...subjAnalytics,
                    healthStatus,
                    canMiss,
                    needToAttend,
                    predictions: {
                        ifAttendAll,
                        ifMissNext3,
                        ifMissNext5
                    }
                }
            });
        };

        if (theoryTimeline.length === 0 && labTimeline.length === 0) {
            pushSubjectData('', '', reg.category || 'Theory', []);
        } else {
            if (theoryTimeline.length > 0) {
                pushSubjectData('', '', 'Theory', theoryTimeline);
            }
            if (labTimeline.length > 0) {
                pushSubjectData(' (Lab)', ' (L)', 'Lab', labTimeline);
            }
        }
    }

    // Overall Analytics Calculations
    const overallPct = totalConducted > 0 ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(2)) : 0.0;
    
    // Streaks (Daily Overall Streak)
    const overallStreaks = calculateDailyOverallStreak(groupedTimeline, todayStr);

    // Remaining classes overall predictions
    const overallRemaining = Math.max(0, totalExpected - totalConducted);
    const overallIfAttendAll = totalExpected > 0 
        ? parseFloat(((totalPresent + overallRemaining) / totalExpected * 100).toFixed(2)) 
        : 0.0;
    const overallIfMissNext3 = totalExpected > 0 
        ? parseFloat(((totalPresent + Math.max(0, overallRemaining - 3)) / totalExpected * 100).toFixed(2)) 
        : 0.0;
    const overallIfMissNext5 = totalExpected > 0 
        ? parseFloat(((totalPresent + Math.max(0, overallRemaining - 5)) / totalExpected * 100).toFixed(2)) 
        : 0.0;

    let overallHealthStatus = '🟢 Safe';
    if (overallPct < threshold) {
        overallHealthStatus = '🔴 Critical';
    } else if (overallIfMissNext3 < threshold) {
        overallHealthStatus = '🟡 Warning';
    }

    const overallReqFrac = threshold / 100;
    const overallCanMiss = Math.max(0, Math.floor(totalPresent / overallReqFrac - totalConducted));
    const overallNeedToAttend = overallReqFrac >= 1 ? 0 : Math.max(0, Math.ceil((threshold * totalConducted - 100 * totalPresent) / (100 - threshold)));

    // Semester Progress Completion Days
    let completedDays = 0;
    let remainingDays = 0;
    let semesterProgressPct = 0;

    if (configuration) {
        const start = new Date(configuration.semesterStartDate);
        const end = new Date(configuration.lastWorkingDate);
        const today = new Date();

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        if (today < start) {
            completedDays = 0;
            remainingDays = totalDays;
            semesterProgressPct = 0;
        } else if (today > end) {
            completedDays = totalDays;
            remainingDays = 0;
            semesterProgressPct = 100;
        } else {
            completedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1;
            remainingDays = Math.max(0, totalDays - completedDays);
            semesterProgressPct = Math.min(100, Math.round((completedDays / totalDays) * 100));
        }
    }

    // Monthly Analytics
    const monthlyData = {};
    timeline.forEach(t => {
        if (t.status === 'Cancelled' || t.status === 'Yet To Be Taken') return;
        const d = new Date(t.date);
        const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        if (!monthlyData[monthName]) {
            monthlyData[monthName] = { expected: 0, conducted: 0, present: 0 };
        }
        monthlyData[monthName].expected++; // count expected within month limit
        monthlyData[monthName].conducted++;
        if (t.status === 'Present' || t.status === 'On Duty') {
            monthlyData[monthName].present++;
        }
    });

    const monthlyAnalytics = Object.entries(monthlyData).map(([month, stats]) => {
        return {
            month,
            expected: stats.expected,
            conducted: stats.conducted,
            present: stats.present,
            attendancePercentage: stats.conducted > 0 ? parseFloat(((stats.present / stats.conducted) * 100).toFixed(2)) : 0.0
        };
    });

    // Semester Analytics highlights
    let bestSubject = null;
    let lowestSubject = null;
    let mostMissedSubject = null;
    let highestStreakSubject = null;
    let maxStreakVal = 0;
    let maxAbsentVal = 0;

    subjectsData.forEach(s => {
        if (s.analytics.conducted > 0) {
            if (!bestSubject || s.attendancePercentage > bestSubject.attendancePercentage) {
                bestSubject = s;
            }
            if (!lowestSubject || s.attendancePercentage < lowestSubject.attendancePercentage) {
                lowestSubject = s;
            }
        }
        if (s.analytics.absent > maxAbsentVal) {
            maxAbsentVal = s.analytics.absent;
            mostMissedSubject = s;
        }
        if (s.analytics.streak.longest > maxStreakVal) {
            maxStreakVal = s.analytics.streak.longest;
            highestStreakSubject = s;
        }
    });

    const longestAbsence = calculateLongestAbsenceStreak(timeline, todayStr);

    const totalHolidays = holidays.length;
    const totalExams = events.filter(e => e.eventType === 'Exam').length;
    const totalEventTypes = events.filter(e => e.eventType === 'College Fest').length;

    // Working & Non Working Days estimation
    let workingDaysCount = 0;
    let nonWorkingDaysCount = 0;
    if (configuration) {
        const start = new Date(configuration.semesterStartDate);
        const end = new Date(configuration.lastWorkingDate);
        let curr = new Date(start);
        const workingDaysMap = configuration.workingDays || new Map();
        
        const holidaysSet = new Set();
        for (const h of holidays) {
            const hStart = new Date(h.startDate);
            const hEnd = new Date(h.endDate);
            let hCurr = new Date(hStart);
            while (hCurr <= hEnd) {
                holidaysSet.add(formatDate(hCurr));
                hCurr.setDate(hCurr.getDate() + 1);
            }
        }

        while (curr <= end) {
            const dateStr = formatDate(curr);
            const jsDay = curr.getDay();
            const dayOfWeek = jsDay === 0 ? 7 : jsDay;
            const dayConfig = workingDaysMap.get ? workingDaysMap.get(String(dayOfWeek)) : workingDaysMap[String(dayOfWeek)];

            const isHoliday = holidaysSet.has(dateStr) || dayConfig === 'Holiday';
            if (isHoliday) {
                nonWorkingDaysCount++;
            } else {
                workingDaysCount++;
            }
            curr.setDate(curr.getDate() + 1);
        }
    }

    return {
        student: {
            id: student._id.toString(),
            name: student.name || 'Unknown student',
            usn: student.usn || 'N/A',
            college: student.college || 'N/A',
            branch: student.branch || 'N/A',
            scheme: student.scheme || 'N/A',
            semester: semester,
            academicYear: student.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        },
        metadata: {
            reportVersion: '1.0',
            engineVersion: '3.0.0',
            generatedOn: new Date().toISOString(),
            filtersUsed: filters
        },
        overall: {
            threshold,
            attendance: overallPct,
            expected: totalExpected,
            conducted: totalConducted,
            present: totalPresent,
            absent: totalAbsent,
            medicalLeave: totalMedical,
            onDuty: totalOnDuty,
            cancelled: totalCancelled,
            streak: overallStreaks,
            canMiss: overallCanMiss,
            needToAttend: overallNeedToAttend,
            healthStatus: overallHealthStatus,
            semesterProgressPct,
            completedDays,
            remainingDays,
            predictions: {
                ifAttendAll: overallIfAttendAll,
                ifMissNext3: overallIfMissNext3,
                ifMissNext5: overallIfMissNext5
            }
        },
        subjects: subjectsData,
        groupedTimeline,
        timeline: filteredTimeline, // flat list if needed
        eventsList: events,
        holidaysList: holidays,
        monthlyAnalytics,
        semesterAnalytics: {
            bestSubject: bestSubject ? { name: bestSubject.name, code: bestSubject.code, pct: bestSubject.attendancePercentage } : null,
            lowestSubject: lowestSubject ? { name: lowestSubject.name, code: lowestSubject.code, pct: lowestSubject.attendancePercentage } : null,
            mostMissedSubject: mostMissedSubject ? { name: mostMissedSubject.name, code: mostMissedSubject.code, absentCount: maxAbsentVal } : null,
            highestStreakSubject: highestStreakSubject ? { name: highestStreakSubject.name, code: highestStreakSubject.code, streak: maxStreakVal } : null,
            longestAbsence,
            totalHolidays,
            totalExams,
            totalEvents: totalEventTypes,
            workingDays: workingDaysCount,
            nonWorkingDays: nonWorkingDaysCount,
            semesterCompletionPct: semesterProgressPct
        },
        statistics: {
            subjectsCount: subjects.length,
            expectedClasses: totalExpected,
            conducted: totalConducted,
            present: totalPresent,
            absent: totalAbsent,
            medical: totalMedical,
            extraClasses: entries.filter(e => e.isExtraClass).length,
            events: events.length,
            govHolidays: holidays.length,
            studentHolidays: events.filter(e => e.eventType === 'Custom' && e.classesSuspended).length
        }
    };
}

/**
 * Compiles flat expected classes & manual entries
 */
function compileRawTimeline(expectedClasses, entries) {
    const timeline = [];
    const entryMap = new Map();
    const extraEntries = [];

    for (const entry of entries) {
        if (entry.isExtraClass) {
            extraEntries.push(entry);
        } else {
            const schedSubjId = entry.scheduledSubject ? entry.scheduledSubject.toString() : entry.subject.toString();
            const keyWithSubj = `${schedSubjId}_${entry.date}_${entry.timeSlot || ''}`;
            const keySlotOnly = `${entry.date}_${entry.timeSlot || ''}`;
            entryMap.set(keyWithSubj, entry);
            if (entry.timeSlot) {
                entryMap.set(keySlotOnly, entry);
            }
        }
    }

    for (const exp of expectedClasses) {
        const subjectIdStr = exp.subject.toString();
        const keyWithSubj = `${subjectIdStr}_${exp.date}_${exp.timeSlot}`;
        const keySlotOnly = `${exp.date}_${exp.timeSlot}`;
        
        const matchedEntry = entryMap.get(keyWithSubj) || entryMap.get(keySlotOnly);

        if (matchedEntry) {
            timeline.push({
                _id: matchedEntry._id,
                date: exp.date,
                timeSlot: exp.timeSlot,
                scheduledSubject: exp.subject,
                subject: matchedEntry.subject,
                isSubjectChanged: matchedEntry.subject.toString() !== exp.subject.toString(),
                lectureType: exp.lectureType || 'Lecture',
                status: matchedEntry.status,
                isExtraClass: false,
                remarks: matchedEntry.remarks || '',
                createdBy: matchedEntry.createdBy || 'Student'
            });
        } else {
            timeline.push({
                _id: null,
                date: exp.date,
                timeSlot: exp.timeSlot,
                scheduledSubject: exp.subject,
                subject: exp.subject,
                isSubjectChanged: false,
                lectureType: exp.lectureType || 'Lecture',
                status: 'Yet To Be Taken',
                isExtraClass: false,
                remarks: '',
                createdBy: 'System'
            });
        }
    }

    for (const extra of extraEntries) {
        timeline.push({
            _id: extra._id,
            date: extra.date,
            timeSlot: extra.timeSlot || '',
            scheduledSubject: extra.scheduledSubject || extra.subject,
            subject: extra.subject,
            isSubjectChanged: false,
            lectureType: extra.lectureType || 'Lecture',
            status: extra.status,
            isExtraClass: true,
            remarks: extra.remarks || '',
            createdBy: extra.createdBy || 'Student'
        });
    }

    // Sort ascending
    timeline.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.timeSlot.localeCompare(b.timeSlot);
    });

    return timeline;
}

/**
 * Computes analytics stats for a timeline subset
 */
function computeTimelineStats(timeline, todayStr) {
    const conductedRecords = timeline.filter(t => t.date <= todayStr && t.status !== 'Cancelled' && t.status !== 'Suspended' && t.status !== 'Yet To Be Taken');
    const conducted = conductedRecords.length;
    const present = conductedRecords.filter(t => t.status === 'Present' || t.status === 'On Duty').length;
    const absent = conductedRecords.filter(t => t.status === 'Absent').length;
    const medicalLeave = conductedRecords.filter(t => t.status === 'Medical Leave').length;
    const onDuty = conductedRecords.filter(t => t.status === 'On Duty').length;
    const suspended = timeline.filter(t => t.status === 'Suspended').length;
    const cancelled = timeline.filter(t => t.status === 'Cancelled').length;

    const toBeConductedRecords = timeline.filter(t => t.date > todayStr && t.status !== 'Cancelled' && t.status !== 'Suspended');
    const toBeConducted = toBeConductedRecords.length;

    const expected = conducted + toBeConducted;
    const streak = calculateTimelineStreaks(timeline, todayStr);

    return {
        expected,
        conducted,
        present,
        absent,
        medicalLeave,
        onDuty,
        suspended,
        cancelled,
        toBeConducted,
        streak
    };
}

/**
 * Calculates current and longest streaks of present classes
 */
function calculateTimelineStreaks(timeline, todayStr) {
    const sorted = [...timeline]
        .filter(t => t.status !== 'Cancelled' && t.date <= todayStr)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

    let longest = 0;
    let temp = 0;

    for (const t of sorted) {
        if (t.status === 'Present' || t.status === 'On Duty') {
            temp++;
            if (temp > longest) longest = temp;
        } else if (t.status === 'Absent' || t.status === 'Medical Leave') {
            temp = 0;
        }
    }

    let current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (t.status === 'Present' || t.status === 'On Duty') {
            current++;
        } else if (t.status === 'Absent' || t.status === 'Medical Leave') {
            break;
        }
    }

    return { current, longest };
}

/**
 * Calculates daily overall streak (fully attended teaching days)
 */
function calculateDailyOverallStreak(groupedTimeline, todayStr) {
    const sortedDays = groupedTimeline
        .filter(g => g.date <= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date));

    let longest = 0;
    let temp = 0;

    for (const day of sortedDays) {
        if (day.expectedClasses === 0) {
            continue; // Ignore non-teaching days (don't break, don't increase)
        }
        if (day.absent > 0) {
            temp = 0; // Reset
        } else {
            temp++; // Fully attended teaching day
            if (temp > longest) longest = temp;
        }
    }

    return { current: temp, longest };
}

/**
 * Calculates longest absence streak (consecutive absent classes)
 */
function calculateLongestAbsenceStreak(timeline, todayStr) {
    const sorted = [...timeline]
        .filter(t => t.status !== 'Cancelled' && t.date <= todayStr)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

    let longest = 0;
    let temp = 0;

    for (const t of sorted) {
        if (t.status === 'Absent') {
            temp++;
            if (temp > longest) longest = temp;
        } else {
            temp = 0;
        }
    }

    return longest;
}

/**
 * Groups a timeline of classes by Date
 */
function groupTimelineByDate(timeline) {
    const grouped = [];
    const dateMap = new Map();

    for (const item of timeline) {
        if (!dateMap.has(item.date)) {
            dateMap.set(item.date, []);
        }
        dateMap.get(item.date).push(item);
    }

    for (const [date, items] of dateMap.entries()) {
        const d = new Date(date);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const presentCount = items.filter(i => i.status === 'Present' || i.status === 'On Duty').length;
        const absentCount = items.filter(i => i.status === 'Absent' || i.status === 'Medical Leave').length;
        const expectedCount = items.filter(i => i.status !== 'Cancelled').length;

        grouped.push({
            date,
            dayName,
            formattedDate: formattedDateStr,
            expectedClasses: expectedCount,
            present: presentCount,
            absent: absentCount,
            slots: items
        });
    }

    // Sort chronological ascending
    grouped.sort((a, b) => a.date.localeCompare(b.date));
    return grouped;
}

function parseTimeSlot(slotStr) {
    if (!slotStr || !slotStr.includes('-')) return { start: 0, end: 0 };
    const [startPart, endPart] = slotStr.split('-');
    
    const parsePart = (part) => {
        const parts = part.trim().split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        return h * 60 + m;
    };
    
    return {
        start: parsePart(startPart),
        end: parsePart(endPart)
    };
}

function mergeConsecutiveLabs(timelineList) {
    if (!timelineList || timelineList.length === 0) return [];
    
    const sorted = [...timelineList];
    const merged = [];
    
    for (const item of sorted) {
        if (item.lectureType?.toLowerCase() !== 'lab') {
            merged.push({
                ...item,
                constituentSlots: [item.timeSlot]
            });
            continue;
        }
        
        if (merged.length === 0) {
            merged.push({
                ...item,
                constituentSlots: [item.timeSlot]
            });
            continue;
        }
        
        const prev = merged[merged.length - 1];
        
        const prevTimes = parseTimeSlot(prev.timeSlot);
        const itemTimes = parseTimeSlot(item.timeSlot);
        
        const isConsecutiveLab = 
            prev.lectureType?.toLowerCase() === 'lab' &&
            prev.date === item.date &&
            prev.subject.toString() === item.subject.toString() &&
            prevTimes.end === itemTimes.start;
            
        if (isConsecutiveLab) {
            const prevStart = prev.timeSlot.split('-')[0];
            const currentEnd = item.timeSlot.split('-')[1];
            prev.timeSlot = `${prevStart}-${currentEnd}`;
            prev.constituentSlots.push(item.timeSlot);
            
            const statuses = [prev.status, item.status];
            const uniqueStatuses = [...new Set(statuses)].filter(s => s !== 'Yet To Be Taken');
            
            if (uniqueStatuses.length === 1) {
                prev.status = uniqueStatuses[0];
            } else if (uniqueStatuses.length > 1) {
                prev.status = uniqueStatuses[0];
            } else {
                prev.status = 'Yet To Be Taken';
            }
            
            if (item.remarks && !prev.remarks.includes(item.remarks)) {
                prev.remarks = prev.remarks ? `${prev.remarks}; ${item.remarks}` : item.remarks;
            }
            
            if (!prev._id && item._id) {
                prev._id = item._id;
            }
        } else {
            merged.push({
                ...item,
                constituentSlots: [item.timeSlot]
            });
        }
    }
    
    return merged;
}

module.exports = {
    compileSemesterAnalytics,
    formatDate,
    minutesToTimeString: minutes => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
};
