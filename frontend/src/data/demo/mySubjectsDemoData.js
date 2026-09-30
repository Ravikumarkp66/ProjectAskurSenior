/**
 * Static Demo Content Registry for My Subjects Workspace
 * 
 * Provides rich, realistic demo subjects, modules, topics, and structured editorial documents
 * for non-logged-in and free tier students to explore the full learning experience
 * with ZERO database/API requests and ZERO exposure of proprietary editorial databases.
 */

import { BLOCK_TYPES } from '../editorial/contentModel.js';

// ── 1. DEMO SUBJECTS SPECIFICATION ───────────────────────────────────────────

export const DEMO_SUBJECTS_METADATA = [
    {
        id: 'subj-acm',
        code: 'ACM',
        displayCode: 'ACM',
        branchCode: 'ACM',
        name: 'Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems',
        displayName: 'Applied Chemistry for Advanced Metal Protection and Sustainable Energy Systems',
        slug: 'applied-chemistry-for-advanced-metal-protection-and-sustainable-energy-systems',
        credits: 4,
        category: 'chemistry',
        description: 'Comprehensive study of sensors, electrochemical conversion, smart coatings, and green fuels.',
        modules: [
            {
                number: 1,
                title: 'Sensor Technologies and Advanced Fluids',
                topics: [
                    { slug: 'introduction-to-sensors', title: 'Introduction to Chemical Sensors', minutes: 12 },
                    { slug: 'electrochemical-transduction', title: 'Electrochemical Transduction Mechanisms', minutes: 15 },
                    { slug: 'smart-cutting-fluids', title: 'Smart Cutting Fluids & Nanofluids', minutes: 10 }
                ]
            },
            {
                number: 2,
                title: 'Advanced Energy and Nanomaterials',
                topics: [
                    { slug: 'battery-chemistry', title: 'Lithium-Ion Battery Chemistries', minutes: 14 },
                    { slug: 'carbon-nanotubes', title: 'Carbon Nanotubes in Supercapacitors', minutes: 12 }
                ]
            },
            {
                number: 3,
                title: 'Advanced Materials for Engineering Applications',
                topics: [
                    { slug: 'shape-memory-alloys', title: 'Shape Memory Alloys & Smart Polymers', minutes: 15 },
                    { slug: 'ceramic-matrix-composites', title: 'Ceramic Matrix Composites', minutes: 12 }
                ]
            },
            {
                number: 4,
                title: 'Corrosion Science and Coating Technology',
                topics: [
                    { slug: 'electrochemical-corrosion', title: 'Electrochemical Mechanism of Corrosion', minutes: 15 },
                    { slug: 'galvanic-protection', title: 'Galvanic Protection & Sacrificial Anodes', minutes: 10 }
                ]
            },
            {
                number: 5,
                title: 'Advanced Synthetic and Green Chemistry',
                topics: [
                    { slug: 'green-chemistry-principles', title: 'Principles of Green Chemistry', minutes: 10 },
                    { slug: 'biodiesel-transesterification', title: 'Biodiesel Transesterification', minutes: 14 }
                ]
            }
        ]
    },
    {
        id: 'subj-amm1',
        code: 'AMM1',
        displayCode: 'AMM1',
        branchCode: 'AMM1',
        name: 'Applied Mathematics-I',
        displayName: 'Applied Mathematics-I',
        slug: 'applied-mathematics-i',
        credits: 4,
        category: 'mathematics',
        description: 'Foundational calculus, polar coordinates, differential equations, and matrix algebra.',
        modules: [
            {
                number: 1,
                title: 'Polar Curves and Curvature',
                topics: [
                    { slug: 'radius-vector-tangent', title: 'Angle Between Radius Vector and Tangent', minutes: 15 },
                    { slug: 'radius-of-curvature', title: 'Radius of Curvature in Polar Coordinates', minutes: 18 }
                ]
            },
            {
                number: 2,
                title: 'Series Expansion & Multivariable Calculus',
                topics: [
                    { slug: 'taylor-series', title: 'Maclaurin and Taylor Series Expansions', minutes: 14 },
                    { slug: 'eulers-theorem', title: "Partial Differentiation & Euler's Theorem", minutes: 16 }
                ]
            },
            {
                number: 3,
                title: 'Ordinary Differential Equations of First Order',
                topics: [
                    { slug: 'exact-differential-equations', title: 'Exact Differential Equations & Integrating Factors', minutes: 15 },
                    { slug: 'orthogonal-trajectories', title: 'Orthogonal Trajectories in Cartesian & Polar', minutes: 12 }
                ]
            },
            {
                number: 4,
                title: 'Higher Order Linear Differential Equations',
                topics: [
                    { slug: 'homogeneous-odes', title: 'Homogeneous Linear ODEs with Constant Coefficients', minutes: 16 },
                    { slug: 'variation-of-parameters', title: 'Method of Variation of Parameters', minutes: 18 }
                ]
            },
            {
                number: 5,
                title: 'Linear Algebra',
                topics: [
                    { slug: 'matrix-rank', title: 'Rank of a Matrix & Echelon Form', minutes: 12 },
                    { slug: 'eigenvalues-eigenvectors', title: 'Eigenvalues, Eigenvectors & Cayley-Hamilton', minutes: 18 }
                ]
            }
        ]
    },
    {
        id: 'subj-caed',
        code: 'CAED',
        displayCode: 'CAED',
        branchCode: 'CAED',
        name: 'Computer Aided Engineering Drawing',
        displayName: 'Computer Aided Engineering Drawing',
        slug: 'computer-aided-engineering-drawing',
        credits: 3,
        category: 'drawing',
        description: 'Orthographic projections of points, lines, planes, solids, and isometric views.',
        modules: [
            {
                number: 1,
                title: 'Orthographic Projections of Points and Lines',
                topics: [
                    { slug: 'orthographic-principles', title: 'Principles of Orthographic Projections & Quadrants', minutes: 12 },
                    { slug: 'line-projections', title: 'Projections of Lines Inclined to Both Planes', minutes: 18 }
                ]
            },
            {
                number: 2,
                title: 'Orthographic Projections of Plane Surfaces',
                topics: [
                    { slug: 'triangular-square-laminae', title: 'Projections of Triangular and Square Laminae', minutes: 15 },
                    { slug: 'circular-hexagonal-laminae', title: 'Projections of Circular and Hexagonal Laminae', minutes: 15 }
                ]
            },
            {
                number: 3,
                title: 'Projections of Solids',
                topics: [
                    { slug: 'prisms-pyramids', title: 'Projections of Prisms and Pyramids', minutes: 16 },
                    { slug: 'cones-cylinders', title: 'Projections of Cones and Cylinders', minutes: 14 }
                ]
            },
            {
                number: 4,
                title: 'Development of Lateral Surfaces of Solids',
                topics: [
                    { slug: 'parallel-line-method', title: 'Parallel Line Method for Prisms & Cylinders', minutes: 15 },
                    { slug: 'radial-line-method', title: 'Radial Line Method for Pyramids & Cones', minutes: 15 }
                ]
            },
            {
                number: 5,
                title: 'Isometric Projections',
                topics: [
                    { slug: 'isometric-scale', title: 'Isometric Scale and Projection Axioms', minutes: 12 },
                    { slug: 'isometric-views-solids', title: 'Isometric Views of Truncated Solids', minutes: 16 }
                ]
            }
        ]
    },
    {
        id: 'subj-cc08',
        code: 'CC08',
        displayCode: 'CC08',
        branchCode: 'CC08',
        name: 'Communication Skills',
        displayName: 'Communication Skills',
        slug: 'communication-skills',
        credits: 2,
        category: 'theory',
        description: 'Professional verbal, written, interpersonal, and presentation excellence.',
        modules: [
            {
                number: 1,
                title: 'Fundamentals of Communication',
                topics: [
                    { slug: 'communication-cycle', title: 'The Communication Cycle and Barriers', minutes: 10 },
                    { slug: 'verbal-nonverbal', title: 'Verbal vs Non-Verbal Communication Nuances', minutes: 12 }
                ]
            },
            {
                number: 2,
                title: 'Listening and Speaking Skills',
                topics: [
                    { slug: 'active-listening', title: 'Active Listening Techniques in Technical Teams', minutes: 10 },
                    { slug: 'phonetics-body-language', title: 'Phonetics, Articulation & Body Language', minutes: 12 }
                ]
            },
            {
                number: 3,
                title: 'Technical Reading and Writing',
                topics: [
                    { slug: 'technical-reports', title: 'Technical Report Structure & Abstract Writing', minutes: 15 },
                    { slug: 'email-etiquette', title: 'Email Etiquette and Formal Inquiries', minutes: 10 }
                ]
            },
            {
                number: 4,
                title: 'Workplace Communication & Ethics',
                topics: [
                    { slug: 'conflict-resolution', title: 'Interpersonal Conflict Resolution', minutes: 12 },
                    { slug: 'cultural-sensitivity', title: 'Cross-Cultural Sensitivity in Engineering', minutes: 10 }
                ]
            },
            {
                number: 5,
                title: 'Presentation & Interview Skills',
                topics: [
                    { slug: 'presentation-structure', title: 'Structuring High-Impact Technical Presentations', minutes: 14 },
                    { slug: 'star-interview-method', title: 'Behavioral Interviews & The STAR Method', minutes: 14 }
                ]
            }
        ]
    },
    {
        id: 'subj-cc10',
        code: 'CC10',
        displayCode: 'CC10',
        branchCode: 'CC10',
        name: 'Indian Constitution and Ethics',
        displayName: 'Indian Constitution and Ethics',
        slug: 'indian-constitution-and-ethics',
        credits: 2,
        category: 'theory',
        description: 'Constitutional framework, governance, fundamental rights, and engineering ethics.',
        modules: [
            {
                number: 1,
                title: 'Preamble and Basic Structure',
                topics: [
                    { slug: 'constituent-assembly', title: 'Historical Background & The Constituent Assembly', minutes: 12 },
                    { slug: 'preamble-values', title: 'The Preamble: Core Constitutional Values', minutes: 10 }
                ]
            },
            {
                number: 2,
                title: 'Fundamental Rights and Directive Principles',
                topics: [
                    { slug: 'fundamental-rights', title: 'Six Fundamental Rights & Constitutional Remedies', minutes: 16 },
                    { slug: 'directive-principles', title: 'Directive Principles of State Policy (DPSP)', minutes: 12 }
                ]
            },
            {
                number: 3,
                title: 'Union Government & Parliament',
                topics: [
                    { slug: 'union-executive', title: 'President, Prime Minister & Cabinet System', minutes: 14 },
                    { slug: 'parliament-powers', title: 'Powers & Legislation in Lok Sabha and Rajya Sabha', minutes: 14 }
                ]
            },
            {
                number: 4,
                title: 'State Government & Judiciary',
                topics: [
                    { slug: 'state-executive', title: 'Role of Governor and Chief Minister', minutes: 12 },
                    { slug: 'judiciary-review', title: 'Supreme Court, High Courts & Judicial Review', minutes: 15 }
                ]
            },
            {
                number: 5,
                title: 'Professional & Engineering Ethics',
                topics: [
                    { slug: 'engineering-ethics-code', title: 'Codes of Ethics for Engineers & Public Safety', minutes: 12 },
                    { slug: 'ipr-whistleblowing', title: 'Intellectual Property Rights & Whistleblowing', minutes: 14 }
                ]
            }
        ]
    },
    {
        id: 'subj-esc07',
        code: 'ESC07',
        displayCode: 'ESC07',
        branchCode: 'ESC07',
        name: 'Introduction to Electronics Engineering',
        displayName: 'Introduction to Electronics Engineering',
        slug: 'introduction-to-electronics-engineering',
        credits: 3,
        category: 'physics',
        description: 'Semiconductors, rectifiers, op-amps, digital logic, and communication essentials.',
        modules: [
            {
                number: 1,
                title: 'Power Supplies and Amplifiers',
                topics: [
                    { slug: 'diode-bridge-rectifiers', title: 'PN Junction Diode and Full-Wave Bridge Rectifiers', minutes: 15 },
                    { slug: 'zener-regulator', title: 'Zener Diode Characteristics and Voltage Regulation', minutes: 14 }
                ]
            },
            {
                number: 2,
                title: 'Operational Amplifiers and Oscillators',
                topics: [
                    { slug: 'ideal-opamp', title: 'Ideal Op-Amp Model & Virtual Ground Concept', minutes: 14 },
                    { slug: 'inverting-noninverting-opamp', title: 'Inverting & Non-Inverting Op-Amp Circuits', minutes: 16 }
                ]
            },
            {
                number: 3,
                title: 'Boolean Algebra & Digital Logic',
                topics: [
                    { slug: 'logic-gates-demorgan', title: "Logic Gates and De Morgan's Theorems", minutes: 12 },
                    { slug: 'adders-circuits', title: 'Combinational Logic: Half Adder & Full Adder', minutes: 14 }
                ]
            },
            {
                number: 4,
                title: 'Embedded Systems and Sensor Interfacing',
                topics: [
                    { slug: 'microcontroller-fundamentals', title: 'Microcontrollers vs Microprocessors Architecture', minutes: 12 },
                    { slug: 'adc-sensor-interfacing', title: 'ADC Resolution & Sensor Signal Conditioning', minutes: 14 }
                ]
            },
            {
                number: 5,
                title: 'Communication Systems',
                topics: [
                    { slug: 'am-fm-modulation', title: 'Principles of Amplitude and Frequency Modulation', minutes: 14 },
                    { slug: 'digital-modulation', title: 'Introduction to Digital Carrier Modulation', minutes: 12 }
                ]
            }
        ]
    },
    {
        id: 'subj-plc5',
        code: 'PLC5',
        displayCode: 'PLC5',
        branchCode: 'PLC5',
        name: 'Introduction to C Programming',
        displayName: 'Introduction to C Programming',
        slug: 'introduction-to-c-programming',
        credits: 4,
        category: 'programming',
        description: 'Structured programming in C, control structures, functions, arrays, pointers, and memory.',
        modules: [
            {
                number: 1,
                title: 'Introduction to C',
                topics: [
                    { slug: 'structure-of-c-program', title: 'Structure of a C Program & Compilation Workflow', minutes: 12 },
                    { slug: 'data-types-variables', title: 'Data Types, Variables & Format Specifiers', minutes: 14 },
                    { slug: 'operators-expressions', title: 'Operators, Precedence & Expression Evaluation', minutes: 15 }
                ]
            },
            {
                number: 2,
                title: 'Decision Control and Looping Statements',
                topics: [
                    { slug: 'conditional-statements', title: 'Branching Constructs: if-else, nested if & switch', minutes: 15 },
                    { slug: 'looping-statements', title: 'Iteration: while, for, and do-while Constructs', minutes: 16 }
                ]
            },
            {
                number: 3,
                title: 'Functions and Arrays',
                topics: [
                    { slug: 'functions-prototypes', title: 'Modular Functions, Parameters & Call-by-Value', minutes: 15 },
                    { slug: 'arrays-manipulation', title: 'Single & Multi-Dimensional Array Operations', minutes: 16 }
                ]
            },
            {
                number: 4,
                title: 'Strings and Pointers',
                topics: [
                    { slug: 'pointers-fundamentals', title: 'Pointer Operators, Dereferencing & Addresses', minutes: 18 },
                    { slug: 'string-manipulation', title: 'String Handling Functions in string.h', minutes: 14 }
                ]
            },
            {
                number: 5,
                title: 'Structures, Unions, and File I/O',
                topics: [
                    { slug: 'structures-definition', title: 'Declaring and Accessing User-Defined Structures', minutes: 15 },
                    { slug: 'file-handling', title: 'Sequential File Processing (fopen, fread, fwrite)', minutes: 16 }
                ]
            }
        ]
    },
    {
        id: 'subj-sdc1',
        code: 'SDC1',
        displayCode: 'SDC1',
        branchCode: 'SDC1',
        name: 'Innovation and Design Thinking',
        displayName: 'Innovation and Design Thinking',
        slug: 'innovation-and-design-thinking',
        credits: 2,
        category: 'theory',
        description: 'Human-centered problem solving, empathy mapping, ideation, prototyping, and testing.',
        modules: [
            {
                number: 1,
                title: 'Understanding Design Thinking',
                topics: [
                    { slug: 'what-is-design-thinking', title: 'What is Human-Centered Design Thinking?', minutes: 10 },
                    { slug: 'five-stages-framework', title: 'The 5-Stage Stanford d.school Methodology', minutes: 12 }
                ]
            },
            {
                number: 2,
                title: 'Empathize & Define the Problem',
                topics: [
                    { slug: 'empathy-mapping', title: 'User Immersion & Empathy Mapping Tools', minutes: 12 },
                    { slug: 'pov-problem-statements', title: 'Formulating Actionable Point-of-View (POV) Statements', minutes: 12 }
                ]
            },
            {
                number: 3,
                title: 'Ideation & Brainstorming Techniques',
                topics: [
                    { slug: 'divergent-scamper', title: 'Divergent Brainstorming & The SCAMPER Framework', minutes: 14 },
                    { slug: 'prioritization-matrix', title: 'Impact vs Feasibility Prioritization Matrix', minutes: 10 }
                ]
            },
            {
                number: 4,
                title: 'Prototyping and Testing',
                topics: [
                    { slug: 'prototyping-fidelity', title: 'Low-Fidelity Paper Prototyping vs High-Fidelity', minutes: 14 },
                    { slug: 'user-testing-protocols', title: 'Facilitating User Testing & Feedback Loops', minutes: 12 }
                ]
            },
            {
                number: 5,
                title: 'Sustainable Innovation & Design Ethics',
                topics: [
                    { slug: 'circular-economy-design', title: 'Circular Economy Principles & Eco-Design', minutes: 12 },
                    { slug: 'inclusive-design-ethics', title: 'Universal Accessibility and Design Ethics', minutes: 12 }
                ]
            }
        ]
    }
];

