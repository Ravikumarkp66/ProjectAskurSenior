// Branches constant
export const BRANCHES = [
    { code: 'CV', name: 'Civil Engineering' },
    { code: 'CS', name: 'Computer Science and Engineering' },
    { code: 'IS', name: 'Information Science and Engineering' },
    { code: 'CI', name: 'Computer Science (AI / Allied)' },
    { code: 'BT', name: 'Biotechnology' },
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'IM', name: 'Industrial Engineering' },
    { code: 'CH', name: 'Chemical Engineering' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'EC', name: 'Electronics & Communication Engineering' },
    { code: 'ET', name: 'Electronics Technology' },
    { code: 'EI', name: 'Electronics & Instrumentation Engineering' }
];

export const toBackendBranch = (code) => {
    const value = (code || '').toString().trim().toUpperCase();
    const map = {
        CS: 'CSE',
        IS: 'ISE',
        EC: 'ECE',
        EE: 'EEE',
        ME: 'MECH',
        CV: 'CIVIL',
        CI: 'AIML'
    };
    return map[value] || value;
};

export const toUiBranch = (code) => {
    const value = (code || '').toString().trim().toUpperCase();
    const map = {
        CSE: 'CS',
        ISE: 'IS',
        ECE: 'EC',
        EEE: 'EE',
        MECH: 'ME',
        CIVIL: 'CV',
        AIML: 'CI'
    };
    return map[value] || value;
};

export const deriveBranchFromUSN = (usn) => {
    const value = (usn || '').toString().trim().toLowerCase();
    if (!value) return '';

    const match = value.match(/\d{2}(cv|cs|is|ci|bt|me|im|ch|ee|ec|et|ei)/i);
    const code = match?.[1]?.toUpperCase() || '';
    return code;
};

// Format USN - example: 1si23is080 or VTM22CS001
export const validateUSN = (usn) => {
    // Accept any alphanumeric string with 8-12 characters
    const usnRegex = /^[a-z0-9]{8,12}$/i;
    return usnRegex.test(usn);
};

// Calculate subject progress
export const calculateSubjectProgress = (modules) => {
    if (!modules || modules.length === 0) return 0;

    let totalQuestions = 0;
    let completedQuestions = 0;

    modules.forEach((module) => {
        if (module.questions) {
            totalQuestions += module.questions.length;
            completedQuestions += module.questions.filter((q) => q.completed).length;
        }
    });

    return totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
};

// Calculate module progress
export const calculateModuleProgress = (questions) => {
    if (!questions || questions.length === 0) return 0;
    const completed = questions.filter((q) => q.completed).length;
    return Math.round((completed / questions.length) * 100);
};
