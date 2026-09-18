/**
 * CIE & Academic Eligibility Pure Engine
 * Source of truth for mark calculations, dynamic evaluation rules,
 * multi-criteria academic eligibility resolution, and SEE target forecasts.
 */

export const EVALUATION_CONFIGS = {
    IPCC: {
        id: 'IPCC',
        userFacingName: 'Theory + Practical (IPCC)',
        description: 'Integrated Professional Core Course',
        maxCie: 50,
        hasTheory: true,
        hasPractical: true,
        hasSee: true,
        overallMinimumThreshold: 20,
        components: {
            tests: {
                id: 'tests',
                name: 'Tests',
                maxRaw: 100,
                scaledContribution: 34,
                minRawRequired: 40,
                subComponents: [
                    { id: 'test1', name: 'Test 01', maxRaw: 50 },
                    { id: 'test2', name: 'Test 02', maxRaw: 50 }
                ]
            },
            quizzes: {
                id: 'quizzes',
                name: 'Quizzes',
                maxRaw: 40,
                scaledContribution: 8,
                minRawRequired: 16,
                subComponents: [
                    { id: 'quiz1', name: 'Quiz 01', maxRaw: 20 },
                    { id: 'quiz2', name: 'Quiz 02', maxRaw: 20 }
                ]
            },
            assignments: {
                id: 'assignments',
                name: 'Assignments / ABL',
                maxRaw: 40,
                scaledContribution: 8,
                minRawRequired: 16,
                subComponents: [
                    { id: 'assignment1', name: 'Assignment 01', maxRaw: 20 },
                    { id: 'assignment2', name: 'Assignment 02', maxRaw: 20 }
                ]
            },
            labRecord: {
                id: 'labRecord',
                name: 'Lab Record',
                maxRaw: 350,
                scaledContribution: 15,
                minRawRequired: 140,
                subComponents: [
                    { id: 'labRecord', name: 'Lab Record', maxRaw: 350 }
                ]
            },
            labTest: {
                id: 'labTest',
                name: 'Lab Test',
                maxRaw: 15,
                scaledContribution: 10,
                minRawRequired: 6,
                subComponents: [
                    { id: 'labTest', name: 'Lab Test', maxRaw: 15 }
                ]
            }
        }
    },

    THEORY_ONLY: {
        id: 'THEORY_ONLY',
        userFacingName: 'Theory Only (3-4 Credits)',
        description: 'Standard Theory Course',
        maxCie: 50,
        hasTheory: true,
        hasPractical: false,
        hasSee: true,
        overallMinimumThreshold: 20,
        components: {
            tests: {
                id: 'tests',
                name: 'Tests',
                maxRaw: 100,
                scaledContribution: 34,
                minRawRequired: 40,
                subComponents: [
                    { id: 'test1', name: 'Test 01', maxRaw: 50 },
                    { id: 'test2', name: 'Test 02', maxRaw: 50 }
                ]
            },
            quizzes: {
                id: 'quizzes',
                name: 'Quizzes',
                maxRaw: 40,
                scaledContribution: 8,
                minRawRequired: 16,
                subComponents: [
                    { id: 'quiz1', name: 'Quiz 01', maxRaw: 20 },
                    { id: 'quiz2', name: 'Quiz 02', maxRaw: 20 }
                ]
            },
            assignments: {
                id: 'assignments',
                name: 'Assignments / ABL',
                maxRaw: 40,
                scaledContribution: 8,
                minRawRequired: 16,
                subComponents: [
                    { id: 'assignment1', name: 'Assignment 01', maxRaw: 20 },
                    { id: 'assignment2', name: 'Assignment 02', maxRaw: 20 }
                ]
            }
        }
    },

    LAB_ONLY: {
        id: 'LAB_ONLY',
        userFacingName: 'Laboratory / Practical',
        description: 'Practical / Laboratory Only Course',
        maxCie: 50,
        hasTheory: false,
        hasPractical: true,
        hasSee: true,
        overallMinimumThreshold: 20,
        components: {
            labRecord: {
                id: 'labRecord',
                name: 'Lab Record',
                maxRaw: 350,
                scaledContribution: 35,
                minRawRequired: 140,
                subComponents: [
                    { id: 'labRecord', name: 'Lab Record', maxRaw: 350 }
                ]
            },
            labTest: {
                id: 'labTest',
                name: 'Lab Test',
                maxRaw: 15,
                scaledContribution: 15,
                minRawRequired: 6,
                subComponents: [
                    { id: 'labTest', name: 'Lab Test', maxRaw: 15 }
                ]
            }
        }
    },

    LOW_THEORY: {
        id: 'LOW_THEORY',
        userFacingName: 'Low Theory (1-2 Credits)',
        description: 'Low Credit Theory Course',
        maxCie: 50,
        hasTheory: true,
        hasPractical: false,
        hasSee: true,
        overallMinimumThreshold: 20,
        components: {
            tests: {
                id: 'tests',
                name: 'Tests',
                maxRaw: 100,
                scaledContribution: 34,
                minRawRequired: 40,
                subComponents: [
                    { id: 'test1', name: 'Test 01', maxRaw: 50 },
                    { id: 'test2', name: 'Test 02', maxRaw: 50 }
                ]
            },
            internalAssessment: {
                id: 'internalAssessment',
                name: 'Internal Assessment (Quiz + ABL)',
                maxRaw: 40,
                scaledContribution: 16,
                minRawRequired: 16,
                subComponents: [
                    { id: 'quiz1', name: 'Quiz / IA', maxRaw: 20 },
                    { id: 'assignment1', name: 'Assignment / ABL', maxRaw: 20 }
                ]
            }
        }
    },

    NCMC: {
        id: 'NCMC',
        userFacingName: 'NCMC Non-Credit',
        description: 'Non-Credit Mandatory Course (100% CIE, No SEE)',
        maxCie: 100,
        hasTheory: true,
        hasPractical: false,
        hasSee: false,
        overallMinimumThreshold: 40,
        components: {
            continuousAssessment: {
                id: 'continuousAssessment',
                name: 'Continuous Internal Evaluation (CIE)',
                maxRaw: 100,
                scaledContribution: 100,
                minRawRequired: 40,
                subComponents: [
                    { id: 'assessment1', name: 'Assessment 01', maxRaw: 50 },
                    { id: 'assessment2', name: 'Assessment 02', maxRaw: 50 }
                ]
            }
        }
    }
};

