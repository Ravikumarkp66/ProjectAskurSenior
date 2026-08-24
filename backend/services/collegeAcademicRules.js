/**
 * College Academic Rules Configuration
 * Centralized, scalable institutional rules.
 * Does not hardcode values directly into the business models or frontend.
 */

const COLLEGE_ACADEMIC_RULES = {
    DEFAULT: {
        code: 'DEFAULT',
        name: 'Standard University Regulations',
        attendance: {
            minimumPercentage: 85,
            name: 'College Attendance Minimum',
            description: 'Institutional mandatory minimum attendance required to remain eligible for examinations.'
        }
    },
    SIT: {
        code: 'SIT',
        name: 'Siddaganga Institute of Technology',
        attendance: {
            minimumPercentage: 85,
            name: 'SIT College Minimum',
            description: 'Mandatory minimum 85% attendance required under autonomous academic regulations.'
        }
    }
};

/**
 * Resolves the college academic rules based on the student's college name or code.
 * @param {string} collegeCodeOrName 
 * @returns {object} College academic rules
 */
function getCollegeAcademicRules(collegeCodeOrName) {
    if (!collegeCodeOrName) return COLLEGE_ACADEMIC_RULES.DEFAULT;
    const cleanKey = String(collegeCodeOrName).trim().toUpperCase();
    
    // Exact match
    if (COLLEGE_ACADEMIC_RULES[cleanKey]) {
        return COLLEGE_ACADEMIC_RULES[cleanKey];
    }
    
    // Fuzzy match for SIT
    if (cleanKey.includes('SIT') || cleanKey.includes('SIDDAGANGA')) {
        return COLLEGE_ACADEMIC_RULES.SIT;
    }

    return COLLEGE_ACADEMIC_RULES.DEFAULT;
}

module.exports = {
    COLLEGE_ACADEMIC_RULES,
    getCollegeAcademicRules
};
