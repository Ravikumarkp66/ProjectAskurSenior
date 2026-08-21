/* ═══════════════════════════════════════════════════════════════════
   calculateSGPA Utility
   Pure calculation logic for semester SGPA
   ═══════════════════════════════════════════════════════════════════ */

export const GRADE_SCALE = [
    { label: 'O (10)', value: 'O', points: 10 },
    { label: 'A+ (9)', value: 'A+', points: 9 },
    { label: 'A (8)', value: 'A', points: 8 },
    { label: 'B+ (7)', value: 'B+', points: 7 },
    { label: 'B (6)', value: 'B', points: 6 },
    { label: 'C (5)', value: 'C', points: 5 },
    { label: 'P (4)', value: 'P', points: 4 },
    { label: 'F (0)', value: 'F', points: 0 },
];

export const GRADE_POINTS_MAP = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'P': 4,
    'F': 0,
};

export const getPerformanceInfo = (sgpa) => {
    const val = parseFloat(sgpa) || 0;
    if (val >= 9.0) return { label: 'Outstanding (O)', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (val >= 8.0) return { label: 'Excellent (A+)', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
    if (val >= 7.0) return { label: 'Very Good (A)', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (val >= 6.0) return { label: 'Good (B+)', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (val >= 5.0) return { label: 'Above Average (B)', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
    if (val >= 4.0) return { label: 'Pass (P)', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
    return { label: 'Re-appear (F)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
};

export const calculateSGPA = (subjects) => {
    if (!Array.isArray(subjects) || subjects.length === 0) {
        return {
            sgpa: null,
            totalCredits: 0,
            totalGradePoints: 0,
            hasFailingGrade: false,
            error: 'No subjects added to calculate.'
        };
    }

    let totalCredits = 0;
    let totalGradePoints = 0;
    let hasFailingGrade = false;

    for (const sub of subjects) {
        const credits = parseFloat(sub.credits) || 0;
        const grade = sub.grade || 'O';
        const points = GRADE_POINTS_MAP[grade] ?? 0;

        if (grade === 'F') {
            hasFailingGrade = true;
        }

        totalCredits += credits;
        totalGradePoints += (credits * points);
    }

    if (totalCredits === 0) {
        return {
            sgpa: null,
            totalCredits: 0,
            totalGradePoints: 0,
            hasFailingGrade: false,
            error: 'Total credits cannot be zero.'
        };
    }

    const sgpa = (totalGradePoints / totalCredits).toFixed(2);
    const performance = getPerformanceInfo(sgpa);

    return {
        sgpa: parseFloat(sgpa),
        totalCredits,
        totalGradePoints: parseFloat(totalGradePoints.toFixed(2)),
        hasFailingGrade,
        performance,
        error: null
    };
};
