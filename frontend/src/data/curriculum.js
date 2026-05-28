export const ISE_3RD_SEM_SUBJECTS = [
    { code: 'S3MAT1', name: 'Statistics and Probability', credits: 3, hasLab: false },
    { code: 'S3ISI01', name: 'Digital Circuits and Computer Organization', credits: 4, hasLab: true },
    { code: 'S3ISI02', name: 'Advanced Web Technology and Internet Applications', credits: 4, hasLab: true },
    { code: 'S3IS01', name: 'Data Structures', credits: 3, hasLab: false },
    { code: 'S3ISL01', name: 'Data Structures Laboratory', credits: 1, hasLab: true },
    { code: 'S3ISES03', name: 'Object Oriented Programming with Java', credits: 3, hasLab: false },
    { code: 'SHS01', name: 'Social Connect and Responsibility', credits: 1, hasLab: false },
    { code: 'S3ISA03', name: 'Unix and Shell Programming', credits: 1, hasLab: false },
    { code: 'SMC01 / SMC02 / SMC03', name: 'NSS / PE / Yoga', credits: 0, hasLab: false }
];

export const ISE_4TH_SEM_SUBJECTS = [
    { code: 'S4IS01', name: 'Operating System', credits: 3, hasLab: false },
    { code: 'S4ISI01', name: 'Design and Analysis of Algorithms', credits: 4, hasLab: true },
    { code: 'S4ISI02', name: 'ARM Processor and Microcontroller', credits: 4, hasLab: true },
    { code: 'S4ISL02', name: 'Data Visualization Laboratory', credits: 1, hasLab: true },
    { code: 'S4ISES01', name: 'Discrete Mathematical Structures', credits: 3, hasLab: false },
    { code: 'S4CCA01', name: 'Biology for Engineers', credits: 3, hasLab: false },
    { code: 'SHS02', name: 'Universal Human Values Course', credits: 1, hasLab: false },
    {
        code: 'S4ISA02',
        name: 'Mobile Application Development',
        credits: 1,
        hasLab: false,
        isElective: true,
        options: [
            { name: 'Mobile Application Development', code: 'S4ISA02' },
            { name: 'Natural Language Processing', code: 'S4ISA04' }
        ]
    },
    { code: 'SMC01 / SMC02 / SMC03', name: 'NSS / PE / Yoga', credits: 0, hasLab: false }
];

export const ISE_5TH_SEM_SUBJECTS = [
    { code: 'HSIS01', name: 'Software Engineering and Project Management', credits: 3, hasLab: false },
    { code: 'S5IS01', name: 'Artificial Intelligence and Machine Learning (Integrated)', credits: 4, hasLab: true },
    { code: 'S5IS02', name: 'Database Management System (Integrated)', credits: 4, hasLab: true },
    { code: 'S5ISL01', name: 'Design Thinking and User Experience Lab', credits: 1, hasLab: true },
    { code: 'S5ISPEC011', name: 'Data Communication', credits: 3, hasLab: false },
    { code: 'S6ISMP', name: 'Mini Project / Extension Survey Project', credits: 2, hasLab: false },
    { code: 'AEC', name: 'Research Methodology and IPR', credits: 3, hasLab: false },
    { code: 'HS06', name: 'Environmental Studies', credits: 2, hasLab: false },
    { code: 'HS', name: 'Soft Skills', credits: 0, hasLab: false },
    { code: 'SMC01 / SMC02 / SMC03', name: 'NSS / PE / Yoga', credits: 0, hasLab: false }
];

export const ISE_6TH_SEM_SUBJECTS = [
    { code: 'S6IS01', name: 'Big Data Analytics (Integrated)', credits: 4, hasLab: true },
    { code: 'S6IS02', name: 'Computer Networks', credits: 4, hasLab: true },
    { code: 'S6ISPEC021', name: 'AWS Cloud', credits: 3, hasLab: false },
    { code: 'S6ISPEC022', name: 'Generative AI and Prompt Engineering', credits: 3, hasLab: false },
    { code: 'OECX', name: 'Open Elective Course-I', credits: 3, hasLab: false },
    { code: 'S6ISMP-I', name: 'Major Project Phase-I', credits: 2, hasLab: false },
    { code: 'PCCL', name: 'Computer Networks Laboratory', credits: 1, hasLab: true },
    { code: 'ARAS', name: 'Aptitude Related Analytical Skill', credits: 1, hasLab: false },
    { code: 'SMC01 / SMC02 / SMC03', name: 'NSS / PE / Yoga', credits: 0, hasLab: false }
];

