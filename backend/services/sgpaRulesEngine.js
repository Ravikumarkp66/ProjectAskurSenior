/**
 * Central College SGPA Rules & Grading Calculation Engine
 * Scheme 2025 & SIT Autonomous Grading Standards
 */

function round(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((Number(val) + Number.EPSILON) * factor) / factor;
}

const SIT_SGPA_RULES = {
    collegeId: 'SIT',
    version: '2.0.0',
    cieMax: 50,
    seeScaledMax: 50,
    totalMaxMarks: 100,
    cieMinThreshold: 20, // Overall min CIE threshold for credit courses
    seeMinRawThreshold100: 36, // 36 / 100 raw SEE min requirement
    seeMinRawThreshold50: 18,  // 18 / 50 raw SEE min requirement

    // Standard Scheme 2025 Grade Scale (gap-free descending intervals):
    // O (90-100): 10, A+ (80-89): 9, A (70-79): 8, B+ (60-69): 7, B (50-59): 6, C (40-49): 5, F (<40): 0
    getGradeForTotalMarks(totalMarks) {
        if (typeof totalMarks !== 'number' || isNaN(totalMarks)) {
            return { grade: 'F', gradePoint: 0 };
        }
        if (totalMarks >= 90) return { grade: 'O', gradePoint: 10 };
        if (totalMarks >= 80) return { grade: 'A+', gradePoint: 9 };
        if (totalMarks >= 70) return { grade: 'A', gradePoint: 8 };
        if (totalMarks >= 60) return { grade: 'B+', gradePoint: 7 };
        if (totalMarks >= 50) return { grade: 'B', gradePoint: 6 };
        if (totalMarks >= 40) return { grade: 'C', gradePoint: 5 };
        return { grade: 'F', gradePoint: 0 };
    }
};

/**
 * Calculate single subject SGPA result
 */
function calculateSubjectSgpaResult({ registeredSubject, cieData, seeRawMarks, seeRawMaximum = 100 }) {
    const credits = Number(registeredSubject.registeredCredits || 0);
    const evalType = (registeredSubject.evaluationType || registeredSubject.category || '').toUpperCase();
    const code = (registeredSubject.customCode || registeredSubject.subject?.code || '').toUpperCase();
    const name = (registeredSubject.customName || registeredSubject.subject?.name || '').toUpperCase();
    const isNcmc = credits === 0 || evalType.includes('NCMC') || code.includes('NCMC') || code.includes('CC10') || name.includes('NON-CREDIT') || name.includes('MANDATORY');

    const cieMarks = cieData?.totalCie !== undefined && cieData?.totalCie !== null ? Number(cieData.totalCie) : null;
    const cieStatus = cieData?.status || 'NOT_STARTED';
    const cieEligible = cieData?.isEligible !== false && cieStatus !== 'NOT_ELIGIBLE';

    // ──────────────────────────────────────────────────────────────────────────
    // A. NCMC Evaluation (Continuous Internal Evaluation only, no SEE exam)
    // ──────────────────────────────────────────────────────────────────────────
    if (isNcmc) {
        if (cieMarks === null) {
            return {
                registeredSubjectId: registeredSubject._id,
                subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
                subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
                credits: 0,
                isNcmc: true,
                cieMarks: null,
                cieMax: 100,
                cieStatus,
                seeRawMarks: null,
                seeRawMaximum: null,
                seeScaledMarks: null,
                seeScaledMaximum: null,
                totalMarks: null,
                grade: 'PENDING',
                gradePoint: 0,
                creditPoints: 0,
                status: 'PENDING'
            };
        }

        const isPassed = cieMarks >= 40;
        return {
            registeredSubjectId: registeredSubject._id,
            subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
            subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
            credits: 0,
            isNcmc: true,
            cieMarks,
            cieMax: 100,
            cieStatus: isPassed ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
            seeRawMarks: null,
            seeRawMaximum: null,
            seeScaledMarks: null,
            seeScaledMaximum: null,
            totalMarks: cieMarks,
            grade: isPassed ? 'PP' : 'NP',
            gradePoint: 0,
            creditPoints: 0,
            status: isPassed ? 'COMPLETED' : 'FAILED',
            failureReason: isPassed ? null : 'NCMC continuous evaluation below passing requirement (min 40 / 100)'
        };
    }

    // ──────────────────────────────────────────────────────────────────────────
    // B. Credit Course Evaluation (CIE + SEE)
    // ──────────────────────────────────────────────────────────────────────────
    const seeRaw = seeRawMarks !== undefined && seeRawMarks !== null && seeRawMarks !== '' && !isNaN(Number(seeRawMarks))
        ? Number(seeRawMarks)
        : null;

    const rawMax = Number(seeRawMaximum) === 50 ? 50 : 100;

    // Default pending state
    if (cieMarks === null || seeRaw === null) {
        return {
            registeredSubjectId: registeredSubject._id,
            subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
            subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
            credits,
            isNcmc: false,
            cieMarks,
            cieMax: SIT_SGPA_RULES.cieMax,
            cieStatus,
            seeRawMarks: seeRaw,
            seeRawMaximum: rawMax,
            seeScaledMarks: seeRaw !== null ? round((seeRaw / rawMax) * SIT_SGPA_RULES.seeScaledMax) : null,
            seeScaledMaximum: SIT_SGPA_RULES.seeScaledMax,
            totalMarks: null,
            grade: 'PENDING',
            gradePoint: 0,
            creditPoints: 0,
            status: 'PENDING'
        };
    }

    // Scale SEE to 50
    const seeScaled = round((seeRaw / rawMax) * SIT_SGPA_RULES.seeScaledMax);
    const totalMarks = round(cieMarks + seeScaled);

    // CHECK RULE 1: CIE Eligibility Override (CIE NE)
    if (!cieEligible || cieStatus === 'NOT_ELIGIBLE' || cieMarks < SIT_SGPA_RULES.cieMinThreshold) {
        return {
            registeredSubjectId: registeredSubject._id,
            subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
            subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
            credits,
            isNcmc: false,
            cieMarks,
            cieMax: SIT_SGPA_RULES.cieMax,
            cieStatus: 'NOT_ELIGIBLE',
            seeRawMarks: seeRaw,
            seeRawMaximum: rawMax,
            seeScaledMarks: seeScaled,
            seeScaledMaximum: SIT_SGPA_RULES.seeScaledMax,
            totalMarks,
            grade: 'NE',
            gradePoint: 0,
            creditPoints: 0,
            status: 'NE',
            failureReason: 'CIE eligibility not satisfied'
        };
    }

    // CHECK RULE 2: SEE Minimum Threshold Check
    const minSeeRequired = rawMax === 100 ? SIT_SGPA_RULES.seeMinRawThreshold100 : SIT_SGPA_RULES.seeMinRawThreshold50;

    if (seeRaw < minSeeRequired) {
        return {
            registeredSubjectId: registeredSubject._id,
            subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
            subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
            credits,
            isNcmc: false,
            cieMarks,
            cieMax: SIT_SGPA_RULES.cieMax,
            cieStatus,
            seeRawMarks: seeRaw,
            seeRawMaximum: rawMax,
            seeScaledMarks: seeScaled,
            seeScaledMaximum: SIT_SGPA_RULES.seeScaledMax,
            totalMarks,
            grade: 'F',
            gradePoint: 0,
            creditPoints: 0,
            status: 'FAILED',
            failureReason: `SEE requirement not satisfied. Required: ${minSeeRequired} / ${rawMax}, Current: ${seeRaw} / ${rawMax}`
        };
    }

    // Calculate Grade from scale
    const gradeObj = SIT_SGPA_RULES.getGradeForTotalMarks(totalMarks);
    const gradePoint = gradeObj.gradePoint;
    const creditPoints = round(credits * gradePoint);
    const status = gradeObj.grade === 'F' ? 'FAILED' : 'COMPLETED';

    return {
        registeredSubjectId: registeredSubject._id,
        subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
        subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
        credits,
        isNcmc: false,
        cieMarks,
        cieMax: SIT_SGPA_RULES.cieMax,
        cieStatus,
        seeRawMarks: seeRaw,
        seeRawMaximum: rawMax,
        seeScaledMarks: seeScaled,
        seeScaledMaximum: SIT_SGPA_RULES.seeScaledMax,
        totalMarks,
        grade: gradeObj.grade,
        gradePoint,
        creditPoints,
        status
    };
}

