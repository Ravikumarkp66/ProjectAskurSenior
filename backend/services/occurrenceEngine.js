/**
 * Centralized Occurrence Engine for AskUrSenior
 * 
 * Core Principle: Individual ClassOccurrences are the authoritative source of truth.
 * All counters (present, absent, conducted, percentage, streak) are pure derived values.
 */

const STATUS = {
    PENDING: 'PENDING',
    PRESENT: 'PRESENT',
    ABSENT: 'ABSENT',
    SUSPENDED: 'SUSPENDED',
    ON_DUTY: 'ON_DUTY',
    MEDICAL_LEAVE: 'MEDICAL_LEAVE'
};

/**
 * Normalizes any legacy or UI status string into the controlled enum.
 */
function normalizeStatus(status) {
    if (!status) return STATUS.PENDING;
    const s = String(status).trim().toUpperCase();
    if (s === 'PRESENT') return STATUS.PRESENT;
    if (s === 'ON DUTY' || s === 'ON_DUTY') return STATUS.ON_DUTY;
    if (s === 'MEDICAL LEAVE' || s === 'MEDICAL_LEAVE') return STATUS.MEDICAL_LEAVE;
    if (s === 'ABSENT') return STATUS.ABSENT;
    if (s === 'SUSPENDED' || s === 'CANCELLED') return STATUS.SUSPENDED;
    return STATUS.PENDING;
}

/**
 * Validates a status transition and enforces future class protection.
 */
function validateStatusTransition(currentStatus, newStatus, occurrenceDate, occurrenceEndTime = '', allowFutureOverride = false) {
    const normNew = normalizeStatus(newStatus);
    const todayStr = new Date().toISOString().split('T')[0];

    // Future protection guard: Cannot mark future classes as PRESENT, ABSENT, or SUSPENDED
    if (!allowFutureOverride && normNew !== STATUS.PENDING) {
        if (occurrenceDate > todayStr) {
            const err = new Error('Cannot record attendance for future class occurrences.');
            err.code = 'FUTURE_CLASS_PROTECTION';
            throw err;
        }
    }

    return normNew;
}

/**
 * Derives pure attendance metrics for a single subject from its occurrence set.
 */
function calculateSubjectAttendance(occurrences, subjectId, options = {}) {
    const sIdStr = subjectId ? subjectId.toString() : '';
    const collegeThreshold = Number(options.collegeThreshold) || 85;
    const userThreshold = Number(options.userThreshold) || collegeThreshold;
    const baseline = options.baseline || { present: 0, conducted: 0 };

    let presentCount = baseline.present || 0;
    let absentCount = Math.max(0, (baseline.conducted || 0) - (baseline.present || 0));
    let suspendedCount = 0;
    let onDutyCount = 0;
    let medicalLeaveCount = 0;
    let pendingCount = 0;
    let futureCount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter occurrences where actualSubject === subjectId
    const subjectOccurrences = occurrences.filter(occ => {
        const actId = occ.actualSubject?._id || occ.actualSubject || occ.subject?._id || occ.subject;
        return actId && actId.toString() === sIdStr;
    });

    for (const occ of subjectOccurrences) {
        const status = normalizeStatus(occ.status);
        if (status === STATUS.PRESENT) {
            presentCount += 1;
        } else if (status === STATUS.ON_DUTY) {
            onDutyCount += 1;
            presentCount += 1; // On Duty credits presence
        } else if (status === STATUS.ABSENT) {
            absentCount += 1;
        } else if (status === STATUS.MEDICAL_LEAVE) {
            medicalLeaveCount += 1;
        } else if (status === STATUS.SUSPENDED) {
            suspendedCount += 1;
        } else {
            pendingCount += 1;
            if (occ.date >= todayStr) {
                futureCount += 1;
            }
        }
    }

    const conductedCount = presentCount + absentCount; // Invariant: conducted = present + absent

    const attendancePercentage = conductedCount > 0
        ? parseFloat(((presentCount / conductedCount) * 100).toFixed(2))
        : null;

    // Subject streak calculation
    const streak = calculateSubjectStreak(subjectOccurrences, subjectId);

    // Bunk & Recovery Roadmap calculation
    const uRatio = (userThreshold || 85) / 100;
    const cRatio = (collegeThreshold || 85) / 100;

    let safeMisses = 0;
    let neededClasses = 0;

    if (attendancePercentage !== null) {
        if (attendancePercentage >= userThreshold) {
            safeMisses = uRatio > 0 && conductedCount > 0
                ? Math.max(0, Math.floor((presentCount - uRatio * conductedCount) / uRatio))
                : 0;
        } else {
            if (uRatio >= 1.0) {
                neededClasses = Math.max(1, futureCount);
            } else {
                neededClasses = Math.max(1, Math.ceil((uRatio * conductedCount - presentCount) / (1 - uRatio)));
            }
        }
    }

    return {
        present: presentCount,
        absent: absentCount,
        suspended: suspendedCount,
        pending: pendingCount,
        conducted: conductedCount,
        attendancePercentage,
        streak,
        safeMisses,
        neededClasses,
        toBeConducted: futureCount,
        collegeThreshold,
        userThreshold
    };
}

