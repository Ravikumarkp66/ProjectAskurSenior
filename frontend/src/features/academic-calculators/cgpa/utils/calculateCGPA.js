/* ═══════════════════════════════════════════════════════════════════
   calculateCGPA Utility
   Pure calculation logic for Cumulative Grade Point Average (CGPA)
   ═══════════════════════════════════════════════════════════════════ */

export const calculateCGPA = (semesters) => {
    if (!Array.isArray(semesters) || semesters.length === 0) {
        return {
            cgpa: null,
            totalCredits: 0,
            totalWeightedPoints: 0,
            totalSemesters: 0,
            error: 'No semester data added.'
        };
    }

    let totalCredits = 0;
    let totalWeightedPoints = 0;
    let validSemesterCount = 0;

    for (const sem of semesters) {
        const sgpa = parseFloat(sem.sgpa);
        const credits = parseFloat(sem.credits);

        if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) {
            return {
                cgpa: null,
                totalCredits: 0,
                totalWeightedPoints: 0,
                totalSemesters: 0,
                error: `Invalid SGPA (${sem.sgpa}) for ${sem.name || 'Semester'}. SGPA must be between 0.00 and 10.00.`
            };
        }

        if (isNaN(credits) || credits <= 0) {
            return {
                cgpa: null,
                totalCredits: 0,
                totalWeightedPoints: 0,
                totalSemesters: 0,
                error: `Invalid credits (${sem.credits}) for ${sem.name || 'Semester'}. Credits must be greater than 0.`
            };
        }

        totalCredits += credits;
        totalWeightedPoints += (sgpa * credits);
        validSemesterCount++;
    }

    if (totalCredits === 0) {
        return {
            cgpa: null,
            totalCredits: 0,
            totalWeightedPoints: 0,
            totalSemesters: 0,
            error: 'Total credits cannot be zero.'
        };
    }

    const cgpa = (totalWeightedPoints / totalCredits).toFixed(2);

    return {
        cgpa: parseFloat(cgpa),
        totalCredits,
        totalWeightedPoints: parseFloat(totalWeightedPoints.toFixed(2)),
        totalSemesters: validSemesterCount,
        error: null
    };
};