/**
 * Detect subject evaluation type from subject metadata
 */
export function detectEvaluationType(subject) {
    if (!subject) return 'THEORY_ONLY';
    if (subject.evaluationType && EVALUATION_CONFIGS[subject.evaluationType]) {
        return subject.evaluationType;
    }

    const credits = Number(subject.registeredCredits ?? subject.credits ?? 0);
    const category = (subject.category || '').toLowerCase();
    const nameLC = (subject.subjectName || subject.customName || subject.name || '').toLowerCase();
    const codeLC = (subject.subjectCode || subject.customCode || subject.code || '').toLowerCase();

    if (category.includes('ncmc') || nameLC.includes('ncmc') || codeLC.includes('ncmc') || nameLC.includes('non-credit')) {
        return 'NCMC';
    }
    if (category.includes('lab') && (category.includes('theory') || category.includes('+'))) {
        return 'IPCC';
    }
    if (category.includes('lab') || nameLC.includes('lab') || codeLC.includes('l')) {
        return 'LAB_ONLY';
    }
    if (credits > 0 && credits <= 2 && (category.includes('theory') || !category)) {
        return 'LOW_THEORY';
    }

    return 'THEORY_ONLY';
}

/**
 * Get full evaluation config for a subject
 */
export function getSubjectEvaluationConfig(subject) {
    if (!subject) return null;
    if (subject.evalConfig && subject.evalConfig.components) {
        return subject.evalConfig;
    }
    const type = detectEvaluationType(subject);
    return EVALUATION_CONFIGS[type] || EVALUATION_CONFIGS.THEORY_ONLY;
}

/**
 * Pure calculation of CIE marks from raw inputs and configuration
 */