/**
 * Calculates subject-specific attendance streak in strict chronological order.
 * 
 * Rules:
 * - PRESENT extends streak (+1)
 * - ABSENT breaks streak (= 0)
 * - SUSPENDED preserves streak (neutral)
 * - PENDING blocks continuation of streak without falsely resetting
 */
function calculateSubjectStreak(occurrences, subjectId) {
    const sIdStr = subjectId ? subjectId.toString() : '';

    const subjectOccurrences = occurrences
        .filter(occ => {
            const actId = occ.actualSubject?._id || occ.actualSubject || occ.subject?._id || occ.subject;
            return actId && actId.toString() === sIdStr;
        })
        .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.timeSlot || a.startTime || '').localeCompare(b.timeSlot || b.startTime || '');
        });

    let currentStreak = 0;
    let longestStreak = 0;

    for (const occ of subjectOccurrences) {
        const status = normalizeStatus(occ.status);

        if (status === STATUS.PRESENT) {
            currentStreak += 1;
            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }
        } else if (status === STATUS.ABSENT) {
            currentStreak = 0;
        } else if (status === STATUS.SUSPENDED) {
            // Neutral: preserves current streak
        } else if (status === STATUS.PENDING) {
            // Pending blocks further streak continuation until confirmed
            break;
        }
    }

    return {
        current: currentStreak,
        longest: longestStreak
    };
}

/**
 * Derives comprehensive Semester Attendance Summary from occurrences.
 */
function calculateSemesterAttendanceSummary(occurrences, registeredSubjects = [], options = {}) {
    const collegeThreshold = Number(options.collegeThreshold) || 85;
    const userThreshold = Number(options.userThreshold) || collegeThreshold;

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalSuspended = 0;
    let totalPending = 0;
    let totalToBeConducted = 0;

    const subjectsSummary = [];

    for (const reg of registeredSubjects) {
        const sId = reg.subject?._id || reg.subject || reg._id;
        const subjName = reg.subject?.subjectName || reg.name || 'Subject';
        const subjCode = reg.subject?.subjectCode || reg.code || '';
        const credits = reg.registeredCredits || reg.credits || 0;
        const classesPerWeek = reg.weeklyPlan?.theory?.required || reg.classesPerWeek || 0;
        const labSessions = reg.weeklyPlan?.lab?.required || reg.labSessionsPerWeek || 0;
        const baseline = reg.baseline || { present: 0, conducted: 0 };

        const stats = calculateSubjectAttendance(occurrences, sId, {
            collegeThreshold,
            userThreshold,
            baseline
        });

        totalPresent += stats.present;
        totalAbsent += stats.absent;
        totalSuspended += stats.suspended;
        totalPending += stats.pending;
        totalToBeConducted += stats.toBeConducted;

        // Health Status Category
        let healthStatus = '🟢 Safe';
        let statusCategory = 'SAFE';
        let statusMessage = 'Target reached';

        if (stats.attendancePercentage === null) {
            healthStatus = '⚪ Not Started';
            statusCategory = 'NOT_STARTED';
            statusMessage = 'No classes conducted yet';
        } else if (stats.attendancePercentage < collegeThreshold) {
            healthStatus = '🔴 Critical';
            statusCategory = 'CRITICAL';
            statusMessage = 'Below college minimum';
        } else if (collegeThreshold !== userThreshold && stats.attendancePercentage < userThreshold) {
            healthStatus = '🟡 Attention';
            statusCategory = 'ATTENTION';
            statusMessage = 'Below personal target';
        }

        subjectsSummary.push({
            subjectId: sId,
            name: subjName,
            code: subjCode,
            category: reg.category || 'Theory',
            credits,
            classesPerWeek,
            labSessions,
            present: stats.present,
            absent: stats.absent,
            suspended: stats.suspended,
            pending: stats.pending,
            conducted: stats.conducted,
            toBeConducted: stats.toBeConducted,
            attendancePercentage: stats.attendancePercentage,
            collegeThreshold,
            userThreshold,
            streak: stats.streak,
            safeMisses: stats.safeMisses,
            neededClasses: stats.neededClasses,
            healthStatus,
            statusCategory,
            statusMessage
        });
    }

    const totalConducted = totalPresent + totalAbsent;
    const overallAttendance = totalConducted > 0
        ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(2))
        : null;

    return {
        subjects: subjectsSummary,
        totalPresent,
        totalAbsent,
        totalSuspended,
        totalPending,
        totalConducted,
        totalToBeConducted,
        overallAttendance,
        collegeThreshold,
        userThreshold
    };
}

module.exports = {
    STATUS,
    normalizeStatus,
    validateStatusTransition,
    calculateSubjectAttendance,
    calculateSubjectStreak,
    calculateSemesterAttendanceSummary
};
