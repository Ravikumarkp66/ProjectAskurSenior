/**
 * Central College SGPA Rules & Grading Calculation Engine
 * SIT College Rules Configuration
 */

const SIT_SGPA_RULES = {
    collegeId: 'SIT',
    version: '1.0.0',
    cieMax: 50,
    seeScaledMax: 50,
    totalMaxMarks: 100,
    cieMinThreshold: 20, // Overall min CIE threshold
    seeMinRawThreshold100: 36, // 36 / 100 raw SEE min requirement
    seeMinRawThreshold50: 18,  // 18 / 50 raw SEE min requirement

    gradingScale: [
        { min: 90, max: 100, grade: 'O',  gradePoint: 10 },
        { min: 80, max: 89.99, grade: 'A+', gradePoint: 9 },
        { min: 70, max: 79.99, grade: 'A',  gradePoint: 8 },
        { min: 60, max: 69.99, grade: 'B+', gradePoint: 7 },
        { min: 50, max: 59.99, grade: 'B',  gradePoint: 6 },
        { min: 40, max: 49.99, grade: 'C',  gradePoint: 5 },
        { min: 0,  max: 39.99, grade: 'F',  gradePoint: 0 }
    ]
};

/**
 * Calculate single subject SGPA result
 */
function calculateSubjectSgpaResult({ registeredSubject, cieData, seeRawMarks, seeRawMaximum = 100 }) {
    const credits = Number(registeredSubject.registeredCredits || 0);

    const cieMarks = cieData?.totalCie !== undefined && cieData?.totalCie !== null ? Number(cieData.totalCie) : null;
    const cieStatus = cieData?.status || 'NOT_STARTED';
    const cieEligible = cieData?.isEligible !== false && cieStatus !== 'NOT_ELIGIBLE';

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
            cieMarks,
            cieMax: SIT_SGPA_RULES.cieMax,
            cieStatus,
            seeRawMarks: seeRaw,
            seeRawMaximum: rawMax,
            seeScaledMarks: seeRaw !== null ? Number(((seeRaw / rawMax) * SIT_SGPA_RULES.seeScaledMax).toFixed(2)) : null,
            seeScaledMaximum: SIT_SGPA_RULES.seeScaledMax,
            totalMarks: null,
            grade: 'PENDING',
            gradePoint: 0,
            creditPoints: 0,
            status: 'PENDING'
        };
    }

    // Scale SEE to 50
    const seeScaled = Number(((seeRaw / rawMax) * SIT_SGPA_RULES.seeScaledMax).toFixed(2));
    const totalMarks = Number((cieMarks + seeScaled).toFixed(2));

    // CHECK RULE 1: CIE Eligibility Override (CIE NE)
    if (!cieEligible || cieStatus === 'NOT_ELIGIBLE' || cieMarks < SIT_SGPA_RULES.cieMinThreshold) {
        return {
            registeredSubjectId: registeredSubject._id,
            subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
            subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
            credits,
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
    let gradeObj = SIT_SGPA_RULES.gradingScale.find(g => totalMarks >= g.min && totalMarks <= g.max);
    if (!gradeObj) {
        gradeObj = totalMarks < 40 ? { grade: 'F', gradePoint: 0 } : { grade: 'C', gradePoint: 5 };
    }

    const gradePoint = gradeObj.gradePoint;
    const creditPoints = Number((credits * gradePoint).toFixed(2));
    const status = gradeObj.grade === 'F' ? 'FAILED' : 'COMPLETED';

    return {
        registeredSubjectId: registeredSubject._id,
        subjectCode: registeredSubject.customCode || registeredSubject.subject?.code || 'SUBJ',
        subjectName: registeredSubject.customName || registeredSubject.subject?.name || 'Subject',
        credits,
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

    for (const sub of subjectResults) {
        if (sub.status === 'PENDING' || sub.seeRawMarks === null || sub.cieMarks === null) {
            hasPending = true;
            continue;
        }

        completedCount++;
        const credits = Number(sub.credits || 0);
        const gp = Number(sub.gradePoint || 0);

        // Include credits in denominator for subjects with credits > 0 (even if failed or NE)
        if (credits > 0) {
            totalCredits += credits;
            totalCreditPoints += (credits * gp);
        }
    }

    let sgpa = null;
    let status = 'PENDING';

    if (!hasPending && completedCount > 0 && totalCredits > 0) {
        sgpa = Number((totalCreditPoints / totalCredits).toFixed(2));
        status = 'COMPLETED';
    } else if (completedCount > 0 && totalCredits > 0) {
        // Partial SGPA if requested or previewed
        sgpa = Number((totalCreditPoints / totalCredits).toFixed(2));
        status = 'PARTIAL';
    }

    return {
        totalCredits,
        totalCreditPoints: Number(totalCreditPoints.toFixed(2)),
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
    calculateSemesterSgpa
};
