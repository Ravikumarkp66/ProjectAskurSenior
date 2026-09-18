/**
 * First-Year Subject Metadata & Module Titles Authority
 * 
 * Provides branch-specific course codes, names, and module titles
 * for Semester 1 and Semester 2 subjects (Maths, Physics, Chemistry, C, Python, AI, etc.)
 */

const FIRST_YEAR_MODULE_TITLES = {
    // Mathematics Stream Codes
    AMC1: [
        'Polar Curves and Curvature',
        'Series Expansion, Indeterminate Forms and Multivariable Calculus',
        'Ordinary Differential Equations of First Order',
        'Ordinary Differential Equations of Higher Order',
        'Linear Algebra'
    ],
    AMS1: [
        'Calculus',
        'Vector Calculus',
        'System of Linear Equations, Eigen Values & Eigen Vectors',
        'Vector Space',
        'Linear Transformation'
    ],
    AMM1: [
        'Polar Curves and Curvature',
        'Series Expansion, Indeterminate Forms and Multivariable Calculus',
        'Ordinary Differential Equations of First Order',
        'Ordinary Differential Equations of Higher Order',
        'Linear Algebra'
    ],
    AME1: [
        'Differential Calculus',
        'Power Series Expansions, Indeterminate Forms and Multivariable Calculus',
        'Ordinary Differential Equations (ODE) of First Order and First Degree and Nonlinear ODE',
        'Ordinary Differential Equations of Higher Order',
        'Linear Algebra'
    ],
    AMC2: [
        'Integral Calculus',
        'Partial Differential Equations',
        'Vector Calculus',
        'Numerical Methods - 1',
        'Numerical Methods - 2'
    ],
    AMS2: [
        'Introduction to Numerical Methods',
        'Numerical Solutions for System of Linear Equations',
        'Interpolation',
        'Differential Equations of First and Higher Order',
        'Numerical Integration and Numerical Solution of Differential Equations'
    ],
    AMM2: [
        'Integral Calculus',
        'Partial Differential Equations (PDE)',
        'Vector Calculus',
        'Numerical Methods - 1',
        'Numerical Methods - 2'
    ],
    AME2: [
        'Integral Calculus and its Applications',
        'Vector Calculus and its Applications',
        'Numerical Methods - 1',
        'Numerical Methods - 2',
        'Laplace Transform'
    ],

    // Physics Stream Codes
    APC: [
        'Elasticity',
        'Oscillations & Waves',
        'Acoustics, Radiometry and Photometry',
        'Non-Destructive Testing and Shock Waves',
        'Material Characterisation and Instrumentation Techniques'
    ],
    APS: [
        'Quantum Mechanics',
        'Electrical Properties of Metals & Semiconductors',
        'Superconductivity',
        'Photonics',
        'Quantum Computing'
    ],
    APM: [
        'Elasticity',
        'Laser and Optical Fiber',
        'Oscillations and Shock Waves',
        'Thermoelectric Materials and Devices',
        'Material Characterisation and Instrumentation Techniques'
    ],
    APEE: [
        'Dielectric and Magnetic Materials',
        'Thermoelectric Materials and Devices',
        'Electrical Properties of Metals',
        'Semiconductors',
        'Superconductivity'
    ],
    APEC: [
        'Quantum Mechanics',
        'Electrical Properties of Metals & Semiconductors',
        'Superconductivity',
        'Photonics',
        'Semiconductor Devices and Sensors'
    ],

    // Chemistry Stream Codes
    ACC: [
        'Water Chemistry and Analytical Techniques',
        'Conventional & Sustainable Construction Materials',
        'Materials for Structural Integrity',
        'Corrosion Science and Surface Protection',
        'Energy Systems and Green Fuels'
    ],
    ACS: [
        'Sustainable Chemistry for Energy Devices',
        'Chemistry of Chemical Sensors and Corrosion Technology',
        'Green Materials and E-Waste Management',
        'Advanced Chemistry: Quantum Materials & Polymers',
        'Functional Materials in Memory & Display Systems'
    ],
    ACM: [
        'Sensor Technologies and Advanced Fluids',
        'Advanced Energy and Nanomaterials',
        'Advanced Materials for Engineering Applications',
        'Corrosion Science and Coating Technology',
        'Advanced Synthetic and Green Fuels'
    ],
    ACE: [
        'Electrode System and Electrochemical Sensors',
        'Corrosion Science and E-Waste Management',
        'Materials for Energy Devices',
        'Nano and Quantum Dot Materials',
        'Functional Polymers and Hybrid Composites in Flexible Electronics'
    ],

    // Core Foundation & Engineering Science Codes
    PSC1: [
        'Basic Building Materials - I',
        'Basic Building Materials - II',
        'Cement and Fresh Concrete',
        'Concrete Mix Design and Hardened Concrete',
        'Sustainable and Innovative Materials'
    ],
    PSC2: [
        'Formation of Steam, Turbines',
        'I C Engines & Refrigeration',
        'Power Transmission',
        'Machine Tools',
        'Joining Process, Mechatronics, CNC and Additive Manufacturing'
    ],
    PSC3: [
        'DC Circuits',
        'Single-Phase AC Circuits',
        'Three-Phase AC Circuits',
        'DC Machines',
        'Three-Phase Induction Motors'
    ],
    PSC4: [
        'Semiconductor Diode and Its Applications',
        'Transistors and Their Applications',
        'Operational Amplifier and Oscillators',
        'Communication System',
        'Fundamentals of Digital Systems & Binary Numbers'
    ],
    PSC5: [
        'Introduction to C',
        'Decision Control and Looping Statements',
        'Functions and Arrays',
        'Strings and Pointers',
        'Structure, Union, and Enumerated Data Type'
    ],
    PSC6: [
        'Fundamentals of Biochemistry',
        'Fundamentals of Cell, Molecular, and Genetics',
        'Fundamentals of Bioprocess Engineering',
        'Fundamentals of Bioinformatics',
        'Biomimetics and Its Applications'
    ],
    ESCO6: [
        'Power Generation and DC Circuits',
        'Single Phase Circuits and Three Phase Circuits',
        'DC Machines',
        'Transformers and Three-Phase Induction Motors',
        'Domestic Wiring, Electrical Energy Consumption and Tariff, Safety Measures'
    ],
    ESCO7: [
        'Power Supplies and Amplifiers',
        'Operational Amplifiers and Oscillators',
        'Boolean Algebra and Logic Circuits, Combinational Logic',
        'Embedded Systems and Sensors and Interfacing',
        'Analog Communication Schemes and Digital Modulation Schemes'
    ],
    ESCO8: [
        'Introduction and Energy',
        'Machine Tool Operations and Introduction to Advanced Manufacturing Systems',
        'Introduction to IC Engines and Insight into Future Mobility',
        'Engineering Materials and Joining Processes',
        'Introduction to Mechatronics & Robotics, Automation in Industry, Introduction to IoT'
    ],
    ESCO9: [
        'Data Storage and Data Manipulation',
        'Operating Systems and Algorithms',
        'Networking and the Internet, Cybersecurity, Ethical Issues in Information Technology',
        'Software Engineering and Database Systems',
        'Introduction to HTML and Website Development and Computer Graphics'
    ],
    ESCO10: [
        'Scope of Various Fields of Civil Engineering, Basic and Emerging Materials of Construction, Structural Elements of a Building',
        'Fundamentals of Mechanics and Coplanar Concurrent Forces',
        'Coplanar Non-Concurrent Forces',
        'Centroid and Moment of Inertia of Plane Sections',
        'Centre of Gravity and Mass Moment of Inertia, Friction'
    ],
    ESCO11: [
        'Fundamentals of Mechanics and Coplanar Concurrent Forces',
        'Coplanar Non-Concurrent Forces',
        'Centroid and Moment of Inertia of Plane Sections',
        'Centre of Gravity and Mass Moment of Inertia, Friction',
        'Dynamics, Kinematics and Projectiles, Kinetics'
    ],
    PLC5: [
        {
            moduleNumber: 0,
            title: 'Basics',
            slug: 'basics',
            topics: [
                { id: '0-1', slug: 'before-you-start', title: 'Before You Start', displayLabel: '0.1 Before You Start' },
                { id: '0-2', slug: 'why-programming', title: 'Why Programming?', displayLabel: '0.2 Why Programming?' },
                { id: '0-3', slug: 'common-myths', title: 'Common Myths', displayLabel: '0.3 Common Myths' },
                { id: '0-4', slug: 'no-coding-background', title: 'No Coding Background?', displayLabel: '0.4 No Coding Background?' },
                { id: '0-5', slug: 'how-to-learn', title: 'How to Learn', displayLabel: '0.5 How to Learn' },
                { id: '0-6', slug: 'how-to-practice', title: 'How to Practice', displayLabel: '0.6 How to Practice' },
                { id: '0-7', slug: 'using-askursenior', title: 'Using AskUrSenior', displayLabel: '0.7 Using AskUrSenior' }
            ]
        },
        {
            moduleNumber: 1,
            title: 'Introduction to C',
            slug: 'module-1',
            topics: [
                { id: '1-1', slug: 'introduction-to-computers', title: 'Introduction to Computers', displayLabel: '1.1 Introduction to Computers' },
                { id: '1-2', slug: 'input-and-output-devices', title: 'Input and Output Devices', displayLabel: '1.2 Input and Output Devices' },
                { id: '1-3', slug: 'designing-efficient-programs', title: 'Designing Efficient Programs', displayLabel: '1.3 Designing Efficient Programs' },
                { id: '1-4', slug: 'software-basics', title: 'Software Basics', displayLabel: '1.4 Software Basics' },
                { id: '1-5', slug: 'structure-of-a-c-program', title: 'Structure of a C Program', displayLabel: '1.5 Structure of a C Program' },
                { id: '1-6', slug: 'files-used-in-c', title: 'Files Used in C', displayLabel: '1.6 Files Used in C' },
                { id: '1-7', slug: 'compilers', title: 'Compilers', displayLabel: '1.7 Compilers' },
                { id: '1-8', slug: 'compiling-and-executing-c', title: 'Compiling and Executing C', displayLabel: '1.8 Compiling and Executing C' },
                { id: '1-9', slug: 'variables', title: 'Variables', displayLabel: '1.9 Variables' },
                { id: '1-10', slug: 'constants', title: 'Constants', displayLabel: '1.10 Constants' },
                { id: '1-11', slug: 'data-types', title: 'Data Types', displayLabel: '1.11 Data Types' },
                { id: '1-12', slug: 'input-and-output', title: 'Input and Output', displayLabel: '1.12 Input and Output' }
            ]
        },
        'Decision Control and Looping Statements',
        'Functions & Array',
        'Applications of Arrays and Introduction to Strings',
        'Strings, Pointer and Structures'
    ],
    PLC6: [
        'Python Basics and Flow Control',
        'Functions and Lists',
        'Dictionaries and Structuring Data and Manipulating Strings',
        'Object-Oriented Programming and Inheritance',
        'Reading and Writing Files and Organizing Files'
    ],
    ETC13: [
        'Introduction to Artificial Intelligence',
        'Machine Learning',
        'Knowledge Representation and Prompt Engineering',
        'Current Trends in Artificial Intelligence',
        'Applications of AI'
    ],
    PSCL5: [
        'Fundamental Programming Constructs',
        'Control Structures and Loops',
        'Arrays, Matrix Operations and Modular Functions',
        'Strings and Pointer Implementations',
        'Structures, Files and Algorithm Implementations'
    ],
    CC03_CC04: [
        'Introduction to Language & Cultural Roots',
        'Grammar and Vocabulary Constructs',
        'Prose, Poetry and Literature Appreciation',
        'Functional Conversation and Workplace Ethics',
        'Technical Translation and Composition'
    ]
};