export function calculateCieMarks(rawMarks = {}, config) {
    if (!config || !config.components) {
        return {
            isValid: false,
            error: 'Missing evaluation configuration'
        };
    }

    const contributions = {};
    const rawTotals = {};
    const failedRequirements = [];
    let totalEnteredCount = 0;
    let totalPossibleSubcomponents = 0;

    for (const [compKey, compConfig] of Object.entries(config.components)) {
        let compRawSum = 0;
        let compEnteredCount = 0;
        const subCount = compConfig.subComponents?.length || 1;
        totalPossibleSubcomponents += subCount;

        for (const sub of compConfig.subComponents || []) {
            const val = rawMarks[sub.id];
            if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) {
                compRawSum += Number(val);
                compEnteredCount++;
                totalEnteredCount++;
            }
        }

        rawTotals[compKey] = {
            rawSum: compRawSum,
            maxRaw: compConfig.maxRaw,
            enteredCount: compEnteredCount,
            totalSubCount: subCount,
            minRawRequired: compConfig.minRawRequired,
            name: compConfig.name
        };

        if (compEnteredCount > 0) {
            const contribution = (compRawSum / compConfig.maxRaw) * compConfig.scaledContribution;
            contributions[compKey] = Number(contribution.toFixed(2));

            // Check component threshold if all subcomponents entered
            if (compEnteredCount === subCount && compRawSum < compConfig.minRawRequired) {
                failedRequirements.push(
                    `${compConfig.name} minimum threshold not met: ${compRawSum} / ${compConfig.maxRaw} (Requires ${compConfig.minRawRequired})`
                );
            }
        } else {
            contributions[compKey] = 0;
        }
    }

    const evalType = config.id || 'THEORY_ONLY';
    let totalCie = 0;

    if (evalType === 'IPCC') {
        const unscaledTheory = (contributions.tests || 0) + (contributions.quizzes || 0) + (contributions.assignments || 0);
        const theoryCie = Number((unscaledTheory / 2).toFixed(2));
        const practicalCie = Number(((contributions.labRecord || 0) + (contributions.labTest || 0)).toFixed(2));
        contributions.theoryTotal = theoryCie;
        contributions.practicalTotal = practicalCie;
        totalCie = Number((theoryCie + practicalCie).toFixed(2));
    } else if (evalType === 'THEORY_ONLY') {
        totalCie = Number(((contributions.tests || 0) + (contributions.quizzes || 0) + (contributions.assignments || 0)).toFixed(2));
        contributions.theoryTotal = totalCie;
    } else if (evalType === 'LAB_ONLY') {
        totalCie = Number(((contributions.labRecord || 0) + (contributions.labTest || 0)).toFixed(2));
        contributions.practicalTotal = totalCie;
    } else if (evalType === 'LOW_THEORY') {
        totalCie = Number(((contributions.tests || 0) + (contributions.internalAssessment || 0)).toFixed(2));
        contributions.theoryTotal = totalCie;
    } else if (evalType === 'NCMC') {
        totalCie = Number((contributions.continuousAssessment || 0).toFixed(2));
        contributions.theoryTotal = totalCie;
    }

    const maxCie = config.maxCie || 50;
    const minThreshold = config.overallMinimumThreshold || 20;

    const isComplete = totalEnteredCount === totalPossibleSubcomponents;

    // Overall CIE Minimum Check
    if (isComplete && totalCie < minThreshold) {
        failedRequirements.push(
            `Overall CIE threshold not satisfied: ${totalCie.toFixed(2)} / ${maxCie} (Minimum required: ${minThreshold})`
        );
    }

    let status = 'NOT_STARTED';
    let isEligible = false;

    if (totalEnteredCount === 0) {
        status = 'NOT_STARTED';
        isEligible = false;
    } else if (failedRequirements.length > 0) {
        status = 'NOT_ELIGIBLE';
        isEligible = false;
    } else if (totalEnteredCount < totalPossibleSubcomponents) {
        status = 'PARTIAL';
        isEligible = true; // no failing thresholds yet
    } else {
        status = 'ELIGIBLE';
        isEligible = true;
    }

    const percentage = maxCie > 0 ? Number(((totalCie / maxCie) * 100).toFixed(1)) : 0;

    return {
        isValid: true,
        evaluationType: evalType,
        totalCie,
        maxCie,
        percentage,
        isEligible,
        status,
        contributions,
        rawTotals,
        failedRequirements,
        totalEnteredCount,
        totalPossibleSubcomponents,
        isComplete
    };
}

/**
 * Multi-criteria Academic Eligibility Resolution
 */
