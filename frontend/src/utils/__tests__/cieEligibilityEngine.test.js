import { describe, it, expect } from 'vitest';
import {
    detectEvaluationType,
    getSubjectEvaluationConfig,
    calculateCieMarks,
    evaluateAcademicEligibility,
    calculateSeeTarget
} from '../cieEligibilityEngine.js';

describe('CIE & Eligibility Pure Engine', () => {
    describe('1. detectEvaluationType & getSubjectEvaluationConfig', () => {
        it('identifies explicit evaluationType on subject', () => {
            expect(detectEvaluationType({ evaluationType: 'IPCC' })).toBe('IPCC');
            expect(detectEvaluationType({ evaluationType: 'NCMC' })).toBe('NCMC');
        });

        it('identifies NCMC non-credit mandatory courses', () => {
            expect(detectEvaluationType({ subjectName: 'Environmental Studies (NCMC)', credits: 0 })).toBe('NCMC');
            expect(detectEvaluationType({ subjectCode: 'ETC-NCMC-01', credits: 0 })).toBe('NCMC');
            expect(detectEvaluationType({ category: 'NCMC', credits: 0 })).toBe('NCMC');
        });

        it('identifies IPCC courses', () => {
            expect(detectEvaluationType({ category: 'Theory + Lab', credits: 4 })).toBe('IPCC');
        });

        it('identifies LAB_ONLY courses', () => {
            expect(detectEvaluationType({ category: 'Lab Only', credits: 1.5 })).toBe('LAB_ONLY');
            expect(detectEvaluationType({ subjectName: 'Data Structures Laboratory', credits: 1.5 })).toBe('LAB_ONLY');
        });

        it('identifies LOW_THEORY courses (<= 2 credits)', () => {
            expect(detectEvaluationType({ category: 'Theory', credits: 2 })).toBe('LOW_THEORY');
        });

        it('identifies standard THEORY_ONLY courses (3+ credits)', () => {
            expect(detectEvaluationType({ category: 'Theory', credits: 3 })).toBe('THEORY_ONLY');
        });
    });

    describe('2. calculateCieMarks across Evaluation Types', () => {
        it('calculates standard THEORY_ONLY passing marks', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const marks = {
                test1: 45,
                test2: 45, // 90/100 -> 30.6
                quiz1: 15,
                quiz2: 15, // 30/40 -> 6.0
                assignment1: 15,
                assignment2: 15 // 30/40 -> 6.0
            };
            const res = calculateCieMarks(marks, config);
            expect(res.totalCie).toBe(42.6);
            expect(res.maxCie).toBe(50);
            expect(res.percentage).toBe(85.2);
            expect(res.isEligible).toBe(true);
            expect(res.status).toBe('ELIGIBLE');
            expect(res.isComplete).toBe(true);
        });

        it('calculates IPCC course with scaled theory and practical components', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory + Lab', credits: 4 });
            const marks = {
                test1: 50,
                test2: 50, // 100/100 -> 34
                quiz1: 20,
                quiz2: 20, // 40/40 -> 8
                assignment1: 20,
                assignment2: 20, // 40/40 -> 8
                // Unscaled theory sum = 50 -> scaled /25 = 25
                labRecord: 350, // 350/350 -> 15
                labTest: 15 // 15/15 -> 10
                // Practical sum = 25
            };
            const res = calculateCieMarks(marks, config);
            expect(res.contributions.theoryTotal).toBe(25);
            expect(res.contributions.practicalTotal).toBe(25);
            expect(res.totalCie).toBe(50);
            expect(res.percentage).toBe(100);
            expect(res.isEligible).toBe(true);
        });

        it('calculates NCMC 100% CIE course with no SEE', () => {
            const config = getSubjectEvaluationConfig({ category: 'NCMC', credits: 0 });
            expect(config.hasSee).toBe(false);
            expect(config.maxCie).toBe(100);

            const marks = {
                assessment1: 42,
                assessment2: 38 // sum = 80 / 100
            };
            const res = calculateCieMarks(marks, config);
            expect(res.totalCie).toBe(80);
            expect(res.maxCie).toBe(100);
            expect(res.percentage).toBe(80);
            expect(res.isEligible).toBe(true);
            expect(res.status).toBe('ELIGIBLE');
        });

        it('flags failure when component minimum threshold is not met', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const marks = {
                test1: 18,
                test2: 18, // 36 < 40 minimum
                quiz1: 20,
                quiz2: 20,
                assignment1: 20,
                assignment2: 20
            };
            const res = calculateCieMarks(marks, config);
            expect(res.isEligible).toBe(false);
            expect(res.status).toBe('NOT_ELIGIBLE');
            expect(res.failedRequirements.length).toBeGreaterThan(0);
        });

        it('handles partial marks gracefully without turning unentered components into 0', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const partialMarks = {
                test1: 38,
                quiz1: 18
            };
            const res = calculateCieMarks(partialMarks, config);
            expect(res.status).toBe('PARTIAL');
            expect(res.isComplete).toBe(false);
            expect(res.totalEnteredCount).toBe(2);
            expect(res.totalPossibleSubcomponents).toBe(6);
        });

        it('distinguishes 0 marks from empty missing marks', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const marksWithZero = {
                test1: 0,
                test2: 0,
                quiz1: 0,
                quiz2: 0,
                assignment1: 0,
                assignment2: 0
            };
            const res = calculateCieMarks(marksWithZero, config);
            expect(res.totalCie).toBe(0);
            expect(res.percentage).toBe(0);
            expect(res.status).toBe('NOT_ELIGIBLE');
            expect(res.isComplete).toBe(true);
        });
    });

    describe('3. evaluateAcademicEligibility Resolution', () => {
        it('resolves ELIGIBLE state when CIE, Attendance, and Backlogs are satisfied', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const cieResult = {
                isValid: true,
                isEligible: true,
                status: 'ELIGIBLE',
                isComplete: true,
                totalCie: 42,
                failedRequirements: [],
                totalPossibleSubcomponents: 6,
                totalEnteredCount: 6
            };
            const resolution = evaluateAcademicEligibility({
                cieResult,
                config,
                attendance: 87.4,
                backlogs: 0,
                minAttendanceThreshold: 75
            });

            expect(resolution.overallState).toBe('ELIGIBLE');
            expect(resolution.bannerTitle).toBe('ELIGIBLE');

            const attItem = resolution.items.find(i => i.id === 'attendance');
            expect(attItem.state).toBe('PASSED');
            expect(attItem.valueText).toBe('87.4%');

            const blItem = resolution.items.find(i => i.id === 'backlogs');
            expect(blItem.state).toBe('PASSED');
            expect(blItem.valueText).toBe('0');
        });

        it('flags CONDONATION when attendance is in 65% - 75% window', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const cieResult = {
                isValid: true,
                isEligible: true,
                status: 'ELIGIBLE',
                isComplete: true,
                totalCie: 40,
                failedRequirements: [],
                totalPossibleSubcomponents: 6,
                totalEnteredCount: 6
            };
            const resolution = evaluateAcademicEligibility({
                cieResult,
                config,
                attendance: 71.5,
                backlogs: 0,
                minAttendanceThreshold: 75
            });

            expect(resolution.overallState).toBe('ATTENTION_REQUIRED');
            const attItem = resolution.items.find(i => i.id === 'attendance');
            expect(attItem.state).toBe('CONDONATION');
        });

        it('does NOT treat missing attendance as 0% or failure', () => {
            const config = getSubjectEvaluationConfig({ category: 'Theory', credits: 3 });
            const cieResult = {
                isValid: true,
                isEligible: true,
                status: 'ELIGIBLE',
                isComplete: true,
                totalCie: 42,
                failedRequirements: [],
                totalPossibleSubcomponents: 6,
                totalEnteredCount: 6
            };
            const resolution = evaluateAcademicEligibility({
                cieResult,
                config,
                attendance: null,
                backlogs: 0
            });

            const attItem = resolution.items.find(i => i.id === 'attendance');
            expect(attItem.state).toBe('UNKNOWN');
            expect(attItem.valueText).toBe('Not available');
            expect(resolution.overallState).toBe('ELIGIBLE'); // not falsely failed
        });

        it('displays SEE not applicable for NCMC course', () => {
            const config = getSubjectEvaluationConfig({ category: 'NCMC', credits: 0 });
            const cieResult = {
                isValid: true,
                isEligible: true,
                status: 'ELIGIBLE',
                isComplete: true,
                totalCie: 75,
                failedRequirements: [],
                totalPossibleSubcomponents: 2,
                totalEnteredCount: 2
            };
            const resolution = evaluateAcademicEligibility({
                cieResult,
                config,
                attendance: 90,
                backlogs: 0
            });

            const seeItem = resolution.items.find(i => i.id === 'see');
            expect(seeItem.state).toBe('NOT_APPLICABLE');
            expect(seeItem.valueText).toBe('N/A');
        });
    });

    describe('4. calculateSeeTarget Forecasting', () => {
        it('calculates required SEE mark for achievable target', () => {
            // Target A (70). CIE = 40. Needed = (70 - 40) * 2 = 60 / 100
            const res = calculateSeeTarget({ currentCie: 40, targetGrade: 'A' });
            expect(res.status).toBe('ACHIEVABLE');
            expect(res.requiredSeeRaw).toBe(60);
        });

        it('detects impossible target when required SEE > 100', () => {
            // Target O (90). CIE = 25. Needed = (90 - 25) * 2 = 130 > 100 -> impossible!
            const res = calculateSeeTarget({ currentCie: 25, targetGrade: 'O' });
            expect(res.status).toBe('IMPOSSIBLE');
            expect(res.maxPossibleTotal).toBe(75);
        });

        it('detects already achieved target requiring only minimum passing SEE mark (36)', () => {
            // Target C (40). CIE = 45. Target is already satisfied, needs min 36/100 to pass SEE.
            const res = calculateSeeTarget({ currentCie: 45, targetGrade: 'C' });
            expect(res.status).toBe('ALREADY_ACHIEVED');
            expect(res.requiredSeeRaw).toBe(36);
        });
    });
});