/**
 * Calculate overall Semester SGPA from list of subject results
 */
function calculateSemesterSgpa(subjectResults = []) {
    let totalCredits = 0;
    let totalCreditPoints = 0;
    let hasPending = false;
    let completedCount = 0;
    let hasFailedSubjects = false;

    for (const sub of subjectResults) {
        const isNcmc = sub.credits === 0 || sub.isNcmc;

        if (isNcmc) {
            if (sub.status === 'PENDING' || sub.cieMarks === null) {
                hasPending = true;
            } else {
                completedCount++;
                if (sub.status === 'FAILED' || sub.grade === 'NP') {
                    hasFailedSubjects = true;
                }
            }
            continue;
        }

        if (sub.status === 'PENDING' || sub.seeRawMarks === null || sub.cieMarks === null) {
            hasPending = true;
            continue;
        }

        completedCount++;
        const credits = Number(sub.credits || 0);
        const gp = Number(sub.gradePoint || 0);

        if (sub.status === 'FAILED' || sub.grade === 'F' || sub.status === 'NE' || sub.grade === 'NE') {
            hasFailedSubjects = true;
        }

        if (credits > 0) {
            totalCredits += credits;
            totalCreditPoints += (credits * gp);
        }
    }

    let sgpa = null;
    let status = 'PENDING';

    if (!hasPending && completedCount > 0 && totalCredits > 0) {
        sgpa = round(totalCreditPoints / totalCredits);
        status = hasFailedSubjects ? 'FAILED_SUBJECTS' : 'COMPLETED';
    } else if (completedCount > 0 && totalCredits > 0) {
        sgpa = round(totalCreditPoints / totalCredits);
        status = 'PARTIAL';
    }

    return {
        totalCredits,
        totalCreditPoints: round(totalCreditPoints),
        sgpa,
        hasPending,
        completedCount,
        totalSubjectsCount: subjectResults.length,
        status
    };
}

module.exports = {
    SIT_SGPA_RULES,
    calculateSubjectSgpaResult,
    calculateSemesterSgpa,
    round
};
