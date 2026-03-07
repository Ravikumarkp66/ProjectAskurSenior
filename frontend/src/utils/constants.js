// Branches constant
export const ISE_3RD_SEM_SUBJECTS = [
    { code: 'S3MAT1', name: 'Statistics and Probability', credits: 3, hasLab: false, semester: '3rd Sem' },
    { code: 'S3ISI01', name: 'Digital Circuits and Computer Organization', credits: 4, hasLab: true, semester: '3rd Sem' },
    { code: 'S3ISI02', name: 'Advanced Web Technology and Internet Applications', credits: 4, hasLab: true, semester: '3rd Sem' },
    { code: 'S3IS01', name: 'Data Structures', credits: 3, hasLab: false, semester: '3rd Sem' },
    { code: 'S3ISL01', name: 'Data Structures Laboratory', credits: 1, hasLab: true, semester: '3rd Sem' },
    { code: 'S3ISES03', name: 'Object Oriented Programming with Java', credits: 3, hasLab: false, semester: '3rd Sem' },
    { code: 'SHS01', name: 'Social Connect and Responsibility', credits: 1, hasLab: false, semester: '3rd Sem' },
    { code: 'S3ISA03', name: 'Unix and Shell Programming', credits: 1, hasLab: false, semester: '3rd Sem' },
];

export const ISE_4TH_SEM_SUBJECTS = [
    { code: 'S4IS01', name: 'Operating System', credits: 3, hasLab: false, semester: '4th Sem' },
    { code: 'S4ISI01', name: 'Design and Analysis of Algorithms', credits: 4, hasLab: true, semester: '4th Sem' },
    { code: 'S4ISI02', name: 'ARM Processor and Microcontroller', credits: 4, hasLab: true, semester: '4th Sem' },
    { code: 'S4ISL02', name: 'Data Visualization Laboratory', credits: 1, hasLab: true, semester: '4th Sem' },
    { code: 'S4ISES01', name: 'Discrete Mathematical Structures', credits: 3, hasLab: false, semester: '4th Sem' },
    { code: 'S4CCA01', name: 'Biology for Engineers', credits: 3, hasLab: false, semester: '4th Sem' },
    { code: 'SHS02', name: 'Universal Human Values Course', credits: 1, hasLab: false, semester: '4th Sem' },
    { code: 'S4ISA02', name: 'Mobile Application Development', credits: 1, hasLab: false, semester: '4th Sem' },
    { code: 'S4ISA04', name: 'Natural Language Processing', credits: 1, hasLab: false, semester: '4th Sem' },
];

export const ALL_KNOWN_SUBJECTS = [
    ...ISE_3RD_SEM_SUBJECTS,
    ...ISE_4TH_SEM_SUBJECTS,
];

export const FIRST_YEAR_SUBJECTS = [
    'Engineering Physics', 'Physics', '18PHY', '22PHY', '21PHY', 'Scientific Foundations of Health', 'Health',
    'Engineering Chemistry', 'Chemistry', '18CHE', '22CHE', '21CHE',
    'Mathematics-I', 'Maths-I', 'Math-I', '18MAT11', '21MAT11', '22MAT11',
    'Mathematics-II', 'Maths-II', 'Math-II', '18MAT21', '21MAT21', '22MAT21',
    'CAED', 'Graphics', 'Engineering Drawing', 'Computer Aided Engineering Drawing',
    'C Programming', 'Problem Solving through C', 'CPS', 'PPS', 'Python Programming', 'Structured Programming in C',
    'Basic Electrical', 'Electrical Engineering', 'BEE',
    'Basic Electronics', 'Electronics Engineering', 'ELN', 'Introduction to Electronics', 'Fundamentals of Electronics',
    'Mechanical Engineering', 'Elements of Mechanical', 'EME', 'Applied Mechanics', 'Mechanics',
    'Civil Engineering', 'Elements of Civil', 'CIV',
    'English', 'Technical English', 'Communication Skills', 'Soft Skills',
    'Kannada', 'Kali Kannada', 'Arivu Kannada',
    'Environmental Studies', 'EVS',
    'Constitution of India', 'CIP', 'Indian Constitution', 'Engineering Ethics',
    'Innovation and Design Thinking',
    'Introduction to AI', 'Cyber Security',
    'Building Materials', 'Concrete Technology', 'Essentials of Information Technology', 'IT'
];


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
    { code: 'ET', name: 'Electronics and Telecommunication' },
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
        CI: 'AIML',
        BT: 'BT',
        IM: 'IM',
        CH: 'CH',
        ET: 'ETC',
        EI: 'EIE'
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
        AIML: 'CI',
        BT: 'BT',
        IM: 'IM',
        CH: 'CH',
        ETC: 'ET',
        EIE: 'EI'
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