export const CSE_3RD_SEM_SUBJECTS = [
    { code: '3SMA4TC', name: 'Statistics and Probability', credits: 4, hasLab: false },
    { code: '3SCS01', name: 'Operating Systems', credits: 3, hasLab: false },
    { code: '3SCS02', name: 'Digital Circuits and Computer Organization', credits: 3, hasLab: false },
    { code: '3SCS03', name: 'Data Structures and Applications', credits: 3, hasLab: false },
    { code: '3SCSL01', name: 'Data Structures Laboratory', credits: 1, hasLab: true },
    { code: '3ESC01', name: 'Engineering Science Course', credits: 3, hasLab: false },
    { code: '3UHV01', name: 'Social Connect and Responsibility', credits: 1, hasLab: false },
    { code: 'AEC03', name: 'Ability Enhancement Course III', credits: 1, hasLab: false }
];

export const CSE_4TH_SEM_SUBJECTS = [
    { code: '4SCS01', name: 'Design and Analysis of Algorithms', credits: 3, hasLab: false },
    { code: '4SCS02', name: 'Microcontroller and Embedded Systems', credits: 3, hasLab: false },
    { code: '4SCS03', name: 'Theory of Computation', credits: 3, hasLab: false },
    { code: '4SCSL01', name: 'Design and Analysis of Algorithms Laboratory', credits: 1, hasLab: true },
    { code: '4ESC01', name: 'Engineering Science Course', credits: 3, hasLab: false },
    { code: '4BSC01', name: 'Biology for Engineers', credits: 3, hasLab: false },
    { code: '4UHV01', name: 'Universal Human Values', credits: 1, hasLab: false },
    { code: 'AEC04', name: 'Ability Enhancement Course IV', credits: 1, hasLab: false }
];

export const CSE_5TH_SEM_SUBJECTS = [
    { code: '5SCS01', name: 'Software Engineering and Project Management', credits: 3, hasLab: false },
    { code: '5SCS02', name: 'Database Management System', credits: 3, hasLab: false },
    { code: '5SCS03', name: 'Artificial Intelligence and Machine Learning', credits: 3, hasLab: false },
    { code: '5SCSL01', name: 'Data Science with Python Lab', credits: 1, hasLab: true },
    {
        code: 'PEC1',
        name: 'Professional Elective I',
        credits: 3,
        hasLab: false,
        isElective: true,
        options: [
            { name: 'Compiler Design', code: '5CSPE01' },
            { name: 'Software Testing', code: '5CSPE02' },
            { name: 'Computer Graphics and Image Processing', code: '5CSPE03' },
            { name: 'Information Retrieval', code: '5CSPE04' }
        ]
    },
    { code: 'PROJ01', name: 'Mini Project / Extension Survey Project', credits: 2, hasLab: false },
    { code: 'HS05', name: 'Research Methodology and IPR', credits: 2, hasLab: false },
    { code: 'HS06', name: 'Environmental Studies', credits: 2, hasLab: false }
];

export const CSE_6TH_SEM_SUBJECTS = [
    { code: '6SCS01', name: 'Computer Networks', credits: 3, hasLab: false },
    { code: '6SCS02', name: 'Internet of Things', credits: 3, hasLab: false },
    {
        code: 'PEC2',
        name: 'Professional Elective II',
        credits: 3,
        hasLab: false,
        isElective: true,
        options: [
            { name: 'High Performance Computing', code: '6CSPE01' },
            { name: 'Blockchain Technology', code: '6CSPE02' },
            { name: 'Cloud Computing', code: '6CSPE03' },
            { name: 'Cryptography and Network Security', code: '6CSPE04' }
        ]
    },
    { code: 'OEC1', name: 'Open Elective', credits: 3, hasLab: false },
    { code: 'PROJ02', name: 'Major Project Phase I', credits: 2, hasLab: false },
    { code: '6SCSL01', name: 'Mobile Application Development Lab', credits: 1, hasLab: true },
    { code: 'AEC06', name: 'Aptitude Related Analytical Skill', credits: 1, hasLab: false }
];

export const PREFILLED_CURRICULUM = {
    'IS': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS, '5': ISE_5TH_SEM_SUBJECTS, '6': ISE_6TH_SEM_SUBJECTS },
    'ISE': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS, '5': ISE_5TH_SEM_SUBJECTS, '6': ISE_6TH_SEM_SUBJECTS },
    'CS': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS },
    'CSE': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS }
};
