const StudentAccount = require('../models/StudentAccount');
const StudentTimetableConfiguration = require('../models/StudentTimetableConfiguration');
const StudentTimetable = require('../models/StudentTimetable');
const StudentRegisteredSubject = require('../models/StudentRegisteredSubject');
const AcademicSubjectCms = require('../models/AcademicSubject');
const StudentAcademicEvent = require('../models/StudentAcademicEvent');
const StudentExpectedSchedule = require('../models/StudentExpectedSchedule');
const StudentAttendanceEntry = require('../models/StudentAttendanceEntry');
const SemesterSnapshot = require('../models/SemesterSnapshot');
const { getCollegeAcademicRules } = require('./collegeAcademicRules');

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
        // Live data configuration - Parallelize all independent collections
        const ClassOccurrence = require('../models/ClassOccurrence');
        const StudentTimetable = require('../models/StudentTimetable');

        const [configDoc, cachedScheduleDoc, subjectsDocs, occDocs, timetableSlotsDocs] = await Promise.all([
            StudentTimetableConfiguration.findOne({ 
                student: studentId, 
                $or: [ { semester }, { semester: { $exists: false } } ] 
            }).lean(),
            StudentExpectedSchedule.findOne({ student: studentId, semester }).lean(),
            StudentRegisteredSubject.find({ 
                student: studentId, 
                $and: [
                    { $or: [ { semester }, { semester: { $exists: false } } ] },
                    { $or: [ { isActive: true }, { isActive: { $exists: false } } ] }
                ]
            }).populate('subject').lean(),
            ClassOccurrence.find({ student: studentId, semester }).lean(),
            StudentTimetable.find({ student: studentId, semester }).lean()
        ]);

        configuration = configDoc;
        let cachedSchedule = cachedScheduleDoc;
        if (!cachedSchedule) {
            const { generateAndCacheExpectedSchedule } = require('./expectedClassGenerator');
            const classes = await generateAndCacheExpectedSchedule(studentId, semester);
            cachedSchedule = { classes };
        }
        expectedClasses = cachedSchedule?.classes || [];

        if (configuration) {
            const startDate = new Date(configuration.semesterStartDate);
            const endDate = new Date(configuration.lastWorkingDate);

            // Fetch Student Academic Events overlapping semester range
            events = await StudentAcademicEvent.find({
                student: studentId,
                startDate: { $lte: endDate },
                endDate: { $gte: startDate }
            }).lean() || [];

            // Holidays are mapped as events of type 'Government Holiday'
            holidays = events.filter(e => e.eventType === 'Government Holiday');
        }

        subjects = subjectsDocs || [];
        entries = occDocs || [];
        if (!entries || entries.length === 0) {
            entries = await StudentAttendanceEntry.find({ student: studentId, semester }).lean();
        }
        timetableSlots = timetableSlotsDocs || [];
    }

    if (!entries) entries = [];

    // Strictly bound occurrences to the semester timeline configuration (source of truth)
    if (configuration && configuration.semesterStartDate) {
        const startBound = formatDate(configuration.semesterStartDate);
        const endBound = configuration.lastWorkingDate ? formatDate(configuration.lastWorkingDate) : '9999-12-31';
        entries = (entries || []).filter(e => e.date >= startBound && e.date <= endBound);
    }

    // Fetch timetable slots to derive weekly frequency (classes/week & lab/week)
    if (!timetableSlots) {
        const StudentTimetable = require('../models/StudentTimetable');
        timetableSlots = await StudentTimetable.find({ student: studentId, semester }).lean();
    }
    const timetableSlotsBySubj = new Map();
    for (const s of (timetableSlots || [])) {
        const sId = s.subject?.toString();
        if (!sId) continue;
        if (!timetableSlotsBySubj.has(sId)) {
            timetableSlotsBySubj.set(sId, { theory: 0, lab: 0 });
        }
        const isLab = s.lectureType?.toLowerCase() === 'lab';
        const rec = timetableSlotsBySubj.get(sId);
        if (isLab) rec.lab++;
        else rec.theory++;
    }

    // 3. Compile Timeline
    let timeline = compileRawTimeline(expectedClasses, entries);
    timeline = mergeConsecutiveLabs(timeline);
    const todayStr = formatDate(new Date());

    // 4. Apply Filters to Timeline
    let filteredTimeline = [...timeline];
    if (filters.subjectId) {
        filteredTimeline = filteredTimeline.filter(t => t.subject && t.subject.toString() === filters.subjectId.toString());
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

    // Institutional & User Thresholds
    const collegeRules = getCollegeAcademicRules(student.collegeName || 'SIT');
    const collegeThreshold = collegeRules.attendance?.minimumPercentage || 85;
    
    // Student personal threshold (default to college threshold if unset or lower)
    let userThreshold = configuration?.attendanceThreshold;
    if (!userThreshold || userThreshold < collegeThreshold) {
        userThreshold = collegeThreshold;
    }

    for (const reg of subjects) {
        const subjectId = reg.subject?._id || reg.subject;
        if (!subjectId) continue;

        const subjectIdStr = subjectId.toString();
        const subjTimeline = timeline.filter(t => t.subject && t.subject.toString() === subjectIdStr);

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
                ? parseFloat((subjAnalytics.present / subjAnalytics.conducted * 100).toFixed(2))
                : null;

            // Subject-specific user target (from StudentRegisteredSubject) fallback to student global target or college min
            const subjectUserThreshold = reg.userThreshold || userThreshold || collegeThreshold;

            // Controlled Attendance Status Logic
            let healthStatus = '🟢 Safe';
            let statusCategory = 'SAFE';
            let statusMessage = 'Target reached';

            if (subjPct === null) {
                healthStatus = '⚪ Not Started';
                statusCategory = 'NOT_STARTED';
                statusMessage = 'No classes conducted yet';
            } else if (subjPct < collegeThreshold) {
                healthStatus = '🔴 Critical';
                statusCategory = 'CRITICAL';
                statusMessage = 'Below college minimum';
            } else if (collegeThreshold !== subjectUserThreshold && subjPct < subjectUserThreshold) {
                healthStatus = '🟡 Attention';
                statusCategory = 'ATTENTION';
                statusMessage = 'Below your target';
            } else {
                healthStatus = '🟢 Safe';
                statusCategory = 'SAFE';
                statusMessage = 'Target reached';
            }

            // Calculation of buffers relative to college threshold and personal target
            const collegeFrac = collegeThreshold / 100;
            const userFrac = subjectUserThreshold / 100;

            const canMiss = (subjPct !== null && collegeFrac > 0)
                ? Math.max(0, Math.floor(subjAnalytics.present / collegeFrac - subjAnalytics.conducted))
                : 0;
            const needToAttend = (subjPct !== null && userFrac < 1)
                ? Math.max(0, Math.ceil((subjectUserThreshold * subjAnalytics.conducted - 100 * subjAnalytics.present) / (100 - subjectUserThreshold)))
                : 0;

            const codeBase = reg.customCode || reg.subject?.code || '';
            const nameBase = reg.customName || reg.subject?.name || 'Unknown';

            // Auto-derive weekly frequencies from StudentTimetable slots if configured, otherwise fallback to registered plan
            const slotFreq = timetableSlotsBySubj.get(subjectIdStr);
            const derivedTheory = slotFreq ? slotFreq.theory : null;
            const derivedLab = slotFreq ? slotFreq.lab : null;

            const classesPerWeek = (derivedTheory !== null)
                ? (categoryType === 'Lab' ? 0 : derivedTheory)
                : (reg.weeklyPlan?.theory?.required ?? (categoryType === 'Lab' ? 0 : (reg.weeklyPlan?.theory?.required || 0)));

            const labSessionsPerWeek = (derivedLab !== null)
                ? (categoryType === 'Lab' ? derivedLab : 0)
                : (reg.weeklyPlan?.lab?.required ?? (categoryType === 'Lab' ? (reg.weeklyPlan?.lab?.required || 0) : 0));

            subjectsData.push({
                subjectId,
                name: nameBase + nameSuffix,
                code: codeBase + codeSuffix,
                category: categoryType,
                credits: reg.registeredCredits || 0,
                classesPerWeek,
                labSessionsPerWeek,
                collegeThreshold,
                userThreshold: subjectUserThreshold,
                attendancePercentage: subjPct !== null ? parseFloat(subjPct.toFixed(2)) : null,
                analytics: {
                    ...subjAnalytics,
                    healthStatus,
                    statusCategory,
                    statusMessage,
                    collegeThreshold,
                    userThreshold: subjectUserThreshold,
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
    const overallPct = totalConducted > 0 ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(2)) : null;
    
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
    let overallStatusCategory = 'SAFE';
    let overallStatusMessage = 'Target reached';

    if (overallPct < collegeThreshold) {
        overallHealthStatus = '🔴 Critical';
        overallStatusCategory = 'CRITICAL';
        overallStatusMessage = 'Below college minimum';
    } else if (collegeThreshold !== userThreshold && overallPct < userThreshold) {
        overallHealthStatus = '🟡 Attention';
        overallStatusCategory = 'ATTENTION';
        overallStatusMessage = 'Below your target';
    }

    const collegeReqFrac = collegeThreshold / 100;
    const userReqFrac = userThreshold / 100;
    const overallCanMiss = Math.max(0, Math.floor(totalPresent / collegeReqFrac - totalConducted));
    const overallNeedToAttend = userReqFrac >= 1 ? 0 : Math.max(0, Math.ceil((userThreshold * totalConducted - 100 * totalPresent) / (100 - userThreshold)));

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
            collegeThreshold,
            userThreshold,
            threshold: userThreshold,
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
            statusCategory: overallStatusCategory,
            statusMessage: overallStatusMessage,
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
            const schedSubjId = entry.scheduledSubject 
                ? (entry.scheduledSubject._id ? entry.scheduledSubject._id.toString() : entry.scheduledSubject.toString()) 
                : (entry.subject ? (entry.subject._id ? entry.subject._id.toString() : entry.subject.toString()) : (entry.actualSubject ? (entry.actualSubject._id ? entry.actualSubject._id.toString() : entry.actualSubject.toString()) : ''));
            const keyWithSubj = `${schedSubjId}_${entry.date}_${entry.timeSlot || ''}`;
            entryMap.set(keyWithSubj, entry);
        }
    }

    for (const exp of expectedClasses) {
        if (!exp || !exp.subject) continue;
        const subjectIdStr = exp.subject.toString();
        const keyWithSubj = `${subjectIdStr}_${exp.date}_${exp.timeSlot}`;
        
        let matchedEntry = entryMap.get(keyWithSubj);

        // Multi-hour / Merged slot range matching fallback
        if (!matchedEntry) {
            const expTimes = parseTimeSlot(exp.timeSlot);
            matchedEntry = entries.find(e => {
                if (e.date !== exp.date || !e.timeSlot || !e.timeSlot.includes('-')) return false;
                const eTimes = parseTimeSlot(e.timeSlot);
                const eSchedSubj = e.scheduledSubject ? e.scheduledSubject.toString() : (e.subject ? e.subject.toString() : (e.actualSubject ? e.actualSubject.toString() : ''));
                const eActSubj = e.actualSubject ? e.actualSubject.toString() : (e.subject ? e.subject.toString() : '');
                const isSubjMatch = eSchedSubj === subjectIdStr || eActSubj === subjectIdStr;
                const isTimeCovered = eTimes.start <= expTimes.start && expTimes.end <= eTimes.end;
                return isSubjMatch && isTimeCovered;
            });
        }

        if (matchedEntry) {
            const actSubj = matchedEntry.actualSubject || matchedEntry.subject || exp.subject;
            timeline.push({
                _id: matchedEntry._id,
                date: exp.date,
                timeSlot: exp.timeSlot,
                scheduledSubject: exp.subject,
                subject: actSubj,
                isSubjectChanged: Boolean(actSubj && actSubj.toString() !== exp.subject.toString()),
                lectureType: exp.lectureType || 'Lecture',
                status: matchedEntry.status,
                isExtraClass: false,
                remarks: matchedEntry.remarks || '',
                createdBy: matchedEntry.markedBy || matchedEntry.createdBy || 'Student'
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

const norm = (s) => (s ? String(s).trim().toUpperCase() : '');
const isPresent = (s) => ['PRESENT', 'ON DUTY', 'ON_DUTY'].includes(norm(s));
const isAbsent = (s) => ['ABSENT', 'MEDICAL LEAVE', 'MEDICAL_LEAVE'].includes(norm(s));
const isSuspended = (s) => ['SUSPENDED', 'CANCELLED'].includes(norm(s));
const isUnmarked = (s) => {
    const sn = norm(s);
    return !sn || sn === 'YET TO BE TAKEN' || sn === 'NOT_MARKED' || sn === 'PENDING';
};

/**
 * Computes analytics stats for a timeline subset
 */
function computeTimelineStats(timeline, todayStr) {
    const conductedRecords = timeline.filter(t => t.date <= todayStr && !isSuspended(t.status) && !isUnmarked(t.status));
    const conducted = conductedRecords.length;
    const present = conductedRecords.filter(t => isPresent(t.status)).length;
    const absent = conductedRecords.filter(t => isAbsent(t.status)).length;
    const medicalLeave = conductedRecords.filter(t => norm(t.status) === 'MEDICAL_LEAVE' || norm(t.status) === 'MEDICAL LEAVE').length;
    const onDuty = conductedRecords.filter(t => norm(t.status) === 'ON_DUTY' || norm(t.status) === 'ON DUTY').length;
    const suspended = timeline.filter(t => isSuspended(t.status)).length;
    const cancelled = suspended;

    const toBeConductedRecords = timeline.filter(t => t.date > todayStr && !isSuspended(t.status));
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
        .filter(t => !isSuspended(t.status) && t.date <= todayStr)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

    let longest = 0;
    let temp = 0;

    for (const t of sorted) {
        if (isPresent(t.status)) {
            temp++;
            if (temp > longest) longest = temp;
        } else if (isAbsent(t.status)) {
            temp = 0;
        }
    }

    let current = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
        const t = sorted[i];
        if (isPresent(t.status)) {
            current++;
        } else if (isAbsent(t.status)) {
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
        .filter(t => !isSuspended(t.status) && t.date <= todayStr)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.timeSlot.localeCompare(b.timeSlot);
        });

    let longest = 0;
    let temp = 0;

    for (const t of sorted) {
        if (isAbsent(t.status)) {
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

        const presentCount = items.filter(i => isPresent(i.status)).length;
        const absentCount = items.filter(i => isAbsent(i.status)).length;
        const expectedCount = items.filter(i => !isSuspended(i.status)).length;

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
            Boolean(prev.subject && item.subject && prev.subject.toString() === item.subject.toString()) &&
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