// ── 2. DISCIPLINE-TAILORED EDITORIAL BUILDERS ─────────────────────────────────

const buildProgrammingEditorial = (subject, moduleObj, topic) => {
    return {
        subjectSlug: subject.slug,
        moduleSlug: `module-${moduleObj.number}`,
        topicSlug: topic.slug,
        title: topic.title,
        version: 1,
        status: 'Published',
        breadcrumbs: [`Module ${String(moduleObj.number).padStart(2, '0')} · ${moduleObj.title}`, topic.title],
        sections: [
            { id: 'sec-intro', title: '1. Introduction' },
            { id: 'sec-outcomes', title: '2. What You Will Learn' },
            { id: 'sec-concepts', title: '3. Basic Concepts' },
            { id: 'sec-code', title: '4. Example Code' },
            { id: 'sec-keypoints', title: '5. Key Points' },
            { id: 'sec-summary', title: '6. Quick Summary' }
        ],
        blocks: [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'sec-title', text: topic.title },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `${topic.title} is a foundational pillar in structured C programming and algorithmic problem solving. Mastering this topic provides the mental model needed to understand how the CPU, stack frames, and compiler interact with memory.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-intro', text: '1. Introduction' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'info',
                title: 'Curriculum Focus',
                text: `In university examinations and technical lab assessments, ${topic.title} is frequently evaluated with code tracing questions, syntax correction exercises, and short program implementations.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-outcomes', text: '2. What You Will Learn' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: false,
                items: [
                    `Understand the core syntax and operational rules of ${topic.title}.`,
                    'Identify how variables and instructions are stored and managed during execution.',
                    'Write clean, bug-free C code adhering to ANSI C / C99 standards.',
                    'Trace execution output step-by-step and debug off-by-one and boundary errors.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-concepts', text: '3. Basic Concepts' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: 'Programs execute instructions sequentially within functions. When organizing operations, clean code practices require explicit declarations, well-bounded loops, and deterministic return codes:'
            },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'tip',
                title: 'Compiler Best Practice',
                text: 'Always initialize local variables before reading them. In modern compilers like GCC and Clang, uninitialized automatic variables hold indeterminate stack garbage values.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-code', text: '4. Example Code' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `Here is a complete, compilable example illustrating practical implementation for ${topic.title}:`
            },
            {
                type: BLOCK_TYPES.CODE,
                language: 'c',
                code: `#include <stdio.h>

// Clean implementation demonstrating ${topic.title}
int computeResult(int inputVal) {
    if (inputVal < 0) {
        return -1; // Guard clause against invalid input
    }
    int result = inputVal * 2;
    return result;
}

int main(void) {
    int sample = 25;
    int output = computeResult(sample);

    printf("Input: %d -> Computed Output: %d\\n", sample, output);
    return 0;
}`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-keypoints', text: '5. Key Points' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: true,
                items: [
                    'Always validate user inputs using guard clauses before processing algorithms.',
                    'Check boundary conditions such as 0, negative integers, and maximum integer limits.',
                    'Ensure every opening bracket and delimiter is properly closed to prevent compilation errors.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-summary', text: '6. Quick Summary' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'warn',
                title: 'Examination Strategy',
                text: `When answering theory questions on ${topic.title}, always include: (1) Formal definition, (2) Syntax template, (3) Small working code example with comments, and (4) Expected output.`
            }
        ]
    };
};

