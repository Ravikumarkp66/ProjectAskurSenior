import { describe, it, expect } from 'vitest';
import { detectSubjectType, calculateCIEFromMarks } from '../cieEngine.js';

describe('CIE Engine (Frontend)', () => {
    it('CIE-UNIT-001: detectSubjectType correctly classifies courses based on credits and name', () => {
        // 4 credits, regular course -> IPCC
        expect(detectSubjectType(4, false, 'Database Management Systems')).toBe('IPCC');
        
        // 3 credits theory -> THEORY_ONLY
        expect(detectSubjectType(3, false, 'Operating Systems')).toBe('THEORY_ONLY');
        
        // 1 or 2 credits with "lab" in name -> LAB_ONLY
        expect(detectSubjectType(1.5, true, 'Data Structures Laboratory')).toBe('LAB_ONLY');
        expect(detectSubjectType(2, true, 'Design and Analysis of Algorithms Lab')).toBe('LAB_ONLY');
        
        // 1 or 2 credits without lab in name -> LOW_THEORY
        expect(detectSubjectType(2, false, 'Constitution of India')).toBe('LOW_THEORY');
        
        // Edge case: 4-credit explicit lab course -> LAB_ONLY
        expect(detectSubjectType(4, true, 'Advanced Software Project Practical')).toBe('LAB_ONLY');
        
        // Edge case: 0 / missing credits fallback -> LOW_THEORY
        expect(detectSubjectType(0, false, '')).toBe('LOW_THEORY');
        expect(detectSubjectType(null, false, null)).toBe('LOW_THEORY');
    });

    it('CIE-UNIT-002: calculateCIEFromMarks computes valid THEORY_ONLY marks and eligibility', () => {
        // 3-credit theory subject
        // Tests: max 100, reducedTo 34, min 40
        // Quiz: max 40, reducedTo 8, min 16
        // ABL: max 40, reducedTo 8, min 16
        const marks = {
            test1: 45,
            test2: 45, // testSum = 90/100 -> reduced = 30.6
            quiz1: 15,
            quiz2: 15, // quizSum = 30/40 -> reduced = 6.0
            abl1: 15,
            abl2: 15   // ablSum = 30/40 -> reduced = 6.0
        };

        const result = calculateCIEFromMarks(marks, 3, false, 'Computer Networks');

        expect(result.type).toBe('THEORY_ONLY');
        expect(result.cieMax).toBe(50);
        expect(result.cie).toBe(42.6);
        expect(result.isEligible).toBe(true);
        expect(result.components.test.pass).toBe(true);
        expect(result.components.quiz.pass).toBe(true);
        expect(result.components.abl.pass).toBe(true);
    });

    it('CIE-UNIT-003: calculateCIEFromMarks correctly scales IPCC theory to 25 and adds practical', () => {
        // 4-credit IPCC course:
        // Theory exact is scaled from max 50 to 25
        // Practical: record max 350 -> reducedTo 15; test max 15 -> reducedTo 10
        const marks = {
            test1: 50,
            test2: 50, // testSum = 100 -> 34.0
            quiz1: 20,
            quiz2: 20, // quizSum = 40 -> 8.0
            abl1: 20,
            abl2: 20, // ablSum = 40 -> 8.0
            // theoryExact = 34 + 8 + 8 = 50. Scaled to 25 -> 25.0
            labs: [350], // labSum = 350 -> 15.0
            labTests: [15] // testSumP = 15 -> 10.0
            // practicalExact = 15 + 10 = 25.0
            // total cie = 25.0 + 25.0 = 50.0
        };

        const result = calculateCIEFromMarks(marks, 4, false, 'Full Stack Development');

        expect(result.type).toBe('IPCC');
        expect(result.cieMax).toBe(50);
        expect(result.cie).toBe(50);
        expect(result.isEligible).toBe(true);
        expect(result.components.labs.reduced).toBe(15);
        expect(result.components.labTests.reduced).toBe(10);
    });

    it('CIE-UNIT-004: calculateCIEFromMarks enforces component minimum threshold requirement', () => {
        // Student scores well in quiz and abl, but fails the test minimum (39 < 40)
        const marks = {
            test1: 20,
            test2: 19, // testSum = 39 < 40 min required -> pass = false
            quiz1: 20,
            quiz2: 20, // quizSum = 40 -> 8.0
            abl1: 20,
            abl2: 20  // ablSum = 40 -> 8.0
        };

        const result = calculateCIEFromMarks(marks, 3, false, 'Operating Systems');

        // Total CIE is 13.3 + 8 + 8 = 29.3, which is > minTotal (20)
        // But test component minimum was not satisfied
        expect(result.components.test.pass).toBe(false);
        expect(result.isEligible).toBe(false);
    });

    it('CIE-UNIT-005: calculateCIEFromMarks handles empty or missing inputs gracefully without NaN', () => {
        const emptyMarks = {};
        const result = calculateCIEFromMarks(emptyMarks, 3, false, 'Compiler Design');

        expect(result.cie).toBe(0);
        expect(result.isEligible).toBe(false);
        expect(Number.isNaN(result.cie)).toBe(false);
    });
});
