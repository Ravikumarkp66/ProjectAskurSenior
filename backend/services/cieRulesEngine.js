/**
 * Central College CIE Rules Engine
 * Supports SIT evaluation configurations: IPCC, THEORY_ONLY, LAB_ONLY, LOW_THEORY
 * Entirely data-driven and scalable to future college rule variations.
 */

const SIT_CIE_CONFIG = {
    collegeId: 'SIT',
    version: '1.0.0',
    maxCieScore: 50,
    overallMinimumThreshold: 20,

    evaluationTypes: {
        IPCC: {
            id: 'IPCC',
            userFacingName: 'IPCC',
            description: 'Integrated Professional Core Course (Theory + Practical)',
            maxCie: 50,
            hasTheory: true,
            hasPractical: true,
            sections: {
                theoryMaxCie: 25,
                practicalMaxCie: 25
            },
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
            userFacingName: 'Theory',
            description: 'Theory Only Course',
            maxCie: 50,
            hasTheory: true,
            hasPractical: false,
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
            userFacingName: 'Lab',
            description: 'Practical / Laboratory Only Course',
            maxCie: 50,
            hasTheory: false,
            hasPractical: true,
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
            userFacingName: 'Low Theory',
            description: 'Low Credit Theory Course',
            maxCie: 50,
            hasTheory: true,
            hasPractical: false,
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
                    name: 'Quiz + Assignment / IA',
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
    }
};

/**
 * Determine evaluation type from registered subject
 */
function determineEvaluationType(registeredSubject) {
    if (!registeredSubject) return 'THEORY_ONLY';
    
    // Explicit evaluationType set on record
    if (registeredSubject.evaluationType && SIT_CIE_CONFIG.evaluationTypes[registeredSubject.evaluationType]) {
        return registeredSubject.evaluationType;
    }

    const category = registeredSubject.category || 'Theory';
    const credits = Number(registeredSubject.registeredCredits || 0);
    const nameLC = (registeredSubject.customName || registeredSubject.subject?.name || '').toLowerCase();
    const codeLC = (registeredSubject.customCode || registeredSubject.subject?.code || '').toLowerCase();
    const catLC = (registeredSubject.category || '').toLowerCase();

    if (catLC.includes('ncmc') || nameLC.includes('ncmc') || codeLC.includes('ncmc') || nameLC.includes('non-credit')) {
        return 'NCMC';
    }

    if (category === 'Theory + Lab') {
        return 'IPCC';
    }
    if (category === 'Lab Only') {
        return 'LAB_ONLY';
    }
    if (credits > 0 && credits <= 2 && category === 'Theory') {
        return 'LOW_THEORY';
    }
    
    return 'THEORY_ONLY';
}

/**
 * Calculate CIE contributions, eligibility, and status
 */
function calculateSubjectCie({ registeredSubject, rawMarks = {}, evaluationTypeOverride = null }) {
    const evalType = evaluationTypeOverride || determineEvaluationType(registeredSubject);
    const config = SIT_CIE_CONFIG.evaluationTypes[evalType] || SIT_CIE_CONFIG.evaluationTypes.THEORY_ONLY;

    const raw = rawMarks || {};
    const contributions = {
        tests: 0,
        quizzes: 0,
        assignments: 0,
        labRecord: 0,
        labTest: 0,
        internalAssessment: 0,
        theoryTotal: 0,
        practicalTotal: 0
    };

    const rawTotals = {};
    const failedRequirements = [];
    let totalEnteredCount = 0;
    let totalPossibleSubcomponents = 0;

    // Evaluate each component defined in config
    for (const [compKey, compConfig] of Object.entries(config.components)) {
        let compRawSum = 0;
        let compEnteredCount = 0;
        let compSubCount = compConfig.subComponents.length;
        totalPossibleSubcomponents += compSubCount;

        for (const sub of compConfig.subComponents) {
            const val = raw[sub.id];
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
            totalSubCount: compSubCount,
            minRawRequired: compConfig.minRawRequired
        };

        // If at least one mark entered for this component, calculate contribution & check threshold
        if (compEnteredCount > 0) {
            // Scaled contribution calculation
            const contribution = (compRawSum / compConfig.maxRaw) * compConfig.scaledContribution;
            contributions[compKey] = Number(contribution.toFixed(2));

            // Component min raw check
            if (compRawSum < compConfig.minRawRequired) {
                failedRequirements.push(
                    `${compConfig.name} requirement not satisfied. Required: ${compConfig.minRawRequired} / ${compConfig.maxRaw}, Current: ${compRawSum} / ${compConfig.maxRaw}`
                );
            }
        }
    }

    // Calculate section totals & overall CIE
    let totalCie = 0;

    if (evalType === 'IPCC') {
        // Theory total (Tests 34 + Quizzes 8 + Assignments 8 = 50 -> scaled to 25)
        const unscaledTheory = (contributions.tests || 0) + (contributions.quizzes || 0) + (contributions.assignments || 0);
        const theoryCie = Number((unscaledTheory / 2).toFixed(2)); // scaled to 25
        const practicalCie = Number(((contributions.labRecord || 0) + (contributions.labTest || 0)).toFixed(2)); // scaled to 25

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

    const minThreshold = config.overallMinimumThreshold || SIT_CIE_CONFIG.overallMinimumThreshold;
    const maxScore = config.maxCie || SIT_CIE_CONFIG.maxCieScore;

    // Overall CIE Minimum Check
    if (totalEnteredCount > 0 && totalCie < minThreshold) {
        failedRequirements.push(
            `Overall CIE requirement not satisfied. Required: ${minThreshold} / ${maxScore}, Current: ${totalCie} / ${maxScore}`
        );
    }

    // Determine status
    let status;
    let isEligible;

    if (totalEnteredCount === 0) {
        status = 'NOT_STARTED';
        isEligible = false;
    } else if (failedRequirements.length > 0) {
        status = 'NOT_ELIGIBLE';
        isEligible = false;
    } else if (totalEnteredCount < totalPossibleSubcomponents) {
        status = 'PARTIAL';
        isEligible = true; // Component thresholds met so far
    } else {
        status = 'ELIGIBLE';
        isEligible = true;
    }

    return {
        evaluationType: evalType,
        evalConfig: config,
        rawTotals,
        contributions,
        totalCie,
        maxCie: maxScore,
        isEligible,
        status,
        failedRequirements,
        totalEnteredCount,
        totalPossibleSubcomponents
    };
}

module.exports = {
    SIT_CIE_CONFIG,
    determineEvaluationType,
    calculateSubjectCie
};