/**
 * Normalizes branch code into standard uppercase stream
 */
function normalizeBranchStream(branchInput) {
    let str = '';
    if (typeof branchInput === 'string') {
        str = branchInput;
    } else if (branchInput && typeof branchInput === 'object') {
        str = branchInput.code || branchInput.name || branchInput.toString();
    }
    const b = (str || '').trim().toUpperCase();
    if (['CS', 'IS', 'CI', 'BT', 'CSE', 'ISE', 'AIML', 'DS', 'CSBS', 'IT'].includes(b)) return 'CSE';
    if (['EE', 'EC', 'ET', 'EI', 'ECE', 'EEE'].includes(b)) return 'EEE';
    if (['CV', 'CIVIL'].includes(b)) return 'CV';
    if (['ME', 'IM', 'CH', 'MECH'].includes(b)) return 'ME';
    return 'CSE'; // default fallback
}

/**
 * Given a generic or stream subject code/name and student branch + semester,
 * resolves the authoritative branch stream course code, full title, and module list.
 */
function resolveFirstYearSubjectDetails(subjectCode, subjectName, studentBranch, semester = 1) {
    const rawCode = (subjectCode || '').trim().toUpperCase();
    const rawName = (subjectName || '').toLowerCase();
    const stream = normalizeBranchStream(studentBranch);
    const sem = Number(semester) || 1;

    let targetCode = rawCode;
    let targetName = subjectName;

    // Mathematics Resolution
    if (rawCode === 'MATH' || rawCode === 'MAT' || rawName.includes('mathematics') || rawName.includes('math')) {
        if (stream === 'CSE') {
            targetCode = sem === 2 ? 'AMS2' : 'AMS1';
            targetName = 'Applied Mathematics-' + (sem === 2 ? 'II' : 'I') + ' (CSE Stream)';
        } else if (stream === 'EEE') {
            targetCode = sem === 2 ? 'AME2' : 'AME1';
            targetName = 'Applied Mathematics-' + (sem === 2 ? 'II' : 'I') + ' (EEE Stream)';
        } else if (stream === 'CV') {
            targetCode = sem === 2 ? 'AMC2' : 'AMC1';
            targetName = 'Applied Mathematics-' + (sem === 2 ? 'II' : 'I') + ' (CV Stream)';
        } else if (stream === 'ME') {
            targetCode = sem === 2 ? 'AMM2' : 'AMM1';
            targetName = 'Applied Mathematics-' + (sem === 2 ? 'II' : 'I') + ' (ME Stream)';
        }
    }
    // Physics Resolution
    else if (rawCode === 'PHY' || rawName.includes('physics')) {
        if (stream === 'CSE') {
            targetCode = 'APS';
            targetName = 'Quantum Physics and Applications';
        } else if (stream === 'CV') {
            targetCode = 'APC';
            targetName = 'Physics for Sustainable Structural System';
        } else if (stream === 'ME') {
            targetCode = 'APM';
            targetName = 'Physics of Materials';
        } else if (['EE', 'EEE'].includes((studentBranch || '').trim().toUpperCase())) {
            targetCode = 'APEE';
            targetName = 'Electrical Engineering Materials';
        } else {
            targetCode = 'APEC';
            targetName = 'Quantum Physics and Electronics Sensors';
        }
    }
    // Chemistry Resolution
    else if (rawCode === 'CHE' || rawName.includes('chemistry')) {
        if (stream === 'CSE') {
            targetCode = 'ACS';
            targetName = 'Applied Chemistry for Smart Systems';
        } else if (stream === 'CV') {
            targetCode = 'ACC';
            targetName = 'Applied Chemistry for Sustainable Structures and Material Design';
        } else if (stream === 'ME') {
            targetCode = 'ACM';
            targetName = 'Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems';
        } else {
            targetCode = 'ACE';
            targetName = 'Applied Chemistry for Emerging Electronics and Futuristic Devices';
        }
    }

    // Resolve Module Titles
    const titleList = FIRST_YEAR_MODULE_TITLES[targetCode] 
        || FIRST_YEAR_MODULE_TITLES[rawCode] 
        || null;

    let modules = null;
    if (titleList && Array.isArray(titleList)) {
        let runningNum = 1;
        modules = titleList.map((item, idx) => {
            if (typeof item === 'object' && item !== null) {
                const isBasics = item.moduleNumber === 0 || item.title?.toLowerCase().trim() === 'basics';
                let num;
                if (item.moduleNumber !== undefined) {
                    num = item.moduleNumber;
                    if (!isBasics && num >= runningNum) {
                        runningNum = num + 1;
                    }
                } else {
                    num = isBasics ? 0 : runningNum++;
                }
                const slug = item.slug || (isBasics ? 'basics' : `module-${num}`);
                const topics = Array.isArray(item.topics) ? item.topics : [];
                return {
                    id: item.id || (isBasics ? 'basics' : `module-${num}`),
                    slug: slug,
                    moduleNumber: num,
                    title: item.title,
                    name: item.name || item.title,
                    description: item.description || (isBasics ? 'Foundations and essentials before starting C programming.' : `Detailed notes, exam explanations, and verified questions for ${item.title}.`),
                    topics: topics
                };
            }

            const isBasics = typeof item === 'string' && item.toLowerCase().trim() === 'basics';
            const num = isBasics ? 0 : runningNum++;
            const slug = isBasics ? 'basics' : `module-${num}`;
            return {
                id: isBasics ? 'basics' : 'module-' + num,
                slug: slug,
                moduleNumber: num,
                title: item,
                name: item,
                description: isBasics
                    ? 'Foundations and essentials before starting C programming.'
                    : 'Detailed notes, exam explanations, and verified questions for ' + item + '.',
                topics: []
            };
        });
    }

    return {
        code: targetCode,
        name: targetName,
        modules
    };
}

module.exports = {
    FIRST_YEAR_MODULE_TITLES,
    normalizeBranchStream,
    resolveFirstYearSubjectDetails
};
