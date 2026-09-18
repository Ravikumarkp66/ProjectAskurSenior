const { resolveActiveEvaluationRule } = require('./evaluationRuleResolver');

class CalculationError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'CalculationError';
        this.statusCode = 400;
        this.details = details;
    }
}

/**
 * Robust mathematical rounding to specified decimal places (defaults to 2).
 * Handles JavaScript floating point inaccuracies (e.g. 33.999999999999994 -> 34).
 */
function round(val, decimals = 2) {
    if (val === null || val === undefined || isNaN(val)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round((Number(val) + Number.EPSILON) * factor) / factor;
}

/**
 * Extracts and aggregates raw scores according to component configuration.
 */
function aggregateRawScore(component, rawInput, rawMax) {
    if (rawInput === undefined || rawInput === null) {
        return {
            rawScore: 0,
            isMissing: true,
            isAbsent: false,
            wasClamped: false
        };
    }

    if (rawInput === 'ABSENT' || (typeof rawInput === 'object' && rawInput.absent === true)) {
        return {
            rawScore: 0,
            isMissing: false,
            isAbsent: true,
            wasClamped: false
        };
    }

    let extractedScore = 0;

    if (typeof rawInput === 'number') {
        extractedScore = rawInput;
    } else if (Array.isArray(rawInput)) {
        const numbers = rawInput.map(n => Number(n) || 0);
        const method = component.aggregation?.method || 'SUM';

        if (method === 'BEST_N') {
            const bestN = component.aggregation?.bestN || 1;
            const sorted = [...numbers].sort((a, b) => b - a);
            extractedScore = sorted.slice(0, bestN).reduce((sum, val) => sum + val, 0);
        } else if (method === 'AVERAGE') {
            extractedScore = numbers.length > 0 ? (numbers.reduce((s, v) => s + v, 0) / numbers.length) : 0;
        } else {
            // Default SUM
            extractedScore = numbers.reduce((s, v) => s + v, 0);
        }
    } else if (typeof rawInput === 'object') {
        if (Array.isArray(rawInput.entries)) {
            return aggregateRawScore(component, rawInput.entries, rawMax);
        }
        if (rawInput.rawScore !== undefined) {
            extractedScore = Number(rawInput.rawScore) || 0;
        } else if (rawInput.score !== undefined) {
            extractedScore = Number(rawInput.score) || 0;
        }
    }

    // Safety bounds & clamping
    let wasClamped = false;
    let clampedScore = extractedScore;

    if (clampedScore > rawMax) {
        wasClamped = true;
        clampedScore = rawMax;
    } else if (clampedScore < 0) {
        wasClamped = true;
        clampedScore = 0;
    }

    return {
        rawScore: round(clampedScore, 4),
        originalRawScore: extractedScore,
        isMissing: false,
        isAbsent: false,
        wasClamped
    };
}

/**
 * Calculates converted component score from rule definition.
 */
function calculateComponent(component, rawInput, options = {}) {
    let rawMax = 0;

    // Standard Laboratory Runtime N check
    const isRuntimeNLab = component.key === 'LAB_CONDUCTION' || 
        (component.type === 'LAB_RECORD' && component.conversion?.sourceMax === 35 && component.conversion?.targetMax === 35);

    const hasExplicitN = (rawInput && typeof rawInput === 'object' && rawInput.sessionsConducted !== undefined && rawInput.sessionsConducted !== null) ||
        (options.sessionsConducted !== undefined && options.sessionsConducted !== null);

    if (isRuntimeNLab || (hasExplicitN && (!component.conversion?.sourceMax || component.conversion?.sourceMax === 35))) {
        const N = (rawInput && typeof rawInput === 'object' && rawInput.sessionsConducted !== undefined && rawInput.sessionsConducted !== null)
            ? rawInput.sessionsConducted
            : options.sessionsConducted;

        if (N === undefined || N === null) {
            throw new CalculationError('Missing required runtime parameter: sessionsConducted (N) for Standard Laboratory conduction');
        }

        const numN = Number(N);
        if (isNaN(numN) || numN <= 0) {
            throw new CalculationError(`Lab conduction sessionsConducted (N) must be greater than 0, received: ${N}`);
        }

        const marksPerSession = (component.entries && component.entries.maxMarksEach) ? component.entries.maxMarksEach : 35;
        rawMax = numN * marksPerSession;
    } else if (component.conversion?.enabled && component.conversion?.sourceMax) {
        rawMax = component.conversion.sourceMax;
    } else if (component.entryMode === 'MANUAL' && component.entries?.manualEntries?.length) {
        rawMax = component.entries.manualEntries.reduce((acc, e) => acc + (e.maxMarks || 0), 0);
    } else {
        const count = component.entries?.count || 1;
        const each = component.entries?.maxMarksEach || 50;
        rawMax = count * each;
    }

    const targetMax = (component.conversion?.enabled && component.conversion?.targetMax !== null && component.conversion?.targetMax !== undefined)
        ? component.conversion.targetMax
        : rawMax;

    const aggregation = aggregateRawScore(component, rawInput, rawMax);

    let convertedScore = 0;
    if (aggregation.isAbsent || aggregation.isMissing || rawMax === 0) {
        convertedScore = 0;
    } else if (!component.conversion?.enabled || rawMax === targetMax) {
        convertedScore = round(aggregation.rawScore, 2);
    } else {
        convertedScore = round((aggregation.rawScore / rawMax) * targetMax, 2);
    }

    return {
        key: component.key,
        name: component.name,
        type: component.type,
        rawScore: aggregation.rawScore,
        originalRawScore: aggregation.originalRawScore,
        rawMax,
        targetMax,
        convertedScore,
        isAbsent: aggregation.isAbsent,
        isMissing: aggregation.isMissing,
        wasClamped: aggregation.wasClamped
    };
}

/**
 * Finds matching score input for a component key from various flexible formats.
 */
function findComponentInput(scores = {}, componentKey = '', type = '') {
    if (!scores || typeof scores !== 'object') return undefined;

    // 1. Exact match
    if (scores[componentKey] !== undefined) return scores[componentKey];

    // 2. Case-insensitive match
    const lowerKey = componentKey.toLowerCase();
    for (const [k, v] of Object.entries(scores)) {
        if (k.toLowerCase() === lowerKey) return v;
    }

    // 3. Aliases for common keys
    if (componentKey === 'LAB_CONDUCTION' || type === 'LAB_RECORD') {
        if (scores.conduction !== undefined) return scores.conduction;
        if (scores.labConduction !== undefined) return scores.labConduction;
        if (scores.lab_conduction !== undefined) return scores.lab_conduction;
    }
    if (componentKey === 'LAB_TEST' || type === 'LAB_TEST') {
        if (scores.labTest !== undefined) return scores.labTest;
        if (scores.lab_test !== undefined) return scores.lab_test;
        if (scores.test !== undefined) return scores.test;
    }
    if (componentKey.endsWith('_SEE') || type === 'THEORY_EXAM' || type === 'PRACTICAL_EXAM') {
        if (scores.SEE !== undefined) return scores.SEE;
        if (scores.see !== undefined) return scores.see;
        if (scores.seeScore !== undefined) return scores.seeScore;
    }
    if (componentKey === 'NCMC_CIE') {
        if (scores.cie !== undefined) return scores.cie;
        if (scores.cieScore !== undefined) return scores.cieScore;
        if (scores.score !== undefined) return scores.score;
        if (scores.rawScore !== undefined) return scores.rawScore;
    }

    return undefined;
}

/**
 * Main calculation engine service: calculateStudentEvaluation
 *
 * @param {Object} input
 * @param {Object} [input.rule] - Pre-loaded AcademicEvaluationRule document/object
 * @param {string|mongoose.Types.ObjectId} [input.schemeId]
 * @param {string|mongoose.Types.ObjectId} [input.subjectId]
 * @param {string} [input.subjectCode]
 * @param {string|mongoose.Types.ObjectId} [input.groupId]
 * @param {Object} [input.student]
 * @param {Object} [input.subject]
 * @param {Object} input.scores - Component scores keyed by component key or alias
 * @param {Object|number} input.attendance - Attendance percentage or { attended, total }
 * @param {Object} [input.runtimeContext] - Runtime parameters (e.g. sessionsConducted, isNcmcCompleted)
 * @returns {Promise<Object>} Standardized evaluation calculation result
 */
async function calculateStudentEvaluation(input = {}) {
    let rule = input.rule;
    let resolvedSubject = input.subject || null;
    let resolvedGroup = null;

    // If rule not provided directly, resolve it dynamically from MongoDB
    if (!rule) {
        const resolution = await resolveActiveEvaluationRule({
            schemeId: input.schemeId,
            subjectId: input.subjectId || (input.subject && input.subject._id),
            subjectCode: input.subjectCode || (input.subject && input.subject.code),
            groupId: input.groupId
        });
        rule = resolution.rule;
        resolvedSubject = resolvedSubject || resolution.subject;
        resolvedGroup = resolution.group;
    }

    if (!rule) {
        throw new CalculationError('Unable to calculate evaluation: No AcademicEvaluationRule provided or resolved');
    }

    const scores = input.scores || {};
    const runtimeContext = input.runtimeContext || {};

    // 1. Process CIE Components
    const cieComponents = (rule.cie && rule.cie.components) ? rule.cie.components.filter(c => c.enabled !== false) : [];
    const calculatedCieComponents = [];
    let cieTotal = 0;
    let cieMax = 0;

    // Special handling for configurable SDC shell where cie.components might be empty
    if (cieComponents.length === 0) {
        // Check if direct CIE or custom rubrics passed
        if (scores.CIE !== undefined || scores.cie !== undefined || scores.SDC_CIE !== undefined) {
            const raw = scores.CIE !== undefined ? scores.CIE : (scores.cie !== undefined ? scores.cie : scores.SDC_CIE);
            const rawScoreVal = typeof raw === 'number' ? raw : (raw.rawScore || raw.score || 0);
            const wasClamped = rawScoreVal > 50;
            const scoreVal = wasClamped ? 50 : Math.max(0, rawScoreVal);
            cieTotal = round(scoreVal, 2);
            cieMax = 50;
            calculatedCieComponents.push({
                key: 'SDC_CIE_DIRECT',
                name: 'Continuous Internal Evaluation (Direct)',
                type: 'PROJECT',
                rawScore: cieTotal,
                originalRawScore: rawScoreVal,
                rawMax: 50,
                targetMax: 50,
                convertedScore: cieTotal,
                isAbsent: false,
                isMissing: false,
                wasClamped
            });
        } else if (scores.rubrics && Array.isArray(scores.rubrics)) {
            // Dynamic rubrics passed in input
            for (const rubric of scores.rubrics) {
                const rMax = rubric.maxMarks || 20;
                const rScore = rubric.score || 0;
                const conv = round(Math.min(rScore, rMax), 2);
                cieTotal += conv;
                cieMax += rMax;
                calculatedCieComponents.push({
                    key: rubric.key || rubric.name,
                    name: rubric.name || 'Rubric Component',
                    type: 'PROJECT',
                    rawScore: rScore,
                    rawMax: rMax,
                    targetMax: rMax,
                    convertedScore: conv,
                    isAbsent: false,
                    isMissing: false,
                    wasClamped: rScore > rMax
                });
            }
            cieTotal = round(cieTotal, 2);
        } else {
            cieTotal = 0;
            cieMax = 50;
        }
    } else {
        for (const comp of cieComponents) {
            const rawVal = findComponentInput(scores, comp.key, comp.type);
            const calc = calculateComponent(comp, rawVal, runtimeContext);
            calculatedCieComponents.push(calc);
            cieTotal += calc.convertedScore;
            cieMax += calc.targetMax;
        }
        cieTotal = round(cieTotal, 2);
        cieMax = round(cieMax, 2);
    }

    // 2. Process SEE Components
    const isSeeEnabled = rule.see && rule.see.enabled === true;
    const seeComponents = isSeeEnabled && rule.see.components ? rule.see.components.filter(c => c.enabled !== false) : [];
    const calculatedSeeComponents = [];
    let seeTotal = null;
    let seeMax = 0;

    if (isSeeEnabled) {
        seeTotal = 0;
        for (const comp of seeComponents) {
            const rawVal = findComponentInput(scores, comp.key, comp.type);
            const calc = calculateComponent(comp, rawVal, runtimeContext);
            calculatedSeeComponents.push(calc);
            seeTotal += calc.convertedScore;
            seeMax += calc.targetMax;
        }
        seeTotal = round(seeTotal, 2);
        seeMax = round(seeMax, 2);
    }

    // 3. Aggregate Marks
    let aggregateMarks = 0;
    let aggregateMax = 0;
    if (isSeeEnabled) {
        aggregateMarks = round(cieTotal + (seeTotal || 0), 2);
        aggregateMax = round(cieMax + seeMax, 2);
    } else {
        aggregateMarks = cieTotal;
        aggregateMax = cieMax;
    }

    // 4. Calculate Partitions (Dynamic for IPCC or any multi-domain components)
    const partitions = [];
    const theoryComps = calculatedCieComponents.filter(c => c.key.startsWith('IPCC_THEORY_') || c.type === 'THEORY_EXAM');
    const practicalComps = calculatedCieComponents.filter(c => c.key.startsWith('IPCC_LAB_') || c.type === 'LAB_RECORD' || c.type === 'LAB_TEST');

    let theoryCie = null;
    let practicalCie = null;

    if (theoryComps.length > 0 && practicalComps.length > 0) {
        const thScore = round(theoryComps.reduce((s, c) => s + c.convertedScore, 0), 2);
        const thMax = round(theoryComps.reduce((s, c) => s + c.targetMax, 0), 2);
        theoryCie = thScore;
        partitions.push({
            key: 'THEORY',
            name: 'Theory Partition',
            score: thScore,
            max: thMax,
            minRequired: 10,
            passed: thScore >= 10
        });

        const prScore = round(practicalComps.reduce((s, c) => s + c.convertedScore, 0), 2);
        const prMax = round(practicalComps.reduce((s, c) => s + c.targetMax, 0), 2);
        practicalCie = prScore;
        partitions.push({
            key: 'PRACTICAL',
            name: 'Practical Partition',
            score: prScore,
            max: prMax,
            minRequired: 10,
            passed: prScore >= 10
        });
    }

    // 5. Attendance Evaluation
    let attendancePercentage = null;
    let isAttendanceMissing = false;
    if (typeof input.attendance === 'number') {
        attendancePercentage = input.attendance;
    } else if (input.attendance && typeof input.attendance === 'object') {
        if (input.attendance.isMissing || input.attendance.percentage === null || input.attendance.percentage === undefined) {
            attendancePercentage = null;
            isAttendanceMissing = true;
        } else {
            attendancePercentage = Number(input.attendance.percentage);
        }
    } else if (input.attendance === undefined) {
        attendancePercentage = 100;
    }

    // 6. Eligibility & Passing Thresholds
    const conditionResults = [];
    const failedConditions = [];
    let isExamEligible = true;
    let isOverallPassed = true;

    if (rule.eligibility && rule.eligibility.enabled && Array.isArray(rule.eligibility.conditions)) {
        for (const condition of rule.eligibility.conditions) {
            let actual = 0;
            let passed = false;
            const threshold = condition.value;

            switch (condition.type) {
                case 'CIE_MIN':
                    actual = cieTotal;
                    passed = actual >= threshold;
                    if (!passed) isExamEligible = false;
                    break;

                case 'ATTENDANCE_MIN':
                    if (isAttendanceMissing || attendancePercentage === null) {
                        actual = null;
                        passed = true;
                    } else {
                        actual = attendancePercentage;
                        passed = actual >= threshold;
                        if (!passed) isExamEligible = false;
                    }
                    break;

                case 'SEE_MIN':
                    if (!isSeeEnabled) {
                        actual = null;
                        passed = true;
                    } else {
                        actual = seeTotal !== null ? seeTotal : 0;
                        passed = actual >= threshold;
                        if (!passed) isOverallPassed = false;
                    }
                    break;

                case 'AGGREGATE_MIN':
                    actual = aggregateMarks;
                    passed = actual >= threshold;
                    if (!passed) isOverallPassed = false;
                    break;

                case 'COMPONENT_MIN': {
                    // Check if condition refers to partition (Theory or Practical)
                    const desc = (condition.description || '').toLowerCase();
                    if (desc.includes('theory') && theoryCie !== null) {
                        actual = theoryCie;
                    } else if (desc.includes('practical') && practicalCie !== null) {
                        actual = practicalCie;
                    } else {
                        const targetKey = condition.componentKey;
                        const matchComp = calculatedCieComponents.find(c => c.key === targetKey);
                        actual = matchComp ? matchComp.convertedScore : 0;
                    }
                    passed = actual >= threshold;
                    if (!passed) isExamEligible = false;
                    break;
                }

                default:
                    passed = true;
            }

            const condRecord = {
                type: condition.type,
                componentKey: condition.componentKey,
                description: condition.description || `${condition.type} >= ${threshold}`,
                threshold,
                unit: condition.unit || 'MARKS',
                actual,
                passed
            };

            conditionResults.push(condRecord);
            if (!passed) {
                failedConditions.push(condRecord.description);
            }
        }
    }

    if (!isExamEligible) {
        isOverallPassed = false;
    }

    // 7. Grade Engine
    let letterGrade = 'F';
    let gradePoint = 0;
    let resultStatus = 'PASS';

    const gradeScaleType = rule.gradeScale?.type || 'MARK_RANGE';

    if (gradeScaleType === 'PASS_FAIL') {
        // NCMC Non-Credit completion-based evaluation
        const isExplicitComplete = scores.completed === true || scores.isCompleted === true || runtimeContext.isNcmcCompleted === true;
        const isExplicitIncomplete = scores.completed === false || scores.isCompleted === false || runtimeContext.isNcmcCompleted === false || scores.absent === true;

        const hasSubmittedCie = calculatedCieComponents.length > 0 && !calculatedCieComponents[0].isAbsent && !calculatedCieComponents[0].isMissing;

        const isCompleted = isExplicitComplete || (!isExplicitIncomplete && (hasSubmittedCie || scores.NCMC_CIE !== undefined || scores.cie !== undefined));

        if (isCompleted) {
            letterGrade = 'PP';
            gradePoint = 0;
            resultStatus = 'COMPLETED';
        } else {
            letterGrade = 'NP';
            gradePoint = 0;
            resultStatus = 'NOT_COMPLETED';
        }
    } else {
        // Standard Mark Range grading
        if (!isExamEligible) {
            letterGrade = 'F';
            gradePoint = 0;
            resultStatus = 'NOT_ELIGIBLE';
        } else if (!isOverallPassed) {
            letterGrade = 'F';
            gradePoint = 0;
            resultStatus = 'FAIL';
        } else {
            // Find grade from rule's grade scale
            const grades = (rule.gradeScale && rule.gradeScale.grades) ? [...rule.gradeScale.grades] : [];
            // Sort descending by minMarks
            grades.sort((a, b) => b.minMarks - a.minMarks);

            const matchedGrade = grades.find(g => aggregateMarks >= g.minMarks);
            if (matchedGrade) {
                letterGrade = matchedGrade.grade;
                gradePoint = matchedGrade.gradePoint;
                resultStatus = 'PASS';
            } else {
                letterGrade = 'F';
                gradePoint = 0;
                resultStatus = 'FAIL';
            }
        }
    }

    // 8. SGPA Metadata
    const contributesToSGPA = rule.contributesToSGPA !== false;
    const credits = (resolvedSubject && resolvedSubject.credits !== undefined)
        ? resolvedSubject.credits
        : (input.subject && input.subject.credits !== undefined ? input.subject.credits : 0);

    const weightedGradePoints = contributesToSGPA ? round(credits * gradePoint, 2) : 0;

    return {
        subjectId: (resolvedSubject && resolvedSubject._id) || (input.subject && input.subject._id) || null,
        subjectCode: (resolvedSubject && resolvedSubject.code) || (input.subject && input.subject.code) || null,
        evaluationRuleId: rule._id,
        ruleName: rule.name,
        evaluationGroupId: rule.evaluationGroup?._id || rule.evaluationGroup,
        pattern: resolvedGroup?.name || rule.name,
        rawInputs: {
            scores,
            attendance: input.attendance,
            runtimeContext
        },
        calculated: {
            cie: cieTotal,
            cieMax,
            see: seeTotal,
            seeMax,
            aggregate: aggregateMarks,
            aggregateMax,
            components: [...calculatedCieComponents, ...calculatedSeeComponents],
            partitions
        },
        eligibility: {
            eligible: isExamEligible,
            passed: isOverallPassed,
            failedConditions,
            conditionResults
        },
        result: {
            status: resultStatus,
            letterGrade,
            gradePoint
        },
        sgpa: {
            contributesToSGPA,
            credits,
            gradePoint,
            weightedGradePoints
        }
    };
}

module.exports = {
    calculateStudentEvaluation,
    calculateComponent,
    aggregateRawScore,
    round,
    CalculationError
};