export function evaluateAcademicEligibility({
    cieResult,
    config,
    attendance = null,
    includeAttendance = true,
    backlogs = null,
    minAttendanceThreshold = 75
}) {
    if (!cieResult || !cieResult.isValid) {
        return {
            overallState: 'INCOMPLETE',
            label: 'Incomplete Data',
            items: []
        };
    }

    const items = [];

    // 1. CIE Requirement
    const cieThreshold = config?.overallMinimumThreshold || 20;
    const maxScore = config?.maxCie || 50;

    items.push({
        id: 'cie',
        title: 'CIE Requirement',
        state: cieResult.status === 'NOT_ELIGIBLE'
            ? 'FAILED'
            : cieResult.status === 'PARTIAL'
                ? 'IN_PROGRESS'
                : 'PASSED',
        valueText: `${cieResult.totalCie.toFixed(2)} / ${maxScore}`,
        requiredText: `Min ${cieThreshold} required`,
        description: cieResult.failedRequirements.length > 0
            ? cieResult.failedRequirements[0]
            : cieResult.isComplete
                ? 'CIE requirement satisfied'
                : `${cieResult.totalPossibleSubcomponents - cieResult.totalEnteredCount} components remaining`
    });

    // 2. Attendance Requirement
    let attendanceState = 'UNKNOWN';
    let attendanceValue = 'Not available';
    let attendanceDesc = 'Attendance records not yet tracked';

    if (!includeAttendance) {
        attendanceState = 'NOT_CHECKED';
        attendanceValue = attendance !== null && !isNaN(Number(attendance)) ? `${Number(attendance).toFixed(1)}% (Excluded)` : 'Excluded';
        attendanceDesc = 'Attendance threshold verification excluded from this check';
    } else if (attendance !== null && attendance !== undefined && !isNaN(Number(attendance))) {
        const attNum = Number(attendance);
        attendanceValue = `${attNum.toFixed(1)}%`;

        if (attNum >= minAttendanceThreshold) {
            attendanceState = 'PASSED';
            attendanceDesc = `Satisfies ${minAttendanceThreshold}% autonomous requirement`;
        } else if (attNum >= 65) {
            attendanceState = 'CONDONATION';
            attendanceDesc = `Below ${minAttendanceThreshold}% (Eligible subject to medical/academic condonation)`;
        } else {
            attendanceState = 'FAILED';
            attendanceDesc = `Attendance shortage (Below 65% critical limit)`;
        }
    }

    items.push({
        id: 'attendance',
        title: 'Attendance',
        state: attendanceState,
        valueText: attendanceValue,
        requiredText: `Min ${minAttendanceThreshold}%`,
        description: attendanceDesc
    });

    // 3. Backlogs Standing
    let backlogState = 'PASSED';
    let backlogValue = '0';
    let backlogDesc = 'No active backlogs';

    if (backlogs !== null && backlogs !== undefined && !isNaN(Number(backlogs))) {
        const blNum = Number(backlogs);
        backlogValue = `${blNum}`;
        if (blNum === 0) {
            backlogState = 'PASSED';
            backlogDesc = 'Clean academic record';
        } else if (blNum <= 4) {
            backlogState = 'WARNING';
            backlogDesc = `${blNum} active backlogs (Permitted for year progression, restricts branch change)`;
        } else {
            backlogState = 'RISK';
            backlogDesc = `${blNum} active backlogs (Exceeds 4-backlog promotion threshold)`;
        }
    }

    items.push({
        id: 'backlogs',
        title: 'Active Backlogs',
        state: backlogState,
        valueText: backlogValue,
        requiredText: '0 for branch change',
        description: backlogDesc
    });

    // 4. SEE Status / Final Resolution
    const hasSee = config?.hasSee !== false;

    if (hasSee) {
        let seeEligibleState = 'PASSED';
        let seeDesc = 'Eligible to write Semester End Exam';

        if (cieResult.status === 'NOT_ELIGIBLE') {
            seeEligibleState = 'FAILED';
            seeDesc = 'Not eligible due to CIE deficit (NE)';
        } else if (includeAttendance && attendanceState === 'FAILED') {
            seeEligibleState = 'FAILED';
            seeDesc = 'Not eligible due to attendance shortage';
        } else if (includeAttendance && attendanceState === 'CONDONATION') {
            seeEligibleState = 'CONDONATION';
            seeDesc = 'SEE eligibility pending official condonation approval';
        } else if (!cieResult.isComplete) {
            seeEligibleState = 'IN_PROGRESS';
            seeDesc = 'CIE components in progress';
        }

        items.push({
            id: 'see',
            title: 'SEE Eligibility',
            state: seeEligibleState,
            valueText: seeEligibleState === 'PASSED'
                ? 'Eligible'
                : seeEligibleState === 'CONDONATION'
                    ? 'Conditional'
                    : seeEligibleState === 'IN_PROGRESS'
                        ? 'Pending CIE'
                        : 'Not Eligible',
            description: seeDesc
        });
    } else {
        items.push({
            id: 'see',
            title: 'SEE Status',
            state: 'NOT_APPLICABLE',
            valueText: 'N/A',
            description: 'SEE not applicable (100% Continuous Internal Evaluation)'
        });
    }

    // Overall State Determination
    let overallState = 'ELIGIBLE';
    let bannerTitle = 'ELIGIBLE';
    let bannerSubtitle = hasSee ? 'Eligible for Semester End Examination' : 'Course requirements satisfied';

    const isAttendanceFailed = includeAttendance && attendanceState === 'FAILED';
    const isAttendanceCondonation = includeAttendance && attendanceState === 'CONDONATION';

    if (cieResult.status === 'NOT_ELIGIBLE' || isAttendanceFailed || backlogState === 'RISK') {
        overallState = 'NOT_ELIGIBLE';
        bannerTitle = 'NOT ELIGIBLE';
        bannerSubtitle = cieResult.status === 'NOT_ELIGIBLE'
            ? 'CIE minimum requirement not met'
            : isAttendanceFailed
                ? 'Attendance shortage blocks exam eligibility'
                : 'Backlog count exceeds academic progression limit';
    } else if (isAttendanceCondonation || backlogState === 'WARNING' || !cieResult.isComplete) {
        overallState = 'ATTENTION_REQUIRED';
        bannerTitle = !cieResult.isComplete ? 'IN PROGRESS' : 'ATTENTION REQUIRED';
        bannerSubtitle = !cieResult.isComplete
            ? 'Complete remaining CIE components to finalize eligibility'
            : isAttendanceCondonation
                ? 'Condonation approval required for SEE clearance'
                : 'Review backlog standing for branch/placement criteria';
    }

    return {
        overallState,
        bannerTitle,
        bannerSubtitle,
        items
    };
}

