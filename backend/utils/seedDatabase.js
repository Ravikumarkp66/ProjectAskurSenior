const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const BRANCHES = ['CV', 'CS', 'IS', 'CI', 'BT', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'];

const EE_STREAM_BRANCHES = ['EE', 'EC', 'ET', 'EI'];

const MATH_MODULE_TITLES_BY_CODE = {
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
        'Introduction to C',
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
    ]
};

const EE_STREAM_CYCLE_SUBJECTS = {
    C: [
        { code: 'AME1', name: 'Applied Mathematics-I (EEE Stream)', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'ACE', name: 'Applied Chemistry for Emerging Electronics and Futuristic Devices', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'CAEDEE', name: 'Computer-Aided Engineering Drawing (EEE Stream)', credits: 3, branches: ['EE'] },
        { code: 'CAEDEC', name: 'Computer-Aided Engineering Drawing (ECE Stream)', credits: 3, branches: ['EC', 'ET', 'EI'] },
        { code: 'ESCO7', name: 'Introduction to Electronics & Communication Engineering', credits: 3, branches: ['EE'] },
        { code: 'ESCO6', name: 'Introduction to Electrical Engineering', credits: 3, branches: ['EC', 'ET', 'EI'] },
        { code: 'PLC5', name: 'Introduction to C Programming', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'CC08', name: 'Communication Skills', credits: 1, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'CC10', name: 'Indian Constitution and Engineering Ethics', credits: 0, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'SDC1', name: 'Innovation and Design Thinking Lab', credits: 1, branches: ['EE', 'EC', 'ET', 'EI'] }
    ],
    P: [
        { code: 'AME2', name: 'Applied Mathematics-II (EEE Stream)', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'APEE', name: 'Electrical Engineering Materials', credits: 4, branches: ['EE'] },
        { code: 'APEC', name: 'Quantum Physics and Electronics Sensors', credits: 4, branches: ['EC', 'ET', 'EI'] },
        { code: 'PSC3', name: 'Basics of Electrical Engineering', credits: 3, branches: ['EE'] },
        { code: 'PSC4', name: 'Fundamentals of Electronics and Communication Engineering', credits: 3, branches: ['EC', 'ET', 'EI'] },
        { code: 'ESCO9', name: 'Essentials of Information Technology', credits: 3, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'ETC13', name: 'Introduction to AI and Applications', credits: 3, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'PSCL3', name: 'Basic Electrical Laboratory', credits: 1, branches: ['EE'] },
        { code: 'PSCL4', name: 'Fundamentals of Electronics & Communication Engineering Lab', credits: 1, branches: ['EC', 'ET', 'EI'] },
        { code: 'CC09', name: 'Soft Skills', credits: 0, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'CC03_CC04', name: 'Balake Kannada / Samskruthika Kannada', credits: 1, branches: ['EE', 'EC', 'ET', 'EI'] },
        { code: 'SDC2', name: 'Interdisciplinary Project-Based Learning', credits: 1, branches: ['EE', 'EC', 'ET', 'EI'] }
    ]
};