const buildMathematicsEditorial = (subject, moduleObj, topic) => {
    return {
        subjectSlug: subject.slug,
        moduleSlug: `module-${moduleObj.number}`,
        topicSlug: topic.slug,
        title: topic.title,
        version: 1,
        status: 'Published',
        breadcrumbs: [`Module ${String(moduleObj.number).padStart(2, '0')} · ${moduleObj.title}`, topic.title],
        sections: [
            { id: 'sec-intro', title: '1. Introduction' },
            { id: 'sec-concept', title: '2. Concept Explanation' },
            { id: 'sec-formula', title: '3. Formula' },
            { id: 'sec-example', title: '4. Worked Example' },
            { id: 'sec-points', title: '5. Important Points' },
            { id: 'sec-summary', title: '6. Quick Summary' }
        ],
        blocks: [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'sec-title', text: topic.title },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `${topic.title} provides fundamental analytical tools in engineering mathematics, differential calculus, and vector spaces. It forms the backbone for modeling physical systems, stress distributions, and continuous dynamics.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-intro', text: '1. Introduction' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'info',
                title: 'Mathematical Context',
                text: `In semester university examinations, questions from ${moduleObj.title} typically test analytical derivation alongside 6-to-8 mark numerical evaluations.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-concept', text: '2. Concept Explanation' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `Consider a smooth, continuously differentiable curve defined over the real domain. The rate of variation of slope with respect to arc length dictates the intrinsic geometric properties. When analyzing ${topic.title}, we evaluate functional derivatives and verify continuity constraints across all critical points.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-formula', text: '3. Formula' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: 'The standard governing analytical equation is given by:'
            },
            {
                type: BLOCK_TYPES.FORMULA,
                formula: '\\rho = \\frac{\\left[1 + \\left(\\frac{dy}{dx}\\right)^2\\right]^{3/2}}{\\left|\\frac{d^2y}{dx^2}\\right|}'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-example', text: '4. Worked Example' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: 'Evaluate the curvature parameter for the parabola y = x² at the origin (0, 0):'
            },
            {
                type: BLOCK_TYPES.PREFORMATTED,
                text: `Step 1: Compute first derivative:
   dy/dx = 2x
   At x = 0, dy/dx = 0

Step 2: Compute second derivative:
   d²y/dx² = 2

Step 3: Substitute into the standard formula:
   ρ = [1 + (0)²]^(3/2) / |2| = 1 / 2 = 0.5 units.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-points', text: '5. Important Points' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: false,
                items: [
                    'Always take the absolute value of the denominator; physical curvature is strictly non-negative.',
                    'Confirm the function is continuously twice-differentiable at the point of interest.',
                    'Check sign conventions when converting between Cartesian (x, y) and polar (r, theta) coordinate systems.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-summary', text: '6. Quick Summary' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'tip',
                title: 'High-Scoring Tip',
                text: `Memorize the standard formulas for both Cartesian and pedal forms. Write down the general formula first before substituting numerical coordinates to earn step marks.`
            }
        ]
    };
};

const buildChemistryPhysicsEditorial = (subject, moduleObj, topic) => {
    return {
        subjectSlug: subject.slug,
        moduleSlug: `module-${moduleObj.number}`,
        topicSlug: topic.slug,
        title: topic.title,
        version: 1,
        status: 'Published',
        breadcrumbs: [`Module ${String(moduleObj.number).padStart(2, '0')} · ${moduleObj.title}`, topic.title],
        sections: [
            { id: 'sec-intro', title: '1. Introduction' },
            { id: 'sec-concept', title: '2. Core Concept' },
            { id: 'sec-principle', title: '3. Principle' },
            { id: 'sec-mechanism', title: '4. Chemical / Physical Mechanism' },
            { id: 'sec-application', title: '5. Example & Application' },
            { id: 'sec-keypoints', title: '6. Key Points & Summary' }
        ],
        blocks: [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'sec-title', text: topic.title },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `${topic.title} plays a pivotal role in advanced engineering materials, sustainable energy storage, and industrial asset protection. Understanding this allows engineers to design systems that maximize longevity while minimizing environmental degradation.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-intro', text: '1. Introduction' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'info',
                title: 'Module Overview',
                text: `Part of ${moduleObj.title}. This topic establishes the foundational chemical and electronic mechanisms applied in modern aerospace, automotive, and microelectronics design.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-concept', text: '2. Core Concept' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `At the microscopic level, interfacial phenomena are governed by electron transport, thermodynamic driving potentials, and ionic concentration gradients across phase boundaries.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-principle', text: '3. Principle' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'tip',
                title: 'Governing Principle',
                text: 'Thermodynamic equilibrium dictates the spontaneous direction of the transformation (Gibbs free energy delta G < 0), while kinetic activation barriers determine the actual reaction or degradation rate.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-mechanism', text: '4. Chemical / Physical Mechanism' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: true,
                items: [
                    'Adsorption: Reacting ionic or molecular species adhere to the active substrate surface.',
                    'Charge Transfer: Electron exchange occurs across the electrochemical double layer or junction boundary.',
                    'Phase Transition: Formation of protective passivation layers or diffusion of byproducts into the electrolyte/medium.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-application', text: '5. Example & Application' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `In practical engineering systems, ${topic.title} is utilized in next-generation lithium-ion battery electrodes, sacrificial anodic protection for marine structures, and smart nanocoatings.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-keypoints', text: '6. Key Points & Summary' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: false,
                items: [
                    'Environmental pH, electrolyte conductivity, and operating temperature significantly modulate reaction kinetics.',
                    'Protective barrier coatings must demonstrate high adhesion and zero ionic porosity.',
                    'Always sketch the electrode/mechanism diagram with labeled anode, cathode, and current flow in exams.'
                ]
            },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'warn',
                title: 'Exam Diagram Note',
                text: 'University evaluators assign up to 40% of marks to neat schematic diagrams. Always label the electrolyte, electron flow, and chemical equations.'
            }
        ]
    };
};

const buildDrawingEditorial = (subject, moduleObj, topic) => {
    return {
        subjectSlug: subject.slug,
        moduleSlug: `module-${moduleObj.number}`,
        topicSlug: topic.slug,
        title: topic.title,
        version: 1,
        status: 'Published',
        breadcrumbs: [`Module ${String(moduleObj.number).padStart(2, '0')} · ${moduleObj.title}`, topic.title],
        sections: [
            { id: 'sec-intro', title: '1. Introduction' },
            { id: 'sec-principles', title: '2. Orthographic Principles' },
            { id: 'sec-steps', title: '3. Step-by-Step Construction' },
            { id: 'sec-example', title: '4. Practical Projection Example' },
            { id: 'sec-mistakes', title: '5. Common Student Errors' },
            { id: 'sec-summary', title: '6. Quick Summary' }
        ],
        blocks: [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'sec-title', text: topic.title },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `Engineering Drawing is the universal language of engineers. ${topic.title} develops the spatial visualization and geometric drafting skills required to translate 3D solids and planes onto 2D projection planes.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-intro', text: '1. Introduction' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'info',
                title: 'BIS Drawing Standards',
                text: 'All drafting constructions follow the Bureau of Indian Standards (BIS: SP 46: 2003) conventions, using standard line weights, leader arrows, and first-angle projection rules.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-principles', text: '2. Orthographic Principles' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: 'In first-angle projection, the object lies in the First Quadrant between the observer and the plane of projection. The front elevation appears on the Vertical Plane (VP) above the reference line XY, while the top plan view projects onto the Horizontal Plane (HP) below XY.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-steps', text: '3. Step-by-Step Construction' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: true,
                items: [
                    'Step 1: Draw the reference line XY and label VP / HP according to the quadrant specified.',
                    'Step 2: Construct the simple position (true shape and true inclinations) before applying tilt angles.',
                    'Step 3: Project vertical and horizontal projectors between views to locate intersecting corner vertices.',
                    'Step 4: Connect visible outline edges with dark continuous lines (0.5mm) and hidden edges with dashed lines (0.25mm).'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-example', text: '4. Practical Projection Example' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `When constructing ${topic.title}, determine the true length (TL) and apparent lengths before completing the final elevation and plan views. Measure angles with high precision to avoid cumulative drafting errors.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-mistakes', text: '5. Common Student Errors' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'warn',
                title: 'Watch Out For',
                text: 'Confusing apparent angle (beta/alpha) with true inclination (theta/phi) is the most frequent cause of lost marks. Always establish locus lines before measuring apparent inclinations.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-summary', text: '6. Quick Summary' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: false,
                items: [
                    'Front view is denoted by lowercase primed letters (a\', b\', c\').',
                    'Top view is denoted by unprimed lowercase letters (a, b, c).',
                    'Reference line XY represents the intersection of the Vertical and Horizontal planes.'
                ]
            }
        ]
    };
};