/**
 * Calculate required SEE marks for a target grade
 */
export function calculateSeeTarget({ currentCie, targetGrade, maxCie = 50, seeMax = 100 }) {
    const GRADE_THRESHOLDS = {
        'O': 90,
        'A+': 80,
        'A': 70,
        'B+': 60,
        'B': 50,
        'C': 40
    };

    const targetTotal = GRADE_THRESHOLDS[targetGrade];
    if (targetTotal === undefined) {
        return {
            isValid: false,
            message: 'Invalid target grade'
        };
    }

    // Standard autonomous model: CIE (out of 50) + SEE (out of 100 scaled to 50) = Total 100
    // Total = currentCie + (rawSee * 0.5)
    // rawSee = (targetTotal - currentCie) * 2
    const minPassingSeeRaw = 36; // Autonomous SEE minimum pass threshold
    const maxPossibleTotal = currentCie + (seeMax * 0.5);

    const neededSeeRaw = (targetTotal - currentCie) * 2;

    if (neededSeeRaw > seeMax) {
        return {
            isValid: true,
            status: 'IMPOSSIBLE',
            targetGrade,
            targetTotal,
            maxPossibleTotal: Number(maxPossibleTotal.toFixed(1)),
            message: `${targetGrade} is not achievable with your current CIE (${currentCie.toFixed(1)} / ${maxCie}). Maximum possible total is ${maxPossibleTotal.toFixed(1)} / 100.`
        };
    }

    if (neededSeeRaw <= minPassingSeeRaw) {
        return {
            isValid: true,
            status: 'ALREADY_ACHIEVED',
            targetGrade,
            targetTotal,
            requiredSeeRaw: minPassingSeeRaw,
            seeMax,
            message: `${targetGrade} is already achievable! You only need the mandatory minimum passing SEE mark of ${minPassingSeeRaw} / ${seeMax}.`
        };
    }

    const roundedNeeded = Math.ceil(neededSeeRaw);

    return {
        isValid: true,
        status: 'ACHIEVABLE',
        targetGrade,
        targetTotal,
        requiredSeeRaw: roundedNeeded,
        seeMax,
        message: `To achieve grade ${targetGrade}, you need at least ${roundedNeeded} / ${seeMax} in SEE.`
    };
}