const CYCLE_SUBJECTS = {
    P: [
        { code: 'AMC1', name: 'Applied Mathematics-I (CV Stream)', credits: 4, branches: ['CV'] },
        { code: 'AMS1', name: 'Applied Mathematics-I (CSE Stream)', credits: 4, branches: ['CS', 'IS', 'CI', 'BT'] },
        { code: 'AMM1', name: 'Applied Mathematics-I (ME Stream)', credits: 4, branches: ['ME', 'IM', 'CH'] },
        { code: 'AME1', name: 'Applied Mathematics-I (EEE Stream)', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },

        { code: 'APC', name: 'Physics for Sustainable Structural System', credits: 4, branches: ['CV'] },
        { code: 'APS', name: 'Quantum Physics and Applications', credits: 4, branches: ['CS', 'IS', 'CI', 'BT'] },
        { code: 'APM', name: 'Physics of Materials', credits: 4, branches: ['ME', 'IM', 'CH'] },

        { code: 'PSC1', name: 'Building Materials and Concrete Technology', credits: 3, branches: ['CV'] },
        { code: 'PSC5', name: 'Structured Programming in C', credits: 3, branches: ['CS', 'IS', 'CI'] },
        { code: 'PSC6', name: 'Elements of Biotechnology and Biomimetics', credits: 3, branches: ['BT'] },
        { code: 'PSC2', name: 'Elements of Mechanical Engineering', credits: 3, branches: ['ME', 'IM', 'CH'] },

        { code: 'ESCO6', name: 'Introduction to Electrical Engineering', credits: 3, branches: ['CV', 'EC', 'ET', 'EI'] },
        { code: 'ESCO7', name: 'Introduction to Electronics & Communication Engineering', credits: 3, branches: ['CS', 'IS', 'CI', 'ME', 'IM', 'EE'] },
        { code: 'ESCO9', name: 'Essentials of Information Technology', credits: 3, branches: ['BT'] },

        { code: 'ETC13', name: 'Introduction to AI and Applications', credits: 3, branches: ['ALL'] },

        { code: 'PSCL1', name: 'Building Materials Lab', credits: 1, branches: ['CV'] },
        { code: 'PSCL2', name: 'Elements of Mechanical Engineering Lab', credits: 1, branches: ['ME', 'IM', 'CH'] },
        { code: 'PSCL3', name: 'Basic Electrical Laboratory', credits: 1, branches: ['EE'] },
        { code: 'PSCL4', name: 'Fundamentals of Electronics & Communication Engineering Lab', credits: 1, branches: ['EC', 'ET', 'EI'] },
        { code: 'PSCL5', name: 'C Programming Lab', credits: 1, branches: ['CS', 'IS', 'CI'] },
        { code: 'PSCL6', name: 'Elements of Biotechnology Lab', credits: 1, branches: ['BT'] },

        { code: 'SDC1', name: 'Innovation and Design Thinking Lab', credits: 1, branches: ['ALL'] },
        { code: 'CC03_CC04', name: 'Balake Kannada / Samskruthika Kannada', credits: 1, branches: ['ALL'] },
        { code: 'CC09', name: 'Soft Skills', credits: 0, branches: ['ALL'] }
    ],
    C: [
        { code: 'AMC2', name: 'Applied Mathematics-II (CV Stream)', credits: 4, branches: ['CV'] },
        { code: 'AMS2', name: 'Applied Mathematics-II (CSE Stream)', credits: 4, branches: ['CS', 'IS', 'CI', 'BT'] },
        { code: 'AMM2', name: 'Applied Mathematics-II (ME Stream)', credits: 4, branches: ['ME', 'IM', 'CH'] },
        { code: 'AME2', name: 'Applied Mathematics-II (EEE Stream)', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },

        { code: 'ACC', name: 'Applied Chemistry for Sustainable Structures and Material Design', credits: 4, branches: ['CV'] },
        { code: 'ACS', name: 'Applied Chemistry for Smart Systems', credits: 4, branches: ['CS', 'IS', 'CI', 'BT'] },
        { code: 'ACM', name: 'Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems', credits: 4, branches: ['ME', 'IM', 'CH'] },
        { code: 'ACE', name: 'Applied Chemistry for Emerging Electronics and Futuristic Devices', credits: 4, branches: ['EE', 'EC', 'ET', 'EI'] },

        { code: 'CAEDC', name: 'Computer-Aided Engineering Drawing (CV Stream)', credits: 3, branches: ['CV'] },
        { code: 'CAEDS', name: 'Computer-Aided Engineering Drawing (CSE Stream)', credits: 3, branches: ['CS', 'IS', 'CI', 'BT'] },
        { code: 'CAEDM', name: 'Computer-Aided Engineering Drawing (ME Stream)', credits: 3, branches: ['ME', 'IM', 'CH'] },
        { code: 'CAEDEE', name: 'Computer-Aided Engineering Drawing (EEE Stream)', credits: 3, branches: ['EE'] },
        { code: 'CAEDEC', name: 'Computer-Aided Engineering Drawing (ECE Stream)', credits: 3, branches: ['EC', 'ET', 'EI'] },

        { code: 'PLC5', name: 'Introduction to C Programming', credits: 4, branches: ['CV', 'ME', 'IM', 'CH', 'EE', 'EC', 'ET', 'EI'] },
        { code: 'PLC6', name: 'Python Programming', credits: 4, branches: ['CS', 'IS', 'CI', 'BT'] },

        { code: 'ESCO11', name: 'Applied Mechanics', credits: 3, branches: ['CV', 'ME'] },
        { code: 'ESCO6', name: 'Introduction to Electrical Engineering', credits: 3, branches: ['IS'] },
        { code: 'ESCO9', name: 'Essentials of Information Technology', credits: 3, branches: ['IM', 'EE', 'EC', 'ET', 'EI'] },

        { code: 'PSC3', name: 'Basics of Electrical Engineering', credits: 3, branches: ['EE'] },
        { code: 'PSC4', name: 'Fundamentals of Electronics and Communication Engineering', credits: 3, branches: ['EC', 'ET', 'EI'] },

        { code: 'APEE', name: 'Electrical Engineering Materials', credits: 4, branches: ['EE'] },
        { code: 'APEC', name: 'Quantum Physics and Electronics Sensors', credits: 4, branches: ['EC', 'ET', 'EI'] },

        { code: 'CC08', name: 'Communication Skills', credits: 1, branches: ['ALL'] },
        { code: 'CC10', name: 'Indian Constitution and Engineering Ethics', credits: 0, branches: ['ALL'] },
        { code: 'SDC2', name: 'Interdisciplinary Project-Based Learning', credits: 1, branches: ['ALL'] }
    ]
};