const buildTheoryEditorial = (subject, moduleObj, topic) => {
    return {
        subjectSlug: subject.slug,
        moduleSlug: `module-${moduleObj.number}`,
        topicSlug: topic.slug,
        title: topic.title,
        version: 1,
        status: 'Published',
        breadcrumbs: [`Module ${String(moduleObj.number).padStart(2, '0')} · ${moduleObj.title}`, topic.title],
        sections: [
            { id: 'sec-intro', title: '1. Introduction' },
            { id: 'sec-concept', title: '2. Concept & Framework' },
            { id: 'sec-terms', title: '3. Important Terms & Definitions' },
            { id: 'sec-explanation', title: '4. Explanation & Industry Application' },
            { id: 'sec-exam', title: '5. Exam Focus & Key Points' },
            { id: 'sec-summary', title: '6. Summary' }
        ],
        blocks: [
            { type: BLOCK_TYPES.HEADING, level: 1, id: 'sec-title', text: topic.title },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: `${topic.title} equips engineers with the systemic, ethical, and communicative frameworks necessary to navigate multi-disciplinary organizational challenges and professional compliance standards.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-intro', text: '1. Introduction' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'info',
                title: 'Academic Context',
                text: `Part of ${moduleObj.title}. This subject bridges core technical competencies with professional legal frameworks, human-centered design principles, and collaborative workplace effectiveness.`
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-concept', text: '2. Concept & Framework' },
            {
                type: BLOCK_TYPES.PARAGRAPH,
                text: 'Effective engineering leadership relies on structured decision-making processes. Whether analyzing stakeholder feedback, legal statutes, or interpersonal dynamics, practitioners apply iterative validation cycles to ensure compliance and social responsibility.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-terms', text: '3. Important Terms & Definitions' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: false,
                items: [
                    'Stakeholder Alignment: Ensuring engineering solutions satisfy latent societal, legal, and operational requirements.',
                    'Normative Standards: Codified regulatory, ethical, and statutory benchmarks governing professional liability.',
                    'Iterative Validation: Continuous feedback loops that detect flaws early and prevent expensive systemic rework.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-explanation', text: '4. Explanation & Industry Application' },
            {
                type: BLOCK_TYPES.BLOCKQUOTE,
                text: 'Engineering excellence requires balancing technological innovation with statutory compliance, public safety, and ethical integrity.'
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-exam', text: '5. Exam Focus & Key Points' },
            {
                type: BLOCK_TYPES.LIST,
                ordered: true,
                items: [
                    'Structured Format: Begin answers with a formal 2-line definition followed by a structured block diagram.',
                    'Real-World Case Study: Cite a concrete industrial example illustrating successful or failed application.',
                    'Key Articles / Principles: Explicitly name governing frameworks, constitutional articles, or design stages.'
                ]
            },
            { type: BLOCK_TYPES.HEADING, level: 2, id: 'sec-summary', text: '6. Summary' },
            {
                type: BLOCK_TYPES.CALLOUT,
                variant: 'tip',
                title: 'Quick Revision Note',
                text: `Master the 3-step structured response methodology for ${topic.title} to secure full marks in descriptive 8-mark semester questions.`
            }
        ]
    };
};

// ── 3. STATIC REGISTRY GENERATION ─────────────────────────────────────────────

const DEMO_EDITORIAL_MAP = new Map();

export const DEMO_SUBJECTS = DEMO_SUBJECTS_METADATA.map((subj, sIdx) => {
    const normalizedModules = subj.modules.map((mod, mIdx) => {
        const modSlug = `module-${mod.number}`;
        const normalizedTopics = mod.topics.map((top, tIdx) => {
            const topicSlug = top.slug;
            const fullTopic = {
                id: `${mod.number}-${tIdx + 1}`,
                topicId: `${mod.number}-${tIdx + 1}`,
                slug: topicSlug,
                topicSlug: topicSlug,
                title: top.title,
                displayLabel: `${mod.number}.${tIdx + 1} ${top.title}`,
                order: tIdx + 1,
                status: 'Published',
                estimatedMinutes: top.minutes || 12,
                hasEditorial: true,
                hasPyq: false,
                hasLab: false
            };

            // Generate structured editorial adapted to subject discipline
            let editorialDoc;
            if (subj.category === 'programming') {
                editorialDoc = buildProgrammingEditorial(subj, mod, top);
            } else if (subj.category === 'mathematics') {
                editorialDoc = buildMathematicsEditorial(subj, mod, top);
            } else if (subj.category === 'chemistry' || subj.category === 'physics') {
                editorialDoc = buildChemistryPhysicsEditorial(subj, mod, top);
            } else if (subj.category === 'drawing') {
                editorialDoc = buildDrawingEditorial(subj, mod, top);
            } else {
                editorialDoc = buildTheoryEditorial(subj, mod, top);
            }

            // Register in static map under multiple lookup keys (subject code, subject slug)
            const keys = [
                `${subj.code.toLowerCase()}/${modSlug}/${topicSlug}`,
                `${subj.slug.toLowerCase()}/${modSlug}/${topicSlug}`,
                `${subj.code.toLowerCase()}/module${mod.number}/${topicSlug}`,
                `${subj.slug.toLowerCase()}/module${mod.number}/${topicSlug}`
            ];

            keys.forEach(k => {
                DEMO_EDITORIAL_MAP.set(k, editorialDoc);
            });

            return fullTopic;
        });

        return {
            id: modSlug,
            slug: modSlug,
            moduleSlug: modSlug,
            moduleNumber: mod.number,
            title: `Module ${String(mod.number).padStart(2, '0')}`,
            displayLabel: `M${String(mod.number).padStart(2, '0')} · ${mod.title}`,
            order: mod.number,
            description: mod.title,
            topics: normalizedTopics
        };
    });

    return {
        _id: `demo_${subj.code.toLowerCase()}`,
        id: `demo_${subj.code.toLowerCase()}`,
        code: subj.code,
        displayCode: subj.displayCode,
        branchCode: subj.branchCode,
        name: subj.name,
        displayName: subj.displayName,
        slug: subj.slug,
        credits: subj.credits,
        semester: 1,
        contentSource: 'demo',
        modules: normalizedModules
    };
});

// ── 4. LOOKUP UTILITIES ───────────────────────────────────────────────────────

/**
 * Resolves demo editorial document by subject, module, and topic slugs.
 */
export const getDemoTopicEditorial = (subjectIdentifier, moduleSlug, topicSlug) => {
    if (!subjectIdentifier || !moduleSlug || !topicSlug) return null;
    const cleanSubj = String(subjectIdentifier).toLowerCase().trim();
    const cleanMod = String(moduleSlug).toLowerCase().trim();
    const cleanTop = String(topicSlug).toLowerCase().trim();

    const primaryKey = `${cleanSubj}/${cleanMod}/${cleanTop}`;
    if (DEMO_EDITORIAL_MAP.has(primaryKey)) {
        return DEMO_EDITORIAL_MAP.get(primaryKey);
    }

    // Try normalized module slug variants
    const modNormalized = cleanMod.startsWith('module-') ? cleanMod : `module-${cleanMod.replace('module', '')}`;
    const altKey = `${cleanSubj}/${modNormalized}/${cleanTop}`;
    if (DEMO_EDITORIAL_MAP.has(altKey)) {
        return DEMO_EDITORIAL_MAP.get(altKey);
    }

    // Check alias by iterating demo subjects
    const matchedSubj = DEMO_SUBJECTS.find(s => s.code.toLowerCase() === cleanSubj || s.slug.toLowerCase() === cleanSubj);
    if (matchedSubj) {
        const fallbackKey = `${matchedSubj.slug}/${modNormalized}/${cleanTop}`;
        if (DEMO_EDITORIAL_MAP.has(fallbackKey)) {
            return DEMO_EDITORIAL_MAP.get(fallbackKey);
        }
    }

    return null;
};

/**
 * Resolves full module/topic content tree for demo subjects.
 */
export const getDemoContentTree = (subjectIdentifier) => {
    if (!subjectIdentifier) return null;
    const clean = String(subjectIdentifier).toLowerCase().trim();
    const subj = DEMO_SUBJECTS.find(s => s.code.toLowerCase() === clean || s.slug.toLowerCase() === clean);
    return subj ? subj.modules : null;
};

/**
 * Checks if a subject identifier corresponds to a static demo subject.
 */
export const isDemoSubject = (subjectIdentifier) => {
    if (!subjectIdentifier) return false;
    const clean = String(subjectIdentifier).toLowerCase().trim();
    return DEMO_SUBJECTS.some(s => s.code.toLowerCase() === clean || s.slug.toLowerCase() === clean);
};
