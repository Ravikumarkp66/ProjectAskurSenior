import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { subjectAPI } from '../services/api';
import { BRANCHES, deriveBranchFromUSN, toBackendBranch, toUiBranch } from '../utils/constants';
import { getAllCIEResults } from '../utils/cieEngine';
import LoginRequiredModal from '../components/LoginRequiredModal';

// Universal CIE Rule Engine
const CIE_RULES = {
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

const detectSubjectType = (credits, hasLab) => {
    const cr = parseFloat(credits) || 0;
    // Rule 1: Credits >= 4 -> Lab + Theory (IPCC)
    if (cr >= 4) return "IPCC";
    // Rule 2: Subject name contains 'lab' -> Lab Only
    if (hasLab) return "LAB_ONLY";
    // Rule 3: Remaining -> Theory Only (High or Low based on credits)
    if (cr >= 3) return "THEORY_ONLY";
    return "LOW_THEORY";
};

// Grade Point System based on total marks (CIE + SEE converted)
// SEE must be >= 36 (out of 100) to pass, otherwise F grade
const getGradeFromTotal = (total, seeMarks, isNE = false) => {
    if (isNE) return { grade: 'NE', points: 0, color: 'text-red-500', ne: true };
    // If SEE < 36 (out of 100), automatically fail regardless of CIE
    if (seeMarks < 36) return { grade: 'F', points: 0, color: 'text-red-500', seeFail: true };

    if (total >= 90) return { grade: 'O', points: 10, color: 'text-emerald-400' };
    if (total >= 80) return { grade: 'A+', points: 9, color: 'text-green-400' };
    if (total >= 70) return { grade: 'A', points: 8, color: 'text-blue-400' };
    if (total >= 60) return { grade: 'B+', points: 7, color: 'text-cyan-400' };
    if (total >= 50) return { grade: 'B', points: 6, color: 'text-yellow-400' };
    if (total >= 40) return { grade: 'C', points: 5, color: 'text-orange-400' };
    return { grade: 'F', points: 0, color: 'text-red-500' };
};

const defaultSubjects = [
    {
        id: 1,
        name: 'Subject 1',
        credits: 4,
        hasLab: false,
        isOpenEnded: false,
        cie: '',
        see: '',
        isCIEExpanded: false,
        cieMarks: {
            test1: '', test2: '',
            quiz1: '', quiz2: '',
            abl1: '', abl2: '',
            labs: [''],
            labTests: [''],
            openEnded: ''
        },
        isEligible: null
    },
];

const ISE_3RD_SEM_SUBJECTS = [
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

const ISE_4TH_SEM_SUBJECTS = [
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

const ISE_5TH_SEM_SUBJECTS = [
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

const ISE_6TH_SEM_SUBJECTS = [
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

const CSE_3RD_SEM_SUBJECTS = [
    { code: '3SMA4TC', name: 'Statistics and Probability', credits: 4, hasLab: false },
    { code: '3SCS01', name: 'Operating Systems', credits: 3, hasLab: false },
    { code: '3SCS02', name: 'Digital Circuits and Computer Organization', credits: 3, hasLab: false },
    { code: '3SCS03', name: 'Data Structures and Applications', credits: 3, hasLab: false },
    { code: '3SCSL01', name: 'Data Structures Laboratory', credits: 1, hasLab: true },
    { code: '3ESC01', name: 'Engineering Science Course', credits: 3, hasLab: false },
    { code: '3UHV01', name: 'Social Connect and Responsibility', credits: 1, hasLab: false },
    { code: 'AEC03', name: 'Ability Enhancement Course III', credits: 1, hasLab: false }
];

const CSE_4TH_SEM_SUBJECTS = [
    { code: '4SCS01', name: 'Design and Analysis of Algorithms', credits: 3, hasLab: false },
    { code: '4SCS02', name: 'Microcontroller and Embedded Systems', credits: 3, hasLab: false },
    { code: '4SCS03', name: 'Theory of Computation', credits: 3, hasLab: false },
    { code: '4SCSL01', name: 'Design and Analysis of Algorithms Laboratory', credits: 1, hasLab: true },
    { code: '4ESC01', name: 'Engineering Science Course', credits: 3, hasLab: false },
    { code: '4BSC01', name: 'Biology for Engineers', credits: 3, hasLab: false },
    { code: '4UHV01', name: 'Universal Human Values', credits: 1, hasLab: false },
    { code: 'AEC04', name: 'Ability Enhancement Course IV', credits: 1, hasLab: false }
];

const CSE_5TH_SEM_SUBJECTS = [
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

const CSE_6TH_SEM_SUBJECTS = [
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

const PREFILLED_CURRICULUM = {
    'IS': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS },
    'ISE': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS },
    'CS': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS },
    'CSE': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS }
};


// Confetti Particle System for Subject Eligibility
const triggerSubjectConfetti = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 2,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= 0.02;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                alive = true;
            }
        });
        if (alive) requestAnimationFrame(animate);
    };
    animate();
};

const SubjectConfetti = ({ triggerId, subjectId }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (triggerId === subjectId && canvasRef.current) {
            triggerSubjectConfetti(canvasRef.current);
        }
    }, [triggerId, subjectId]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-50 rounded-xl"
            width={400}
            height={200}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

const CGPACalculatorPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('sgpa');
    const [subjects, setSubjects] = useState([]);
    const [semesters, setSemesters] = useState([
        { id: 1, sem: 1, sgpa: '', credits: '' }
    ]);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const isPremium = user?.subscription === 'askplus' || user?.role === 'premium' || user?.isAdmin;

    // Simplified rules check - always accessible

    // Branch and Cycle selection
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCycle, setSelectedCycle] = useState('P');
    const branchMap = PREFILLED_CURRICULUM[selectedBranch];

    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState('');
    const [showRulesModal, setShowRulesModal] = useState(false);

    const [confettiTrigger, setConfettiTrigger] = useState(null);
    // Tracks which CIE sub-sections are open: { [subjectId_theory]: bool, [subjectId_practical]: bool }
    const [cieSections, setCieSections] = useState({});
    const toggleCIESection = (subjectId, section) => {
        const key = `${subjectId}_${section}`;
        setCieSections(prev => ({ ...prev, [key]: prev[key] === false ? true : false }));
    };
    // Helper: returns true by default (open) unless explicitly closed
    const isSectionOpen = (subjectId, section) => {
        const key = `${subjectId}_${section}`;
        if (!isAuthenticated) return true;
        return cieSections[key] !== false;
    };

    // Per-component analysis state: { [subjectId]: { test: 'idle'|'loading'|'pass'|'fail', quiz: ..., abl: ..., labs: ..., labTests: ... } }
    const [cieAnalysis, setCieAnalysis] = useState({});
    // Tracks missing required fields per subject for CIE calculation
    const [missingFields, setMissingFields] = useState({});

    const cieInputRefs = useRef({});
    const cieSectionRefs = useRef({});
    const [cieInvalidFlash, setCieInvalidFlash] = useState({});

    const sgpaInputRefs = useRef({});

    const getCieRefKey = (subjectId, field, index = null) => `${subjectId}:${field}:${index === null ? 'single' : index}`;

    const registerCieInputRef = (key) => (el) => {
        if (!key) return;
        if (el) cieInputRefs.current[key] = el;
        else delete cieInputRefs.current[key];
    };

    const registerCieSectionRef = (key) => (el) => {
        if (!key) return;
        if (el) cieSectionRefs.current[key] = el;
        else delete cieSectionRefs.current[key];
    };

    const registerSgpaInputRef = (key) => (el) => {
        if (!key) return;
        if (el) sgpaInputRefs.current[key] = el;
        else delete sgpaInputRefs.current[key];
    };

    const flashInvalid = (key) => {
        if (!key) return;
        setCieInvalidFlash((prev) => ({ ...prev, [key]: true }));
        window.setTimeout(() => {
            setCieInvalidFlash((prev) => ({ ...prev, [key]: false }));
        }, 250);
    };

    const clampInt = (raw, max) => {
        if (raw === '') return { value: '', clamped: false };
        const cleaned = String(raw).replace(/[^0-9]/g, '');
        if (cleaned === '') return { value: '', clamped: raw !== '' };
        let n = parseInt(cleaned, 10);
        if (!Number.isFinite(n)) return { value: '', clamped: true };
        if (n < 0) n = 0;
        const maxN = Number(max);
        if (Number.isFinite(maxN) && n > maxN) n = maxN;
        return { value: String(n), clamped: String(raw) !== String(n) };
    };

    const getMaxDigits = (max) => {
        const m = Number(max);
        if (!Number.isFinite(m) || m <= 0) return 2;
        return String(Math.floor(m)).length;
    };

    const buildCieInputOrder = (subject) => {
        const id = subject.id;
        const type = detectSubjectType(subject.credits, subject.hasLab);
        const rule = CIE_RULES[type];
        const m = subject.cieMarks;

        const order = [];

        if (rule.theory?.tests) {
            order.push({ key: getCieRefKey(id, 'test1'), section: 'theory', isEmpty: () => m.test1 === '' || m.test1 === null || m.test1 === undefined });
            order.push({ key: getCieRefKey(id, 'test2'), section: 'theory', isEmpty: () => m.test2 === '' || m.test2 === null || m.test2 === undefined });
        }

        if (rule.theory?.quiz) {
            order.push({ key: getCieRefKey(id, 'quiz1'), section: 'theory', isEmpty: () => m.quiz1 === '' || m.quiz1 === null || m.quiz1 === undefined });
            order.push({ key: getCieRefKey(id, 'quiz2'), section: 'theory', isEmpty: () => m.quiz2 === '' || m.quiz2 === null || m.quiz2 === undefined });
        }

        if (rule.theory?.abl) {
            order.push({ key: getCieRefKey(id, 'abl1'), section: 'theory', isEmpty: () => m.abl1 === '' || m.abl1 === null || m.abl1 === undefined });
            order.push({ key: getCieRefKey(id, 'abl2'), section: 'theory', isEmpty: () => m.abl2 === '' || m.abl2 === null || m.abl2 === undefined });
        }

        if (rule.theory?.internal) {
            order.push({ key: getCieRefKey(id, 'quiz1_internal'), section: 'theory', isEmpty: () => m.quiz1 === '' || m.quiz1 === null || m.quiz1 === undefined });
            order.push({ key: getCieRefKey(id, 'abl1_internal'), section: 'theory', isEmpty: () => m.abl1 === '' || m.abl1 === null || m.abl1 === undefined });
        }

        const labs = Array.isArray(m.labs) ? m.labs : [''];
        if (rule.practical?.record) {
            labs.forEach((val, idx) => {
                order.push({
                    key: getCieRefKey(id, 'labs', idx),
                    section: 'practical',
                    isEmpty: () => val === '' || val === null || val === undefined
                });
            });
        }

        const labTests = Array.isArray(m.labTests) ? m.labTests : [''];
        if (rule.practical?.test) {
            labTests.forEach((val, idx) => {
                order.push({
                    key: getCieRefKey(id, 'labTests', idx),
                    section: 'practical',
                    isEmpty: () => val === '' || val === null || val === undefined
                });
            });
        }

        return order;
    };

    const focusNextCieInput = (subject, currentKey) => {
        const order = buildCieInputOrder(subject);
        const idx = order.findIndex((o) => o.key === currentKey);
        if (idx < 0) return;

        const nextEmpty = order.slice(idx + 1).find((o) => o.isEmpty());
        const next = nextEmpty || order[idx + 1];
        if (!next) return;

        if (order[idx]?.section === 'theory' && next.section === 'practical') {
            const practicalKey = `practical:${subject.id}`;
            const el = cieSectionRefs.current[practicalKey];
            if (el?.scrollIntoView) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        const el = cieInputRefs.current[next.key];
        if (el?.focus) el.focus();
    };

    const preventInvalidNumberKeys = (e) => {
        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
            e.preventDefault();
        }
    };

    const handleCiePaste = (e, subject, currentKey, max, subjectId, field, index = null) => {
        const text = e.clipboardData?.getData('text') ?? '';
        const { value, clamped } = clampInt(text, max);
        e.preventDefault();
        updateCIE(subjectId, field, value, index);
        if (clamped) flashInvalid(currentKey);
        if (value === '') return;
        const digits = getMaxDigits(max);
        const n = parseInt(value, 10);
        if (String(value).length >= digits || n === Number(max)) focusNextCieInput(subject, currentKey);
    };

    const handleSmartCieChange = (e, subject, currentKey, max, subjectId, field, index = null) => {
        const raw = e.target.value;
        const { value, clamped } = clampInt(raw, max);
        if (value !== raw) e.target.value = value;
        updateCIE(subjectId, field, value, index);
        if (clamped) flashInvalid(currentKey);

        if (value === '') return;
        const digits = getMaxDigits(max);
        const n = parseInt(value, 10);
        if (String(value).length >= digits || n === Number(max)) {
            focusNextCieInput(subject, currentKey);
        }
    };

    const handleCieKeyDown = (e, subject, currentKey) => {
        preventInvalidNumberKeys(e);
        if (e.key === 'Enter') {
            e.preventDefault();
            focusNextCieInput(subject, currentKey);
        }
    };

    const getInputModeProps = () => ({ inputMode: 'numeric', pattern: '[0-9]*' });

    const getSgpaRefKey = (subjectId, field) => `sgpa:${subjectId}:${field}`;

    const focusNextSgpaInput = (currentKey) => {
        const subjectsList = Array.isArray(sgpaResult?.subjects) ? sgpaResult.subjects : [];
        const order = [];
        subjectsList.forEach((s) => {
            order.push({
                key: getSgpaRefKey(s.id, 'cie'),
                isEmpty: () => s?.cie === '' || s?.cie === null || s?.cie === undefined
            });
            const seeDisabled = Boolean(isAuthenticated && s?.isEligible === false);
            order.push({
                key: getSgpaRefKey(s.id, 'see'),
                isEmpty: () => (!seeDisabled) && (s?.see === '' || s?.see === null || s?.see === undefined),
                disabled: seeDisabled
            });
        });

        const idx = order.findIndex((o) => o.key === currentKey);
        if (idx < 0) return;

        const nextEmpty = order.slice(idx + 1).find((o) => !o.disabled && o.isEmpty());
        const next = nextEmpty || order.slice(idx + 1).find((o) => !o.disabled);
        if (!next) return;

        const el = sgpaInputRefs.current[next.key];
        if (el?.focus) el.focus();
    };

    const handleSgpaMarkChange = (e, subjectId, field, max, currentKey = null) => {
        const raw = e.target.value;
        const { value, clamped } = clampInt(raw, max);
        if (value !== raw) e.target.value = value;
        updateSubject(subjectId, field, value);

        if (!currentKey) return;
        if (value === '') return;
        const digits = getMaxDigits(max);
        const n = parseInt(value, 10);
        if (clamped || String(value).length >= digits || n === Number(max)) {
            focusNextSgpaInput(currentKey);
        }
    };

    const handleSgpaKeyDown = (e, currentKey) => {
        preventInvalidNumberKeys(e);
        if (e.key === 'Enter') {
            e.preventDefault();
            focusNextSgpaInput(currentKey);
        }
    };
    const setComponentState = (subjectId, component, state) => {
        setCieAnalysis(prev => ({
            ...prev,
            [subjectId]: { ...(prev[subjectId] || {}), [component]: state }
        }));
    };

    const analyzeAndCalculateCIE = async (subject) => {
        const id = subject.id;
        const type = detectSubjectType(subject.credits, subject.hasLab);
        const rule = CIE_RULES[type];
        const m = subject.cieMarks;

        const nextMissing = [];

        if (rule.theory?.tests) {
            if (m.test1 === '' || m.test1 === null || m.test1 === undefined) nextMissing.push('Test 1');
            if (m.test2 === '' || m.test2 === null || m.test2 === undefined) nextMissing.push('Test 2');
        }

        if (rule.theory?.quiz) {
            if (m.quiz1 === '' || m.quiz1 === null || m.quiz1 === undefined) nextMissing.push('Quiz 1');
            if (m.quiz2 === '' || m.quiz2 === null || m.quiz2 === undefined) nextMissing.push('Quiz 2');
        }

        if (rule.theory?.abl) {
            if (m.abl1 === '' || m.abl1 === null || m.abl1 === undefined) nextMissing.push('ABL 1');
            if (m.abl2 === '' || m.abl2 === null || m.abl2 === undefined) nextMissing.push('ABL 2');
        }

        if (rule.theory?.internal) {
            if (m.quiz1 === '' || m.quiz1 === null || m.quiz1 === undefined) nextMissing.push('Internal 1');
            if (m.abl1 === '' || m.abl1 === null || m.abl1 === undefined) nextMissing.push('Internal 2');
        }

        if (rule.practical?.record) {
            const labs = Array.isArray(m.labs) ? m.labs : [''];
            if (labs.some((v) => v === '' || v === null || v === undefined)) nextMissing.push('Lab Records');
        }

        if (rule.practical?.test) {
            const labTests = Array.isArray(m.labTests) ? m.labTests : [''];
            if (labTests.some((v) => v === '' || v === null || v === undefined)) nextMissing.push('Lab Test');
        }

        setMissingFields((prev) => ({ ...prev, [id]: nextMissing }));

        // IMPORTANT: If any required fields are missing, do NOT proceed to analyze or calculate.
        if (nextMissing.length > 0) {
            setCieAnalysis((prev) => ({
                ...prev,
                [id]: { test: 'idle', quiz: 'idle', abl: 'idle', labs: 'idle', labTests: 'idle' }
            }));
            return;
        }

        // Reset all to idle
        setCieAnalysis(prev => ({ ...prev, [id]: { test: 'idle', quiz: 'idle', abl: 'idle', labs: 'idle', labTests: 'idle' } }));
        await new Promise(r => setTimeout(r, 200));

        const delay = (ms) => new Promise(r => setTimeout(r, ms));

        // Helper: analyse one component
        const analyse = async (key, passFn) => {
            setComponentState(id, key, 'loading');
            await delay(750);
            const pass = passFn();
            setComponentState(id, key, pass ? 'pass' : 'fail');
            await delay(300);
        };

        // 1. Tests
        if (rule.theory?.tests) {
            const t1 = parseFloat(m.test1) || 0, t2 = parseFloat(m.test2) || 0;
            await analyse('test', () => (t1 + t2) >= rule.theory.tests.minTotal);
        }
        // 2. Quiz
        if (rule.theory?.quiz) {
            const q1 = parseFloat(m.quiz1) || 0, q2 = parseFloat(m.quiz2) || 0;
            await analyse('quiz', () => (q1 + q2) >= rule.theory.quiz.minTotal);
        }
        // 3. ABL
        if (rule.theory?.abl) {
            const a1 = parseFloat(m.abl1) || 0, a2 = parseFloat(m.abl2) || 0;
            await analyse('abl', () => (a1 + a2) >= rule.theory.abl.minTotal);
        }
        // 4. Labs
        if (rule.practical?.record) {
            const labs = m.labs || [''];
            const labSum = labs.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            await analyse('labs', () => labSum >= rule.practical.record.minTotal);
        }
        // 5. Lab Tests
        if (rule.practical?.test) {
            const lTests = m.labTests || [''];
            const testSumP = lTests.reduce((s, v) => s + (parseFloat(v) || 0), 0);
            await analyse('labTests', () => testSumP >= rule.practical.test.minTotal);
        }

        // Run the actual calculation
        calculateCIE(id);
    };




    // Evaluation Rules Modal Component
    const RulesModal = () => {
        if (!showRulesModal) return null;

        const sections = [
            {
                title: "Internal Assessment (CIE)",
                icon: "📝",
                content: [
                    "Enter marks exactly as conducted in college.",
                    "Do NOT enter reduced or scaled marks.",
                    "The system automatically handles scaling internally."
                ]
            },
            {
                title: "Test Rules (Out of 50 Each)",
                icon: "📋",
                content: [
                    "Test 1 + Test 2 are conducted for 100 marks.",
                    "Minimum requirement: (Test 1 + Test 2) must be ≥ 40.",
                    "Absence: Compensatory marks will replace Test 1 or 2.",
                    "If considered total < 40 → ❌ Not Eligible."
                ]
            },
            {
                title: "Quiz & ABL Rules (Out of 20 Each)",
                icon: "⚡",
                content: [
                    "Quiz 1 + Quiz 2 (40 marks) → Min total ≥ 16.",
                    "ABL 1 + ABL 2 (40 marks) → Min total ≥ 16.",
                    "Failure to meet minimums → ❌ Not Eligible."
                ]
            },
            {
                title: "Practical Rules (Lab)",
                icon: "🧪",
                content: [
                    "Lab Records (350 marks) → Min total ≥ 140 (40%).",
                    "Lab Test (15 marks) → Min score ≥ 6.",
                    "Failure to meet either → ❌ Not Eligible."
                ]
            },
            {
                title: "Final Eligibility & SEE",
                icon: "🎓",
                content: [
                    "Minimum final CIE to write SEE: 20 / 50.",
                    "SEE Passing: Minimum 36 / 100.",
                    "Failing SEE → Grade becomes F automatically."
                ]
            }
        ];

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-all"
                    onClick={() => setShowRulesModal(false)}
                />
                <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-600/10 to-transparent">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <span className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-600/20">📜</span>
                                Evaluation Rules
                            </h3>
                            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-black">Official Grading Guidelines</p>
                        </div>
                        <button
                            onClick={() => setShowRulesModal(false)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-left">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sections.map((section, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all group">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xl group-hover:scale-125 transition-transform duration-300">{section.icon}</span>
                                        <h4 className="text-sm font-black text-purple-400 uppercase tracking-tight">{section.title}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {section.content.map((item, i) => (
                                            <li key={i} className="text-xs text-white/70 flex gap-2">
                                                <span className="text-purple-500/50">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <h4 className="text-xs font-black text-emerald-400 uppercase mb-2">SGPA Calculation</h4>
                            <p className="text-xs text-emerald-200/80 leading-relaxed font-mono">
                                SGPA = Σ (Grade Points × Credits) / Σ Credits
                            </p>
                            <p className="text-[10px] text-emerald-400/60 mt-2 uppercase font-bold tracking-tighter">
                                * F and NE grades contribute 0 grade points
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/20 text-center">
                        <button
                            onClick={() => setShowRulesModal(false)}
                            className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm transition-all shadow-xl shadow-white/5"
                        >
                            Understood, Let's Calculate
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // No longer redirecting to login as calculator is public

    // Set default branch from user's USN or fallback to 'CS'
    useEffect(() => {
        const derived = deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch);
        if (derived) {
            setSelectedBranch(derived);
        } else if (!selectedBranch && !isAuthenticated) {
            // Default to CS for guest if none selected
            setSelectedBranch('CS');
        }
    }, [user?.usn, user?.currentBranch, isAuthenticated]);


    // Add event listener for confetti
    useEffect(() => {
        const handleConfetti = (e) => {
            setConfettiTrigger(e.detail.id);
            // Reset after animation
            setTimeout(() => setConfettiTrigger(null), 2000);
        };
        window.addEventListener('subject-eligible', handleConfetti);
        return () => window.removeEventListener('subject-eligible', handleConfetti);
    }, []);

    // Load subjects when branch or cycle changes
    useEffect(() => {
        const loadSubjects = async () => {
            if (!selectedBranch) return;

            // Clear previous state immediately to avoid stale data
            setSubjects([]);
            setSubjectsError('');

            // Local handling for pre-filled semesters
<<<<<<< HEAD
            const prefilledMap = {
                'IS': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS, '5': ISE_5TH_SEM_SUBJECTS, '6': ISE_6TH_SEM_SUBJECTS },
                'ISE': { '3': ISE_3RD_SEM_SUBJECTS, '4': ISE_4TH_SEM_SUBJECTS, '5': ISE_5TH_SEM_SUBJECTS, '6': ISE_6TH_SEM_SUBJECTS },
                'CS': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS },
                'CSE': { '3': CSE_3RD_SEM_SUBJECTS, '4': CSE_4TH_SEM_SUBJECTS, '5': CSE_5TH_SEM_SUBJECTS, '6': CSE_6TH_SEM_SUBJECTS }
            };
=======
>>>>>>> origin/dev

            if (activeTab === 'sgpa' && branchMap && branchMap[selectedCycle]) {
                const prefilledList = branchMap[selectedCycle];
                const storedCIE = getAllCIEResults();
                setSubjects(
                    prefilledList.map((s, index) => {
                        const prefilledCIE = storedCIE[s.code] || null;
                        return {
                            id: index + 1,
                            name: s.name,
                            code: s.code,
                            credits: s.credits,
                            hasLab: s.hasLab,
                            isOpenEnded: false,
                            isElective: s.isElective || false,
                            options: s.options || null,
                            cie: prefilledCIE ? String(prefilledCIE.cie) : '',
                            see: '',
                            isCIEExpanded: false,
                            cieFilledFromDashboard: !!prefilledCIE,
                            cieMarks: prefilledCIE?.cieMarks || {
                                test1: '', test2: '',
                                quiz1: '', quiz2: '',
                                abl1: '', abl2: '',
                                labs: [''],
                                labTests: [''],
                                openEnded: ''
                            },
                            isEligible: prefilledCIE ? prefilledCIE.isEligible : null
                        };
                    })
                );
                setLoadingSubjects(false);
                return;
            }

            // Explicitly handle "Under Progress" semesters (7-8 or other branches)
            if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(selectedCycle)) {
                // If it wasn't prefilled above, it's either from backend or 🚧
                if (selectedCycle === '1' || selectedCycle === '2' || selectedCycle === 'P' || selectedCycle === 'C') {
                    // This part will fall through to the API call below
                } else {
                    setSubjects([]);
                    setSubjectsError(`Curriculum details for ${selectedCycle}${isNaN(selectedCycle) ? '' : 'th Semester'} ${selectedBranch} are still being updated.`);
                    setLoadingSubjects(false);
                    return;
                }
            }

            setLoadingSubjects(true);
            try {
                // Fetch using the branch code directly as it matches the database seed
                const response = await subjectAPI.getSubjectsByBranch(selectedBranch, selectedCycle);
                const fetchedSubjects = response.data || [];

                if (fetchedSubjects.length > 0) {
                    const storedCIE = getAllCIEResults();
                    setSubjects(
                        fetchedSubjects.map((s, index) => {
                            const credits = Number.isFinite(Number(s.credits)) ? Number(s.credits) : 0;
                            const hasLab = s.name?.toLowerCase().includes('lab');
                            // Check if CIE was pre-computed on the Dashboard
                            const prefilledCIE = storedCIE[s.code] || null;

                            return {
                                id: index + 1,
                                name: s.name,
                                code: s.code,
                                credits,
                                hasLab,
                                isOpenEnded: false,
                                cie: prefilledCIE ? String(prefilledCIE.cie) : '',
                                see: '',
                                isCIEExpanded: false,
                                cieFilledFromDashboard: !!prefilledCIE,
                                cieMarks: prefilledCIE?.cieMarks || {
                                    test1: '', test2: '',
                                    quiz1: '', quiz2: '',
                                    abl1: '', abl2: '',
                                    labs: [''],
                                    labTests: [''],
                                    openEnded: ''
                                },
                                isEligible: prefilledCIE ? prefilledCIE.isEligible : null
                            };
                        })
                    );
                } else {
                    setSubjects([]);
                    setSubjectsError(`🚧 ${selectedCycle}${isNaN(selectedCycle) ? '' : 'th Sem'} is currently under progress! We are working hard to bring it to you soon! ✨`);
                }
            } catch (error) {
                console.error('Error loading subjects:', error);
                setSubjectsError('Failed to load subjects');
                setSubjects([]);
            } finally {
                setLoadingSubjects(false);
            }
        };

        loadSubjects();
    }, [selectedBranch, selectedCycle, activeTab]);

    // Live-sync CIE from Dashboard when user calculates on that page
    useEffect(() => {
        const handleCIEUpdate = (e) => {
            const { subjectCode, cie, isEligible, cleared } = e.detail || {};
            if (!subjectCode) return;
            setSubjects(prev => prev.map(s => {
                if (s.code !== subjectCode) return s;
                if (cleared) return { ...s, cie: '', cieFilledFromDashboard: false, isEligible: null };
                return { ...s, cie: String(cie), cieFilledFromDashboard: true, isEligible };
            }));
        };
        window.addEventListener('cieResultsUpdated', handleCIEUpdate);
        return () => window.removeEventListener('cieResultsUpdated', handleCIEUpdate);
    }, []);

    const renderCIEInputs = (subject, isLocked = false) => {
        const missing = missingFields?.[subject.id] || [];
        const isMissing = (label) => missing.includes(label);
        const type = detectSubjectType(subject.credits, subject.hasLab);
        const rule = CIE_RULES[type];
        const m = subject.cieMarks;

        // Reactive Summary Calculation (Duplicate for UI immediate feedback)
        let theoryExact = 0;
        let theoryMax = rule.theoryMax || 0;
        let practicalExact = 0;
        let practicalMax = rule.practicalMax || 0;

        let testSum = (parseFloat(m.test1) || 0) + (parseFloat(m.test2) || 0);
        let quizSum = (parseFloat(m.quiz1) || 0) + (parseFloat(m.quiz2) || 0);
        let ablSum = (parseFloat(m.abl1) || 0) + (parseFloat(m.abl2) || 0);
        let internalSum = (parseFloat(m.quiz1) || 0) + (parseFloat(m.abl1) || 0);

        // Updated lock overlay for free users/guests
        const cieLockOverlay = (
            <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-50 rounded-lg p-2 text-center group cursor-pointer"
                onClick={() => navigate('/subscription')}
            >
                <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-500/30 mb-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-6V9a6 6 0 10-12 0v2a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                    </svg>
                </div>
                <span className="text-white font-black text-[10px] uppercase tracking-widest px-2">Upgrade to Unlock</span>
                <p className="text-[8px] text-purple-300 font-bold mt-1 uppercase opacity-60">Breakdown available for ASKPLUS</p>
            </div>
        );

        const isOverlayVisible = isLocked;

        if (rule.theory) {
            if (rule.theory.tests) theoryExact += (testSum / rule.theory.tests.max) * rule.theory.tests.reducedTo;
            if (rule.theory.quiz) theoryExact += (quizSum / rule.theory.quiz.max) * rule.theory.quiz.reducedTo;
            if (rule.theory.abl) theoryExact += (ablSum / rule.theory.abl.max) * rule.theory.abl.reducedTo;
            if (rule.theory.internal) theoryExact += (internalSum / rule.theory.internal.max) * rule.theory.internal.reducedTo;
        }

        const theoryScaled = rule.scaleTheoryTo ? (theoryExact / theoryMax) * rule.scaleTheoryTo : theoryExact;
        const theoryTarget = rule.scaleTheoryTo || theoryMax;

        const labs = m.labs || [''];
        const labSum = labs.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const labRawMax = labs.length * 35;
        const labReduced = rule.practical?.record ? (labSum / rule.practical.record.max) * rule.practical.record.reducedTo : 0;

        const lTests = m.labTests || [''];
        const testSumP = lTests.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const testRawMax = lTests.length * 15;
        const testReduced = rule.practical?.test ? (testSumP / (rule.practical.test.max * lTests.length)) * rule.practical.test.reducedTo : 0;
        practicalExact = labReduced + testReduced;
        const totalCIEExact = theoryScaled + practicalExact;

        const ProgressBar = ({ current, max, color = "bg-purple-500", label, raw = "" }) => (
            <div className="space-y-1.5">
                <div className="flex justify-between items-end px-0.5">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-tight">{label}</span>
                    <span className="text-[10px] font-mono text-white/60">
                        {raw && <span className="mr-2 text-white/20 italic">{raw}</span>}
                        <span className="text-white font-bold">{current.toFixed(1)}</span> / {max}
                    </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                        className={`h-full ${color} transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                        style={{ width: `${Math.min(100, (current / max) * 100)}%` }}
                    />
                </div>
            </div>
        );

        const CollapsibleHeader = ({ icon, title, current, max, colorClass, isOpen, onToggle }) => (
            <button
                onClick={onToggle}
                className={`w-full flex items-center justify-between p-3 rounded-t-2xl bg-white/5 border-x border-t border-white/10 hover:bg-white/10 transition-colors ${colorClass} ${!isOpen ? 'rounded-b-2xl border-b' : ''}`}
            // Dropdown is always expandable, no auth check
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10">
                        <span className="text-[10px] font-black mr-1 opacity-40 uppercase">Progress:</span>
                        <span className="text-xs font-black">{current.toFixed(1)} / {max}</span>
                    </div>
                    <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
        );

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* THEORY COMPONENT */}
                {rule.theory && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl">
                        <CollapsibleHeader
                            icon="📚"
                            title="Theory Component"
                            current={theoryScaled}
                            max={theoryTarget}
                            colorClass="text-purple-400"
                            isOpen={isSectionOpen(subject.id, 'theory')}
                            onToggle={() => toggleCIESection(subject.id, 'theory')}
                        />
                        {(isSectionOpen(subject.id, 'theory') || isOverlayVisible) && (
                            <div className="p-5 bg-black/20 border-x border-b border-white/10 space-y-6">
                                {/* Tests */}
                                <div className="space-y-4">
                                    <ProgressBar
                                        label="Test Section"
                                        current={(testSum / rule.theory.tests.max) * rule.theory.tests.reducedTo}
                                        max={rule.theory.tests.reducedTo}
                                        color={testSum < rule.theory.tests.minTotal ? "bg-red-500" : "bg-purple-500"}
                                        raw={`Raw: ${testSum}/100`}
                                    />
                                    <div className="grid grid-cols-2 gap-3 pl-2 border-l border-white/5">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Test 1 (max 50)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" value={m.test1} min="0" max="50" placeholder="Test 1 out of 50"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'test1'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'test1'), 50, subject.id, 'test1')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'test1'), 50, subject.id, 'test1')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'test1'))}
                                                    className={`w-full h-9 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/20 focus:border-purple-500 ${(isMissing('Test 1') || cieInvalidFlash[getCieRefKey(subject.id, 'test1')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}

                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Test 2 (max 50)</label>
                                            <div className="relative">
                                                <input
                                                    type="number" value={m.test2} min="0" max="50" placeholder="Test 2 out of 50"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'test2'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'test2'), 50, subject.id, 'test2')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'test2'), 50, subject.id, 'test2')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'test2'))}
                                                    className={`w-full h-9 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all placeholder:text-white/20 focus:border-purple-500 ${(isMissing('Test 2') || cieInvalidFlash[getCieRefKey(subject.id, 'test2')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                        </div>
                                    </div>
                                    {testSum > 0 && testSum < rule.theory.tests.minTotal && (
                                        <p className="text-[9px] font-black text-red-400 uppercase tracking-tighter pl-2">⚠️ Below Min 40/100 Requirement</p>
                                    )}
                                </div>

                                {/* Quiz & ABL / Internal */}
                                {rule.theory.quiz && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <ProgressBar
                                                label="Quiz Section"
                                                current={(quizSum / rule.theory.quiz.max) * rule.theory.quiz.reducedTo}
                                                max={rule.theory.quiz.reducedTo}
                                                color={quizSum < rule.theory.quiz.minTotal ? "bg-red-500" : "bg-cyan-500"}
                                            />
                                            <div className="grid grid-cols-2 gap-2 pl-2 border-l border-white/5">
                                                <input
                                                    type="number" value={m.quiz1} placeholder="Quiz 1 out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'quiz1'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'quiz1'), 20, subject.id, 'quiz1')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'quiz1'), 20, subject.id, 'quiz1')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'quiz1'))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none placeholder:text-white/20 focus:border-cyan-500 ${(isMissing('Quiz 1') || cieInvalidFlash[getCieRefKey(subject.id, 'quiz1')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                                <input
                                                    type="number" value={m.quiz2} placeholder="Quiz 2 out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'quiz2'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'quiz2'), 20, subject.id, 'quiz2')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'quiz2'), 20, subject.id, 'quiz2')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'quiz2'))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none placeholder:text-white/20 focus:border-cyan-500 ${(isMissing('Quiz 2') || cieInvalidFlash[getCieRefKey(subject.id, 'quiz2')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <ProgressBar
                                                label="ABL Section"
                                                current={(ablSum / rule.theory.abl.max) * rule.theory.abl.reducedTo}
                                                max={rule.theory.abl.reducedTo}
                                                color={ablSum < rule.theory.abl.minTotal ? "bg-red-500" : "bg-blue-500"}
                                            />
                                            <div className="grid grid-cols-2 gap-2 pl-2 border-l border-white/5">
                                                <input
                                                    type="number" value={m.abl1} placeholder="ABL 1 out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'abl1'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'abl1'), 20, subject.id, 'abl1')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'abl1'), 20, subject.id, 'abl1')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'abl1'))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none placeholder:text-white/20 focus:border-blue-500 ${(isMissing('ABL 1') || cieInvalidFlash[getCieRefKey(subject.id, 'abl1')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                                <input
                                                    type="number" value={m.abl2} placeholder="ABL 2 out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'abl2'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'abl2'), 20, subject.id, 'abl2')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'abl2'), 20, subject.id, 'abl2')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'abl2'))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none placeholder:text-white/20 focus:border-blue-500 ${(isMissing('ABL 2') || cieInvalidFlash[getCieRefKey(subject.id, 'abl2')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {rule.theory.internal && (
                                    <div className="space-y-4">
                                        <ProgressBar
                                            label="Internal Assessment"
                                            current={(internalSum / rule.theory.internal.max) * rule.theory.internal.reducedTo}
                                            max={rule.theory.internal.reducedTo}
                                            color={internalSum < rule.theory.internal.minTotal ? "bg-red-500" : "bg-emerald-500"}
                                        />
                                        <div className="grid grid-cols-2 gap-3 pl-2 border-l border-white/5">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">Quiz (20)</label>
                                                <input
                                                    type="number" value={m.quiz1} placeholder="Quiz out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'quiz1_internal'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'quiz1_internal'), 20, subject.id, 'quiz1')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'quiz1_internal'), 20, subject.id, 'quiz1')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'quiz1_internal'))}
                                                    className={`w-full h-9 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all font-mono placeholder:text-white/20 focus:border-emerald-500 ${(isMissing('Internal 1') || cieInvalidFlash[getCieRefKey(subject.id, 'quiz1_internal')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-white/30 uppercase tracking-widest">ABL (20)</label>
                                                <input
                                                    type="number" value={m.abl1} placeholder="ABL out of 20" min="0" max="20"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'abl1_internal'))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'abl1_internal'), 20, subject.id, 'abl1')}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'abl1_internal'), 20, subject.id, 'abl1')}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'abl1_internal'))}
                                                    className={`w-full h-9 bg-white/5 border rounded-lg text-center text-xs font-bold outline-none transition-all font-mono placeholder:text-white/20 focus:border-emerald-500 ${(isMissing('Internal 2') || cieInvalidFlash[getCieRefKey(subject.id, 'abl1_internal')]) ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* PRACTICAL COMPONENT */}
                {rule.practical && (
                    <div ref={registerCieSectionRef(`practical:${subject.id}`)} className="rounded-2xl overflow-hidden shadow-2xl">
                        <CollapsibleHeader
                            icon="🧪"
                            title="Practical Component"
                            current={practicalExact}
                            max={practicalMax}
                            colorClass="text-blue-400"
                            isOpen={isSectionOpen(subject.id, 'practical')}
                            onToggle={() => toggleCIESection(subject.id, 'practical')}
                        />
                        {(isSectionOpen(subject.id, 'practical') || isOverlayVisible) && (
                            <div className="p-5 bg-black/20 border-x border-b border-white/10 space-y-8">
                                {/* Lab Records - Dynamic List */}
                                <div className="space-y-4">
                                    <ProgressBar
                                        label="Lab Records"
                                        current={labReduced}
                                        max={rule.practical.record.reducedTo}
                                        color={labSum < rule.practical.record.minTotal ? "bg-red-500" : "bg-blue-500"}
                                        raw={`Sum: ${labSum}/${labRawMax}`}
                                    />
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pl-2 border-l border-white/5">
                                        {labs.map((val, idx) => (
                                            <div key={idx} className="relative group/lab">
                                                <input
                                                    type="number" value={val} placeholder={`Lab ${idx + 1} out of 35`} min="0" max="35"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'labs', idx))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'labs', idx), 35, subject.id, 'labs', idx)}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'labs', idx), 35, subject.id, 'labs', idx)}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'labs', idx))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none focus:border-blue-500 font-mono placeholder:text-white/20 ${(missing.includes('Lab Records') && val === '') || cieInvalidFlash[getCieRefKey(subject.id, 'labs', idx)] ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                                {missing.includes('Lab Records') && val === '' && <span className="absolute left-0 -top-5 text-xs text-red-400 font-bold">Required</span>}
                                                {labs.length > 1 && (
                                                    <button
                                                        onClick={() => removeCIEItem(subject.id, 'labs', idx)}
                                                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/lab:opacity-100 transition-opacity text-[8px]"
                                                        disabled={isOverlayVisible}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addCIEItem(subject.id, 'labs')}
                                            className="h-8 border border-dashed border-white/20 rounded-lg text-white/40 hover:text-white hover:border-white/40 transition-all text-[10px] font-black uppercase"
                                        >
                                            + Lab
                                        </button>
                                    </div>
                                </div>

                                {/* Lab Tests - Dynamic List */}
                                <div className="space-y-4">
                                    <ProgressBar
                                        label="Lab Test Section"
                                        current={testReduced}
                                        max={rule.practical.test.reducedTo}
                                        color={testSumP < rule.practical.test.minTotal ? "bg-red-500" : "bg-indigo-500"}
                                        raw={`Sum: ${testSumP}/${testRawMax}`}
                                    />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-2 border-l border-white/5">
                                        {lTests.map((val, idx) => (
                                            <div key={idx} className="relative group/test">
                                                <input
                                                    type="number" value={val} placeholder={`Lab Test ${idx + 1} out of 15`} min="0" max="15"
                                                    {...getInputModeProps()}
                                                    onKeyDown={(e) => handleCieKeyDown(e, subject, getCieRefKey(subject.id, 'labTests', idx))}
                                                    onPaste={(e) => handleCiePaste(e, subject, getCieRefKey(subject.id, 'labTests', idx), 15, subject.id, 'labTests', idx)}
                                                    onChange={(e) => handleSmartCieChange(e, subject, getCieRefKey(subject.id, 'labTests', idx), 15, subject.id, 'labTests', idx)}
                                                    ref={registerCieInputRef(getCieRefKey(subject.id, 'labTests', idx))}
                                                    className={`w-full h-8 bg-white/5 border rounded-lg text-center text-[10px] font-bold outline-none focus:border-indigo-500 font-mono placeholder:text-white/20 ${(missing.includes('Lab Test') && val === '') || cieInvalidFlash[getCieRefKey(subject.id, 'labTests', idx)] ? 'border-red-500/60 ring-2 ring-red-500/20' : 'border-white/5'
                                                        }`}
                                                    disabled={isOverlayVisible}
                                                />
                                                {isOverlayVisible && cieLockOverlay}
                                                {missing.includes('Lab Test') && val === '' && <span className="absolute left-0 -top-5 text-xs text-red-400 font-bold">Required</span>}
                                                {lTests.length > 1 && (
                                                    <button
                                                        onClick={() => removeCIEItem(subject.id, 'labTests', idx)}
                                                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/test:opacity-100 transition-opacity text-[8px]"
                                                        disabled={isOverlayVisible}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addCIEItem(subject.id, 'labTests')}
                                            className="h-8 border border-dashed border-white/20 rounded-lg text-white/40 hover:text-white hover:border-white/40 transition-all text-[10px] font-black uppercase"
                                        >
                                            + Test
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* FINAL SUMMARY */}
                <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-white/10"></span>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Final Calculation</span>
                        <span className="h-px flex-1 bg-white/10"></span>
                    </div>

                    {/* Per-component analysis status strip */}
                    {(() => {
                        const analysis = cieAnalysis[subject.id] || {};
                        const type = detectSubjectType(subject.credits, subject.hasLab);
                        const rule = CIE_RULES[type];
                        const components = [
                            rule.theory?.tests && { key: 'test', label: 'Tests' },
                            rule.theory?.quiz && { key: 'quiz', label: 'Quiz' },
                            rule.theory?.abl && { key: 'abl', label: 'ABL' },
                            rule.practical?.record && { key: 'labs', label: 'Lab Records' },
                            rule.practical?.test && { key: 'labTests', label: 'Lab Tests' },
                        ].filter(Boolean);

                        if (!components.some(c => analysis[c.key] && analysis[c.key] !== 'idle')) return null;

                        const StateIcon = ({ state }) => {
                            if (state === 'loading') return (
                                <svg className="w-4 h-4 animate-spin text-yellow-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                                </svg>
                            );
                            if (state === 'pass') return <span className="text-emerald-400 text-base animate-in zoom-in-50 duration-300">✓</span>;
                            if (state === 'fail') return <span className="text-red-400 text-base animate-in zoom-in-50 duration-300">✗</span>;
                            return <span className="w-4 h-4 rounded-full bg-white/10 inline-block" />;
                        };

                        return (
                            <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">Analysing Components…</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {components.map(({ key, label }) => {
                                        const state = analysis[key] || 'idle';
                                        return (
                                            <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${state === 'pass' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                                state === 'fail' ? 'bg-red-500/10 border-red-500/30' :
                                                    state === 'loading' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                                        'bg-white/5 border-white/5'
                                                }`}>
                                                <StateIcon state={state} />
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${state === 'pass' ? 'text-emerald-400' :
                                                    state === 'fail' ? 'text-red-400' :
                                                        state === 'loading' ? 'text-yellow-300' :
                                                            'text-white/30'
                                                    }`}>{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-emerald-600/10 to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-1 group">
                            <span className="text-[9px] font-black text-emerald-400 opacity-40 uppercase tracking-widest">Total CIE</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{totalCIEExact.toFixed(2)}</span>
                                <span className="text-xs font-black text-white/20">/ 50</span>
                            </div>
                            <p className="text-[8px] text-white/30 uppercase font-bold mt-1">Rounded: {Math.round(totalCIEExact)}</p>
                        </div>

                        <div className={`rounded-2xl p-4 border flex flex-col items-center justify-center gap-2 group transition-all ${subject.isEligible === true ? "bg-emerald-500/20 border-emerald-500/40" :
                            subject.isEligible === false ? "bg-red-500/20 border-red-500/40" :
                                "bg-white/5 border-white/10 opacity-40"
                            }`}>
                            <span className="text-[9px] font-black uppercase tracking-widest">Status</span>
                            {subject.isEligible === true ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-black text-emerald-400 tracking-tighter">🏆 ELIGIBLE</span>
                                    <span className="text-[8px] text-emerald-400/60 uppercase font-black animate-pulse">Ready for SEE</span>
                                </div>
                            ) : subject.isEligible === false ? (
                                <div className="flex flex-col items-center">
                                    <span className="text-xl font-black text-red-500 tracking-tighter">⛔ NOT ELIGIBLE</span>
                                    <span className="text-[8px] text-red-500/60 uppercase font-black">Min Criteria Failed</span>
                                </div>
                            ) : (
                                <span className="text-xs font-black text-white/40 uppercase">Pending...</span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => analyzeAndCalculateCIE(subject)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:brightness-110 transition-all active:scale-[0.98] transform group"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <span>⚡ Analyse &amp; Calculate</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>

                    {missing.length > 0 && (
                        <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                            <p className="text-[11px] font-black text-red-200 uppercase tracking-widest">
                                Required fields missing
                            </p>
                            <p className="mt-1 text-[11px] text-red-100/80">
                                Fill: <span className="font-semibold">{missing.join(', ')}</span>
                            </p>
                        </div>
                    )}

                </div>
            </div>
        );
    };

    const updateSubject = (id, field, value) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSubjects(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const toggleCIE = (id) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSubjects(prev => prev.map(s =>
            s.id === id ? { ...s, isCIEExpanded: !s.isCIEExpanded } : s
        ));
    };

    const updateCIE = (id, field, value, index = null) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        // Hard max per field to prevent over-entry
        const FIELD_MAX = {
            test1: 50, test2: 50,
            quiz1: 20, quiz2: 20,
            abl1: 20, abl2: 20,
            labs: 35,
            labTests: 15,
        };
        const maxVal = FIELD_MAX[field];
        let clamped = value;
        if (maxVal !== undefined && value !== '') {
            const num = parseFloat(value);
            if (!isNaN(num)) clamped = String(Math.min(num, maxVal));
        }

        setSubjects(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newCieMarks = { ...s.cieMarks };
            if (index !== null && Array.isArray(newCieMarks[field])) {
                const newArray = [...newCieMarks[field]];
                newArray[index] = clamped;
                newCieMarks[field] = newArray;
            } else {
                newCieMarks[field] = clamped;
            }
            return { ...s, cieMarks: newCieMarks, isEligible: null };
        }));
    };

    const addCIEItem = (id, field) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSubjects(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newCieMarks = { ...s.cieMarks };
            if (Array.isArray(newCieMarks[field])) {
                newCieMarks[field] = [...newCieMarks[field], ''];
            }
            return { ...s, cieMarks: newCieMarks };
        }));
    };

    const removeCIEItem = (id, field, index) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSubjects(prev => prev.map(s => {
            if (s.id !== id) return s;
            const newCieMarks = { ...s.cieMarks };
            if (Array.isArray(newCieMarks[field]) && newCieMarks[field].length > 1) {
                newCieMarks[field] = newCieMarks[field].filter((_, i) => i !== index);
            }
            return { ...s, cieMarks: newCieMarks };
        }));
    };

    const calculateCIE = (id) => {
        setSubjects(prev => prev.map(s => {
            if (s.id !== id) return s;

            const type = detectSubjectType(s.credits, s.hasLab);
            const rule = CIE_RULES[type];
            const m = s.cieMarks;

            let theoryExact = 0;
            let practicalExact = 0;
            let theoryNE = false;
            let practicalNE = false;

            // Theory Calculation
            if (rule.theory) {
                let theoryComponentTotal = 0;

                // 1. Tests (Reduced to 34, Min 40/100)
                if (rule.theory.tests) {
                    const t1 = parseFloat(m.test1) || 0;
                    const t2 = parseFloat(m.test2) || 0;
                    if (t1 + t2 < rule.theory.tests.minTotal) theoryNE = true;
                    theoryComponentTotal += (t1 + t2) / rule.theory.tests.max * rule.theory.tests.reducedTo;
                }

                // 2. Quiz (Reduced to 8, Min 16/40)
                if (rule.theory.quiz) {
                    const q1 = parseFloat(m.quiz1) || 0;
                    const q2 = parseFloat(m.quiz2) || 0;
                    if (q1 + q2 < rule.theory.quiz.minTotal) theoryNE = true;
                    theoryComponentTotal += (q1 + q2) / rule.theory.quiz.max * rule.theory.quiz.reducedTo;
                }

                // 3. ABL (Reduced to 8, Min 16/40)
                if (rule.theory.abl) {
                    const a1 = parseFloat(m.abl1) || 0;
                    const a2 = parseFloat(m.abl2) || 0;
                    if (a1 + a2 < rule.theory.abl.minTotal) theoryNE = true;
                    theoryComponentTotal += (a1 + a2) / rule.theory.abl.max * rule.theory.abl.reducedTo;
                }

                // Internal (for Low Theory)
                if (rule.theory.internal) {
                    const q = parseFloat(m.quiz1) || 0;
                    const a = parseFloat(m.abl1) || 0;
                    if (q + a < rule.theory.internal.minTotal) theoryNE = true;
                    theoryComponentTotal += (q + a) / rule.theory.internal.max * rule.theory.internal.reducedTo;
                }

                theoryExact = theoryComponentTotal;

                // Scale Theory 50 -> 25 for IPCC
                if (rule.scaleTheoryTo) {
                    theoryExact = (theoryComponentTotal / rule.theoryMax) * rule.scaleTheoryTo;
                }
            }

            // Practical Calculation
            if (rule.practical) {
                // 1. Lab Records (Max 35 each, Scaled to 15, Min 140/350 which is 40%)
                if (rule.practical.record) {
                    const labs = m.labs || [''];
                    const labSum = labs.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                    const labMax = labs.length * 35; // User rule: max 35 per lab

                    // We need a baseline max for scaling if it's dynamic.
                    // If user provides 10 labs, max is 350.
                    // Let's use 350 as the standard baseline for 40% check if records length matches typical 10.
                    // Prompts says: Record(350 marks) -> Min 140.
                    if (labSum < rule.practical.record.minTotal) practicalNE = true;
                    // Scale to 15 (IPCC) or 35 (Lab Only)
                    practicalExact += (labSum / rule.practical.record.max) * rule.practical.record.reducedTo;
                }

                // 2. Lab Test (Max 15, Scaled to 10, Min 6)
                if (rule.practical.test) {
                    const tests = m.labTests || [''];
                    const testSum = tests.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                    const testMax = tests.length * 15;

                    if (testSum < rule.practical.test.minTotal) practicalNE = true;
                    practicalExact += (testSum / (rule.practical.test.max * tests.length)) * rule.practical.test.reducedTo;
                    // Wait, if it's dynamic Lab Tests, we should scale based on rule.test.max * length if we want sum scale.
                    // But user representation shows "Lab Test 1 (0-15)".
                    // Let's assume one main lab test is typical, but we support dynamic addition.
                }
            }

            const finalCIEExact = theoryExact + practicalExact;
            const displayCIE = Math.round(finalCIEExact);
            const isEligible = !theoryNE && !practicalNE && finalCIEExact >= rule.minTotal;

            if (isEligible) {
                triggerConfetti(s.id);
            }

            return {
                ...s,
                cie: displayCIE.toString(),
                cieExact: finalCIEExact,
                theorySummary: theoryExact,
                practicalSummary: practicalExact,
                isEligible,
                isCIEExpanded: false,
                type: type
            };
        }));
    };

    const triggerConfetti = (id) => {
        // Simple confetti trigger logic - could be handled by a component
        const event = new CustomEvent('subject-eligible', { detail: { id } });
        window.dispatchEvent(event);
    };

    const addSubject = () => {
        if (!isAuthenticated) return setShowLoginModal(true);
        const newId = Math.max(...subjects.map(s => s.id), 0) + 1;
        setSubjects(prev => [...prev, {
            id: newId,
            name: `Subject ${newId}`,
            credits: 3,
            hasLab: false,
            isOpenEnded: false,
            cie: '',
            see: '',
            isCIEExpanded: false,
            cieMarks: {
                test1: '', test2: '',
                quiz1: '', quiz2: '',
                abl1: '', abl2: '',
                labs: [''],
                labTests: [''],
                openEnded: ''
            },
            isEligible: null
        }]);
    };

    const removeSubject = (id) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        if (subjects.length > 1) {
            setSubjects(prev => prev.filter(s => s.id !== id));
        }
    };

    const resetSubjects = () => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSubjects(prev => prev.map(s => ({ ...s, cie: '', see: '' })));
    };

    const addSemester = () => {
        if (!isAuthenticated) return setShowLoginModal(true);
        const newId = Math.max(...semesters.map(s => s.id), 0) + 1;
        const nextSemNumber = Math.max(...semesters.map(s => s.sem), 0) + 1;
        setSemesters(prev => [...prev, { id: newId, sem: nextSemNumber, sgpa: '', credits: '' }]);
    };

    const removeSemester = (id) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        if (semesters.length > 1) {
            setSemesters(prev => prev.filter(s => s.id !== id));
        };
    };

    const updateSemester = (id, field, value) => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSemesters(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    const resetSemesters = () => {
        if (!isAuthenticated) return setShowLoginModal(true);
        setSemesters([{ id: 1, sem: 1, sgpa: '', credits: '' }]);
    };

    // Calculate SGPA
    const sgpaResult = useMemo(() => {
        let totalCreditsAttempted = 0; // Total credits for all subjects, including NE
        let totalCreditsEarned = 0; // Credits for subjects that are not NE
        let weightedSum = 0;
        let validSubjectsCount = 0;
        let hasFail = false;
        let hasSeeFail = false;

        const subjectResults = subjects.map(subject => {
            const credits = parseFloat(subject.credits) || 0;
            const cie = parseFloat(subject.cie) || 0;
            const see = parseFloat(subject.see) || 0;
            const isNE = subject.isEligible === false; // Not Eligible

            totalCreditsAttempted += credits;

            // If NE, lockout SEE and set points to 0
            if (isNE) {
                validSubjectsCount++; // Count as a valid subject for display, but 0 points
                return {
                    ...subject,
                    total: 'NE',
                    grade: 'NE',
                    points: 0,
                    color: 'text-red-500',
                    seeConverted: null,
                    isValid: true,
                    seeFail: false,
                    isNE: true
                };
            }

            // CIE is out of 50, SEE is entered out of 100 and converted to 50
            const seeConverted = see / 2;
            const total = cie + seeConverted;

            // Validate inputs
            const cieValid = subject.cie !== '' && cie >= 0 && cie <= 50;
            const seeValid = subject.see !== '' && see >= 0 && see <= 100;

            // 0-credit subjects (e.g. audit / premium / coming-soon) should not block UI.
            // If marks are entered, show a PP grade without affecting SGPA.
            if (credits <= 0) {
                if (!cieValid || !seeValid) {
                    return { ...subject, total: null, grade: null, points: null, seeConverted: null, isValid: false, seeFail: false, isNE: false };
                }

                return {
                    ...subject,
                    seeConverted: seeConverted.toFixed(1),
                    total: total.toFixed(1),
                    grade: 'PP',
                    points: null,
                    color: 'text-blue-400',
                    seeFail: false,
                    isValid: true,
                    isNE: false
                };
            }

            if (!cieValid || !seeValid || credits <= 0) {
                return { ...subject, total: null, grade: null, points: null, seeConverted: null, isValid: false, seeFail: false, isNE: false };
            }

            // Pass SEE marks (out of 100) to check minimum requirement
            const gradeInfo = getGradeFromTotal(total, see);

            if (gradeInfo.points === 0) hasFail = true;
            if (gradeInfo.seeFail) hasSeeFail = true;

            totalCreditsEarned += credits;
            weightedSum += credits * gradeInfo.points;
            validSubjectsCount++;

            return {
                ...subject,
                seeConverted: seeConverted.toFixed(1),
                total: total.toFixed(1),
                grade: gradeInfo.grade,
                points: gradeInfo.points,
                color: gradeInfo.color,
                seeFail: gradeInfo.seeFail || false,
                isValid: true,
                isNE: false
            };
        });

        const sgpa = totalCreditsAttempted > 0 ? (weightedSum / totalCreditsAttempted).toFixed(2) : '0.00';

        return {
            subjects: subjectResults,
            sgpa: parseFloat(sgpa),
            totalCredits: totalCreditsAttempted,
            weightedSum,
            validSubjects: validSubjectsCount,
            hasFail,
            hasSeeFail
        };
    }, [subjects]);

    // Calculate CGPA
    const cgpaResult = useMemo(() => {
        let totalCredits = 0;
        let weightedSum = 0;
        let validSemesters = 0;

        for (const sem of semesters) {
            const sgpa = parseFloat(sem.sgpa);
            const credits = parseFloat(sem.credits) || 0;

            if (isNaN(sgpa) || sgpa < 0 || sgpa > 10) continue;

            validSemesters++;

            if (credits > 0) {
                totalCredits += credits;
                weightedSum += sgpa * credits;
            } else {
                totalCredits += 1;
                weightedSum += sgpa;
            }
        }

        const cgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : 0;
        return { cgpa: parseFloat(cgpa), semestersCount: validSemesters, totalCredits, weightedSum };
    }, [semesters]);

    const getTodayKey = () => {
        const d = new Date();
        const pad2 = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    const getPdfDownloadState = () => {
        const today = getTodayKey();

        if (isAuthenticated && user?.id) {
            const storageKey = `pdf_download_${user.id}`;
            try {
                const raw = localStorage.getItem(storageKey);
                const parsed = raw ? JSON.parse(raw) : null;
                const lastDate = parsed?.lastDownloadDate;
                const count = Number(parsed?.downloadCount) || 0;
                if (lastDate !== today) return { mode: 'user', storageKey, today, downloadCount: 0, lastDownloadDate: today };
                return { mode: 'user', storageKey, today, downloadCount: count, lastDownloadDate: lastDate };
            } catch {
                return { mode: 'user', storageKey, today, downloadCount: 0, lastDownloadDate: today };
            }
        }

        const guestKey = 'pdf_download_guest_session';
        const guestCount = Number(sessionStorage.getItem(guestKey) || '0') || 0;
        return { mode: 'guest', guestKey, guestCount };
    };

    const canDownloadPdf = useMemo(() => {
        const subjectsList = Array.isArray(sgpaResult?.subjects) ? sgpaResult.subjects : [];

        // Only gate download on subjects that actually count toward SGPA.
        // (e.g. ignore 0-credit / coming-soon rows)
        const countableSubjects = subjectsList.filter((s) => (Number(s?.credits) || 0) > 0);

        const allComplete = countableSubjects.length > 0 && countableSubjects.every((s) => {
            // NE subjects are considered complete based on computed validity.
            if (s?.isNE) return s?.isValid === true;

            const cieOk = s?.cie !== '' && s?.cie !== null && s?.cie !== undefined;
            const seeOk = s?.see !== '' && s?.see !== null && s?.see !== undefined;
            const gradeOk = s?.grade !== null && s?.grade !== undefined && String(s.grade).trim() !== '';
            const totalOk = s?.total !== null && s?.total !== undefined && String(s.total).trim() !== '';
            return Boolean(cieOk && seeOk && gradeOk && totalOk && s?.isValid === true);
        });

        const sgpaReady = Boolean(sgpaResult?.validSubjects > 0 && Number(sgpaResult?.sgpa) > 0);

        if (!allComplete || !sgpaReady) {
            return {
                allowed: false,
                reason: 'Please complete all subject entries before downloading the report.'
            };
        }

        const dl = getPdfDownloadState();
        if (dl.mode === 'user') {
            if (dl.downloadCount >= 3 && dl.lastDownloadDate === dl.today) {
                return {
                    allowed: false,
                    reason: 'Daily download limit reached (3 per day). Try again tomorrow.'
                };
            }
        } else {
            if (dl.guestCount >= 1) {
                return {
                    allowed: false,
                    reason: 'Guests can download only one report. Login for more downloads.'
                };
            }
        }

        return { allowed: true, reason: '' };
    }, [sgpaResult, isAuthenticated, user?.id]);

    const incrementPdfDownloadCount = () => {
        const dl = getPdfDownloadState();
        if (dl.mode === 'user') {
            const next = {
                downloadCount: (Number(dl.downloadCount) || 0) + 1,
                lastDownloadDate: dl.today
            };
            localStorage.setItem(dl.storageKey, JSON.stringify(next));
        } else {
            sessionStorage.setItem(dl.guestKey, String((Number(dl.guestCount) || 0) + 1));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white">🎓 CGPA / SGPA Calculator</h1>
                            <p className="text-xs text-white/60">Enter CIE & SEE marks to calculate your grade 📊</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* LEFT SIDE - Calculator */}
                    <div className="flex-1">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
                            <button
                                onClick={() => setActiveTab('sgpa')}
                                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${activeTab === 'sgpa'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                SGPA Calculator
                            </button>
                            <button
                                onClick={() => setActiveTab('cgpa')}
                                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition ${activeTab === 'cgpa'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                CGPA Calculator
                            </button>
                        </div>

                        {/* SGPA Calculator */}
                        {activeTab === 'sgpa' && (
                            <div className="space-y-4">
                                {/* Branch & Semester Selector */}
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-white">Select Branch & Semester</h3>

                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative">
                                            <label className="text-xs font-medium text-white/60 mb-1 block">Branch</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedBranch}
                                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                                    className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-purple-500 transition cursor-pointer pr-10 appearance-none"
                                                >
                                                    <option value="" className="bg-slate-800">Select Branch</option>
                                                    {BRANCHES.map(b => (
                                                        <option key={b.code} value={b.code} className="bg-slate-800">
                                                            {b.code} - {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-white/60 mb-1 block">Semester / Cycle</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedCycle}
                                                    onChange={(e) => setSelectedCycle(e.target.value)}
                                                    className="w-full h-11 px-4 rounded-xl bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-purple-500 transition cursor-pointer pr-10 appearance-none font-semibold"
                                                >
                                                    <optgroup label="1st Year" className="bg-slate-800">
                                                        <option value="P">P Cycle</option>
                                                        <option value="C">C Cycle</option>
                                                    </optgroup>
                                                    <optgroup label="Higher Semesters" className="bg-slate-800">
                                                        <option value="3">3rd Semester</option>
                                                        <option value="4">4th Semester</option>
                                                        <option value="5">5th Semester</option>
                                                        <option value="6">6th Semester</option>
                                                        <option value="7">7th Semester</option>
                                                        <option value="8">8th Semester</option>
                                                    </optgroup>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {loadingSubjects && (
                                        <div className="mt-3 text-xs text-white/50 flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                            Loading subjects...
                                        </div>
                                    )}
                                    {subjectsError && !loadingSubjects && (
                                        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                                            <span className="text-xl">🚧</span>
                                            <div className="text-[11px] font-bold text-amber-200/80 leading-snug">
                                                {subjectsError}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Local Prefilled Header */}
                                {activeTab === 'sgpa' && branchMap && branchMap[selectedCycle] && (
                                    <div className="rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                                                    {selectedCycle}{isNaN(selectedCycle) ? '' : 'th Semester'} - {selectedBranch === 'CS' || selectedBranch === 'CSE' ? 'Computer Science' : 'Information Science'}
                                                </h3>
                                                <p className="text-[10px] text-blue-300 font-bold uppercase opacity-60">Subjects pre-filled based on departmental curriculum</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Guest Banner */}




                                {/* Subject Inputs */}
                                <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-white">Enter Subject Marks</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={resetSubjects}
                                                className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={addSubject}
                                                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition"
                                            >
                                                + Add Subject
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {/* Table Header */}
                                        <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-black text-white/40 px-5 tracking-widest uppercase mb-2">
                                            <div className="col-span-4">Subject Name</div>
                                            <div className="col-span-1 text-center">Credits</div>
                                            <div className="col-span-2 text-center">CIE (50)</div>
                                            <div className="col-span-2 text-center">SEE (100)</div>
                                            <div className="col-span-1 text-center">Grade</div>
                                            <div className="col-span-1 text-center">Pts</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {sgpaResult.subjects.length === 0 && !loadingSubjects && (
                                            <div className="py-12 px-6 text-center">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                                    <span className="text-4xl animate-pulse">🛠️</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-white mb-2">Semester Details Coming Soon!</h4>
                                                <p className="text-sm text-white/50 max-w-xs mx-auto">
                                                    We are currently updating the curriculum for {selectedCycle}{isNaN(selectedCycle) ? '' : 'th Semester'} {selectedBranch}. Stay tuned!
                                                </p>
                                                <div className="mt-6 flex justify-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        )}

                                        {sgpaResult.subjects.map((subject, index) => {
                                            // UPGRADE_SECTION_HIDDEN: Restore lock behavior when subscription returns
                                            // const isLocked = index > 0 && !isPremium;
                                            const isLocked = false;
                                            return (
                                                <div
                                                    key={subject.id}
                                                    className={`relative rounded-xl border transition-all duration-300 ${subject.isEligible === true ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/10' : subject.isEligible === false ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'} hover:border-white/20 mb-3 overflow-hidden`}
                                                >
                                                    <SubjectConfetti triggerId={confettiTrigger} subjectId={subject.id} />

                                                    {/* Subject Header & Basic Inputs - Row Layout */}
                                                    <div className="grid grid-cols-12 gap-3 items-center p-3 sm:px-5">
                                                        {/* Subject Name */}
                                                        <div className="col-span-12 sm:col-span-4">
                                                            <div className="flex items-center gap-3">
                                                                {isAuthenticated && (
                                                                    subject.cieFilledFromDashboard ? (
                                                                        <span
                                                                            className="px-2 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 text-[9px] font-black flex-shrink-0 whitespace-nowrap"
                                                                            title="CIE calculated from Dashboard"
                                                                        >
                                                                            📊 Dashboard
                                                                        </span>
                                                                    ) : (
                                                                        isLocked ? (
                                                                            <button
                                                                                onClick={() => navigate('/subscription')}
                                                                                className="p-1.5 rounded-lg bg-white/5 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all flex-shrink-0"
                                                                                title="Breakdown locked - Upgrade to unlock"
                                                                            >
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                                </svg>
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => toggleCIE(subject.id)}
                                                                                className={`p-1.5 rounded-lg transition-all ${subject.isCIEExpanded ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'hover:bg-white/10 text-white/40'} flex-shrink-0`}
                                                                                title="Open CIE Calculator"
                                                                            >
                                                                                <svg className={`w-4 h-4 transform transition-transform ${subject.isCIEExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                                                </svg>
                                                                            </button>
                                                                        )
                                                                    )
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        {subject.code ? (
                                                                            <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/20">
                                                                                {subject.code}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    {subject.code ? (
                                                                        <>
                                                                            {subject.options ? (
                                                                                <div className="relative group">
                                                                                    <select
                                                                                        value={subject.code}
                                                                                        onChange={(e) => {
                                                                                            const opt = subject.options.find(o => o.code === e.target.value);
                                                                                            setSubjects(prev => prev.map(s =>
                                                                                                s.id === subject.id ? { ...s, name: opt.name, code: opt.code } : s
                                                                                            ));
                                                                                        }}
                                                                                        className="w-full bg-purple-600/10 border border-purple-500/30 text-white text-sm font-bold py-1 px-3 rounded-xl outline-none appearance-none cursor-pointer hover:bg-purple-600/20 transition-all"
                                                                                    >
                                                                                        {subject.options.map(opt => (
                                                                                            <option key={opt.code} value={opt.code} className="bg-slate-900">
                                                                                                {opt.name} ({opt.code})
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                                                        </svg>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="text-sm text-white font-bold truncate leading-tight" title={subject.name}>
                                                                                        {subject.name}
                                                                                    </div>
                                                                                    <div className="mt-0.5">
                                                                                        <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20 uppercase tracking-tighter whitespace-nowrap">
                                                                                            {detectSubjectType(subject.credits, subject.hasLab)}
                                                                                        </span>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ position: 'relative' }}>
                                                                            <input
                                                                                type="text"
                                                                                value={subject.name}
                                                                                onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                                                className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-bold outline-none focus:border-purple-500 transition-all placeholder:text-white/20"
                                                                                placeholder="Subject name"
                                                                                disabled={!isAuthenticated}
                                                                            />
                                                                            {!isAuthenticated && (
                                                                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                                                                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17v.01M12 13a4 4 0 100-8 4 4 0 000 8zm0 0v4" />
                                                                                    </svg>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Credits */}
                                                        <div className="col-span-3 sm:col-span-1">
                                                            {subject.code ? (
                                                                <div className="text-center text-white font-black text-sm py-1.5 rounded-xl border border-white/5 bg-white/5">
                                                                    {subject.credits}
                                                                </div>
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="6"
                                                                    value={subject.credits}
                                                                    onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                                                                    className="w-full h-10 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center font-bold outline-none focus:border-purple-500 transition-all"
                                                                    placeholder="Cr"
                                                                    disabled={false}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* CIE (out of 50) */}
                                                        <div className="col-span-3 sm:col-span-2">
                                                            <div className="relative group/cie">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="50"
                                                                    {...getInputModeProps()}
                                                                    onKeyDown={(e) => handleSgpaKeyDown(e, getSgpaRefKey(subject.id, 'cie'))}
                                                                    readOnly={isAuthenticated && (subject.isCIEExpanded || subject.cieFilledFromDashboard)}
                                                                    ref={registerSgpaInputRef(getSgpaRefKey(subject.id, 'cie'))}
                                                                    value={subject.cie}
                                                                    onChange={(e) => handleSgpaMarkChange(e, subject.id, 'cie', 50, getSgpaRefKey(subject.id, 'cie'))}
                                                                    className={`w-full h-10 px-2 rounded-xl border text-sm text-center outline-none transition-all font-black ${subject.cieFilledFromDashboard
                                                                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 cursor-default'
                                                                        : subject.isEligible === true
                                                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                                            : subject.isEligible === false
                                                                                ? 'bg-red-500/20 border-red-500/50 text-red-500'
                                                                                : 'bg-white/5 border-white/10 text-white focus:border-purple-500/50'
                                                                        }`}
                                                                    placeholder="0-50"
                                                                />
                                                                {subject.cieFilledFromDashboard && (
                                                                    <span className="absolute -top-2 -right-1 text-[8px] bg-violet-600 text-white rounded px-1 font-black leading-4">auto</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* SEE (out of 100) */}
                                                        <div className="col-span-3 sm:col-span-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                {...getInputModeProps()}
                                                                onKeyDown={(e) => handleSgpaKeyDown(e, getSgpaRefKey(subject.id, 'see'))}
                                                                disabled={isAuthenticated && subject.isEligible === false}
                                                                ref={registerSgpaInputRef(getSgpaRefKey(subject.id, 'see'))}
                                                                value={subject.see}
                                                                onChange={(e) => handleSgpaMarkChange(e, subject.id, 'see', 100, getSgpaRefKey(subject.id, 'see'))}
                                                                className={`w-full h-10 px-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center font-black outline-none focus:border-purple-500 transition-all ${isAuthenticated && subject.isEligible === false ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                                                                placeholder={subject.isEligible === false ? 'NE' : '0-100'}
                                                            />
                                                        </div>

                                                        {/* Grade */}
                                                        <div className="col-span-2 sm:col-span-1 text-center">
                                                            <div className={`text-[11px] font-black w-10 sm:w-8 mx-auto h-8 flex items-center justify-center rounded-lg border shadow-sm ${subject.isNE ? 'bg-red-500/10 border-red-500/30 text-red-500' : (subject.color ? `bg-white/5 border-white/10 ${subject.color}` : 'bg-white/5 border-white/5 text-white/20')}`}>
                                                                {subject.grade || '-'}
                                                            </div>
                                                        </div>

                                                        {/* Points */}
                                                        <div className="col-span-1 sm:col-span-1 text-center">
                                                            <div className={`text-xs font-black min-w-8 h-8 flex items-center justify-center rounded-lg ${subject.points !== null ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}>
                                                                {subject.points !== null ? subject.points : '-'}
                                                            </div>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <div className="col-span-2 sm:col-span-1 text-center">
                                                            <button
                                                                onClick={() => removeSubject(subject.id)}
                                                                className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-all inline-flex items-center justify-center border border-red-500/20"
                                                                disabled={!isAuthenticated || subjects.length === 1}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Advanced CIE Inputs (Authenticated Only) */}
                                                    {isAuthenticated && subject.isCIEExpanded && (
                                                        <div className="px-4 py-4 mt-1 border-t border-white/10 bg-black/20 animate-in slide-in-from-top-4 duration-300">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-black text-white tracking-widest uppercase">CIE CALCULATOR</h4>
                                                                        <p className="text-[10px] text-purple-400 font-bold">{CIE_RULES[detectSubjectType(subject.credits, subject.hasLab)].name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/5">
                                                                    <button
                                                                        onClick={() => updateSubject(subject.id, 'hasLab', !subject.hasLab)}
                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${subject.hasLab ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                                                        disabled={!isAuthenticated}
                                                                    >
                                                                        {subject.hasLab ? '✓ LAB INCLUDED' : '+ ADD LAB'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateSubject(subject.id, 'isOpenEnded', !subject.isOpenEnded)}
                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${subject.isOpenEnded ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                                                        disabled={!isAuthenticated}
                                                                    >
                                                                        {subject.isOpenEnded ? '✓ OPEN ENDED' : '+ ADD OPEN ENDED'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {renderCIEInputs(subject, isLocked)}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* SGPA Result */}
                                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm text-white/60">Semester Grade Point Average</p>
                                            <p className="text-xs text-white/40 mt-1">
                                                {sgpaResult.validSubjects} subjects • {sgpaResult.totalCredits} credits
                                            </p>
                                            {sgpaResult.hasSeeFail && (
                                                <p className="text-xs text-red-400 mt-1">❌ SEE marks below 36 - Auto FAIL</p>
                                            )}
                                            {sgpaResult.hasFail && !sgpaResult.hasSeeFail && (
                                                <p className="text-xs text-amber-400 mt-1">⚠️ Failed in one or more subjects</p>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                                {sgpaResult.sgpa || '0.00'}
                                            </div>
                                            <p className="text-sm text-white/60 mt-1">SGPA</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center mt-6">
                                        <button
                                            disabled={!canDownloadPdf.allowed}
                                            className={`px-6 py-3 rounded-xl text-white font-bold shadow-lg transition ${canDownloadPdf.allowed
                                                ? 'bg-purple-600 hover:bg-purple-700'
                                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                                                }`}
                                            onClick={() => {
                                                if (!canDownloadPdf.allowed) return;
                                                import('../utils/generateResultAnalysisPDF').then(({ generateResultAnalysisPDF }) => {
                                                    generateResultAnalysisPDF({
                                                        generatedOn: new Date().toISOString(),
                                                        student: {
                                                            name: user?.name || "Student",
                                                            usn: user?.usn || "USN",
                                                            program: user?.program || "",
                                                            semester: semesters[0]?.sem || "",
                                                            year: new Date().getFullYear()
                                                        },
                                                        subjects: sgpaResult.subjects.map(subj => ({
                                                            name: subj.name,
                                                            credits: subj.credits,
                                                            type: subj.type,
                                                            cieRounded: subj.cie,
                                                            theoryContribution: subj.theorySummary,
                                                            practicalContribution: subj.practicalSummary,
                                                            see: subj.see,
                                                            seeReduced: subj.seeConverted,
                                                            finalMarks: subj.total,
                                                            grade: subj.grade,
                                                            gradePoints: subj.points,
                                                            status: subj.isNE ? 'Not Eligible' : 'Eligible'
                                                        })),
                                                        totalCredits: sgpaResult.totalCredits,
                                                        totalPoints: sgpaResult.weightedSum,
                                                        sgpa: sgpaResult.sgpa
                                                    });

                                                    incrementPdfDownloadCount();
                                                });
                                            }}
                                        >
                                            Download Result Analysis PDF
                                        </button>
                                    </div>

                                    {!canDownloadPdf.allowed && (
                                        <div className="mt-3 text-center">
                                            <p className="text-xs font-semibold text-red-300">
                                                {canDownloadPdf.reason}
                                            </p>
                                        </div>
                                    )}
                                </div> {/* <-- Properly close SGPA summary card here */}
                            </div>
                        )}

                        {/* CGPA Calculator */}
                        {activeTab === 'cgpa' && (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Enter SGPA for Each Semester</h3>
                                            <p className="text-xs text-white/50 mt-1">Credits are optional (for weighted average)</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={resetSemesters}
                                                className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={addSemester}
                                                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition"
                                            >
                                                + Add Semester
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Semester List */}
                                <div className="p-4 space-y-3">
                                    {semesters.map((sem, idx) => (
                                        <div key={sem.id} className="grid grid-cols-12 gap-3 items-center">
                                            <div className="col-span-4 sm:col-span-5">
                                                <input
                                                    type="text"
                                                    value={`Semester ${sem.sem}`}
                                                    readOnly
                                                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold outline-none"
                                                />
                                            </div>
                                            <div className="col-span-3 sm:col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.01"
                                                    value={sem.sgpa}
                                                    onChange={(e) => updateSemester(sem.id, 'sgpa', e.target.value)}
                                                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center font-bold outline-none focus:border-purple-500"
                                                    placeholder="SGPA"
                                                />
                                            </div>
                                            <div className="col-span-3 sm:col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="30"
                                                    step="1"
                                                    value={sem.credits}
                                                    onChange={(e) => updateSemester(sem.id, 'credits', e.target.value)}
                                                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center font-bold outline-none focus:border-purple-500"
                                                    placeholder="Credits"
                                                />
                                            </div>
                                            <div className="col-span-2 sm:col-span-1 text-center">
                                                <button
                                                    onClick={() => removeSemester(sem.id)}
                                                    className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-all inline-flex items-center justify-center border border-red-500/20"
                                                    disabled={semesters.length <= 1}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* CGPA Result */}
                                <div className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm text-white/60">Cumulative Grade Point Average</p>
                                            <p className="text-xs text-white/40 mt-1">
                                                Based on {cgpaResult.semestersCount} semester{cgpaResult.semestersCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                                                {cgpaResult.cgpa || '0.00'}
                                            </div>
                                            <p className="text-sm text-white/60 mt-1">CGPA</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Percentage Conversion */}
                                {cgpaResult.cgpa > 0 && (
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                        <h3 className="text-sm font-semibold text-white mb-3">Percentage Equivalent</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, ((cgpaResult.cgpa - 4) / 6) * 100)}%` }}
                                                />
                                            </div>
                                            <div className="text-lg font-bold text-white">
                                                {((cgpaResult.cgpa - 0.75) * 10).toFixed(1)}%
                                            </div>
                                        </div>
                                        <p className="text-xs text-white/50 mt-2">
                                            Formula: Percentage = (CGPA - 0.75) × 10
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE - Info & Rules */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 p-6 lg:sticky lg:top-24 space-y-6">
                            {/* Rules Call to Action */}
                            <div className="relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-20 group-hover:opacity-30 transition-opacity rounded-2xl" />
                                <div className="relative rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="p-3 bg-white/10 rounded-xl">
                                            <span className="text-2xl">📜</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Know about rules!</h4>
                                            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1 leading-none">Grading & Eligibility</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowRulesModal(true)}
                                        className="w-full py-2.5 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5 transform active:scale-95"
                                    >
                                        View Guidelines
                                    </button>
                                </div>
                            </div>

                            {/* Pro Tip - Contextual */}
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-left">
                                <div className="text-sm text-emerald-300 mb-2 font-semibold flex items-center gap-2">
                                    💡 Pro Tip
                                </div>
                                <div className="text-xs text-emerald-200/80 leading-relaxed">
                                    {activeTab === 'sgpa'
                                        ? 'SEE marks are entered out of 100 and automatically converted to 50. Focus on both CIE and SEE for better grades!'
                                        : 'Your CGPA is the weighted average of all your semester SGPAs. Consistent performance across semesters is key!'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <RulesModal />

            </div>
            {/* Login Required Modal */}
            <LoginRequiredModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                featureName="Calculator Features"
                description="Sign in to save your results, use the advanced CIE calculator, and access all analysis features."
            />
        </div>
    );
};

export default CGPACalculatorPage;