const expandBranches = (branches) => {
    if (!Array.isArray(branches)) return [];
    if (branches.includes('ALL')) return BRANCHES;
    return branches;
};

const seedDatabase = async () => {
    try {
        try {
            await Subject.collection.dropIndex('code_1');
        } catch (error) {
            // ignore if index doesn't exist
        }

        // Clear existing subjects
        await Subject.deleteMany({});

        const cycles = ['P', 'C'];
        for (const cycle of cycles) {
            for (const branch of BRANCHES) {
                const subjectsForCycle =
                    EE_STREAM_BRANCHES.includes(branch) && EE_STREAM_CYCLE_SUBJECTS[cycle]
                        ? EE_STREAM_CYCLE_SUBJECTS[cycle]
                        : CYCLE_SUBJECTS[cycle] || [];

                const branchSubjects = subjectsForCycle
                    .filter((s) => expandBranches(s.branches).includes(branch))
                    .slice()
                    .sort((a, b) => (a.credits - b.credits) || a.code.localeCompare(b.code));

                for (const subject of branchSubjects) {
                    // Create 5 modules with 5 questions each
                    const modules = [];
                    const moduleTitles = MATH_MODULE_TITLES_BY_CODE[subject.code];
                    for (let moduleNum = 1; moduleNum <= 5; moduleNum++) {
                        const questions = [];
                        for (let qNum = 1; qNum <= 5; qNum++) {
                            questions.push({
                                title: `Question ${qNum} - Module ${moduleNum}`,
                                description: `This is question ${qNum} in module ${moduleNum}`,
                                completed: false
                            });
                        }

                        modules.push({
                            moduleNumber: moduleNum,
                            title: moduleTitles?.[moduleNum - 1] || `Module ${moduleNum}`,
                            questions: questions
                        });
                    }

                    // Use findOneAndUpdate with upsert to handle duplicates gracefully
                    await Subject.findOneAndUpdate(
                        { code: subject.code, branch, cycle },
                        {
                            name: subject.name,
                            code: subject.code,
                            credits: subject.credits,
                            cycle,
                            branch,
                            modules: modules
                        },
                        { upsert: true, new: true }
                    );
                }
            }
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

module.exports = seedDatabase;
