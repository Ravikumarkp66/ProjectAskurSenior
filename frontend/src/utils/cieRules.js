// Universal CIE Rule Engine & Grade Calculations for AskUrSenior CGPA/SGPA Calculator

export const CIE_RULES = {
    IPCC: {
        name: '4 Credit IPCC',
        type: 'IPCC',
        theoryMax: 50, // Test(34) + Quiz(8) + ABL(8)
        practicalMax: 25, // Record(15) + Test(10)
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            quiz: { count: 2, max: 40, reducedTo: 8, minTotal: 16 },
            abl: { count: 2, max: 40, reducedTo: 8, minTotal: 16 }
        },
        practical: {
            record: { max: 350, reducedTo: 15, minTotal: 140 },
            test: { max: 15, reducedTo: 10, minTotal: 6 }
        },
        scaleTheoryTo: 25, // Scale 50 -> 25
        minTotal: 20
    },
    THEORY_ONLY: {
        name: '3/4 Credit Theory Only',
        type: 'THEORY_ONLY',
        theoryMax: 50,
        practicalMax: 0,
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            quiz: { count: 2, max: 40, reducedTo: 8, minTotal: 16 },
            abl: { count: 2, max: 40, reducedTo: 8, minTotal: 16 }
        },
        minTotal: 20
    },
    LAB_ONLY: {
        name: '1/2 Credit Lab Only',
        type: 'LAB_ONLY',
        theoryMax: 0,
        practicalMax: 50,
        practical: {
            record: { max: 350, reducedTo: 35, minTotal: 140 },
            test: { max: 15, reducedTo: 15, minTotal: 6 }
        },
        minTotal: 20
    },
    LOW_THEORY: {
        name: '1/2 Credit Theory',
        type: 'LOW_THEORY',
        theoryMax: 50,
        practicalMax: 0,
        theory: {
            tests: { count: 2, max: 100, reducedTo: 34, minTotal: 40 },
            internal: { count: 2, max: 40, reducedTo: 16, minTotal: 16 } // Sum of Quiz + ABL
        },
        minTotal: 20
    }
};

export const detectSubjectType = (credits, hasLab) => {
    const cr = parseFloat(credits) || 0;
    if (cr >= 4) return "IPCC";
    if (hasLab) return "LAB_ONLY";
    if (cr >= 3) return "THEORY_ONLY";
    return "LOW_THEORY";
};

export const getGradeFromTotal = (total, seeMarks, isNE = false) => {
    if (isNE) return { grade: 'NE', points: 0, color: 'text-red-500', ne: true };
    if (seeMarks < 36) return { grade: 'F', points: 0, color: 'text-red-500', seeFail: true };

    if (total >= 90) return { grade: 'O', points: 10, color: 'text-emerald-400' };
    if (total >= 80) return { grade: 'A+', points: 9, color: 'text-green-400' };
    if (total >= 70) return { grade: 'A', points: 8, color: 'text-blue-400' };
    if (total >= 60) return { grade: 'B+', points: 7, color: 'text-cyan-400' };
    if (total >= 50) return { grade: 'B', points: 6, color: 'text-yellow-400' };
    if (total >= 40) return { grade: 'C', points: 5, color: 'text-orange-400' };
    return { grade: 'F', points: 0, color: 'text-red-500' };
};
