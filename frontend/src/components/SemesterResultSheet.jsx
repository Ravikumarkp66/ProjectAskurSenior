import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiV2 } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, ClipboardCheck, FileText, 
    ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2,
    X, Edit3, Save, Check, Calculator, Plus, Trash2, RotateCcw, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Realistic Static Dummy Data for Non-Plus Users (Zero DB/API calls) ──
const DUMMY_ACADEMIC_RESULTS = {
    scheme: 'Scheme 2025',
    student: {
        branch: 'CSE',
        usn: '1RV22CS099',
        name: 'Sample Student'
    },
    availableSemesters: [1, 2, 3, 4, 5, 6, 7, 8],
    summary: {
        sgpa: 8.90,
        cgpa: 8.90,
        totalCredits: 15.5,
        earnedCredits: 15.5
    },
    subjects: [
        {
            code: '21MAT41',
            name: 'Complex Analysis, Probability and Statistical Methods',
            credits: 3,
            evaluationGroup: 'theory',
            contributesToSGPA: true,
            cie: {
                obtained: 42.5,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'TEST_1', name: 'Internal Assessment Test 1', targetMax: 17, normalizedMarks: 14.5, rawMarks: 25.5, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'TEST_2', name: 'Internal Assessment Test 2', targetMax: 17, normalizedMarks: 15.0, rawMarks: 26.5, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'QUIZ_1', name: 'Quiz 1', targetMax: 4, normalizedMarks: 3.4, rawMarks: 8.5, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'QUIZ_2', name: 'Quiz 2', targetMax: 4, normalizedMarks: 3.4, rawMarks: 8.5, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_1', name: 'Assignment 1', targetMax: 4, normalizedMarks: 3.1, rawMarks: 7.75, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_2', name: 'Assignment 2', targetMax: 4, normalizedMarks: 3.1, rawMarks: 7.75, rawMaxMarks: 10, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: true,
                obtained: 41.5,
                max: 50,
                marks: 83,
                rawMarks: 83,
                rawMax: 100
            },
            aggregate: {
                obtained: 84.0,
                max: 100
            },
            grade: {
                letter: 'A+',
                gradePoint: 9,
                description: 'Excellent'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE and attendance requirements met'
            }
        },
        {
            code: '21CS42',
            name: 'Design and Analysis of Algorithms',
            credits: 4,
            evaluationGroup: 'ipcc',
            contributesToSGPA: true,
            cie: {
                obtained: 45.0,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'IPCC_THEORY_TEST_1', name: 'Theory Test 1', targetMax: 8.5, normalizedMarks: 7.25, rawMarks: 42.5, rawMaxMarks: 50, status: 'ENTERED' },
                    { key: 'IPCC_THEORY_TEST_2', name: 'Theory Test 2', targetMax: 8.5, normalizedMarks: 7.25, rawMarks: 42.5, rawMaxMarks: 50, status: 'ENTERED' },
                    { key: 'IPCC_THEORY_QUIZ_1', name: 'Quiz 1', targetMax: 2, normalizedMarks: 1.75, rawMarks: 17.5, rawMaxMarks: 20, status: 'ENTERED' },
                    { key: 'IPCC_THEORY_QUIZ_2', name: 'Quiz 2', targetMax: 2, normalizedMarks: 1.75, rawMarks: 17.5, rawMaxMarks: 20, status: 'ENTERED' },
                    { key: 'IPCC_THEORY_ASSIGNMENT_1', name: 'Assignment 1', targetMax: 2, normalizedMarks: 1.75, rawMarks: 17.5, rawMaxMarks: 20, status: 'ENTERED' },
                    { key: 'IPCC_THEORY_ASSIGNMENT_2', name: 'Assignment 2', targetMax: 2, normalizedMarks: 1.75, rawMarks: 17.5, rawMaxMarks: 20, status: 'ENTERED' },
                    { key: 'LAB_CONDUCTION', name: 'Lab Conduction & Record', targetMax: 15, normalizedMarks: 14.5, rawMarks: 338, rawMaxMarks: 350, status: 'ENTERED' },
                    { key: 'LAB_TEST', name: 'Lab Internal Test', targetMax: 10, normalizedMarks: 9.0, rawMarks: 13.5, rawMaxMarks: 15, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: true,
                obtained: 42.0,
                max: 50,
                marks: 84,
                rawMarks: 84,
                rawMax: 100
            },
            aggregate: {
                obtained: 87.0,
                max: 100
            },
            grade: {
                letter: 'A+',
                gradePoint: 9,
                description: 'Excellent'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE and attendance requirements met'
            }
        },
        {
            code: '21CS43',
            name: 'Operating Systems',
            credits: 3,
            evaluationGroup: 'theory',
            contributesToSGPA: true,
            cie: {
                obtained: 38.5,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'TEST_1', name: 'Internal Assessment Test 1', targetMax: 17, normalizedMarks: 13.0, rawMarks: 23, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'TEST_2', name: 'Internal Assessment Test 2', targetMax: 17, normalizedMarks: 13.5, rawMarks: 24, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'QUIZ_1', name: 'Quiz 1', targetMax: 4, normalizedMarks: 3.0, rawMarks: 7.5, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'QUIZ_2', name: 'Quiz 2', targetMax: 4, normalizedMarks: 3.0, rawMarks: 7.5, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_1', name: 'Course Assignment 1', targetMax: 4, normalizedMarks: 3.0, rawMarks: 7.5, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_2', name: 'Course Assignment 2', targetMax: 4, normalizedMarks: 3.0, rawMarks: 7.5, rawMaxMarks: 10, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: true,
                obtained: 37.5,
                max: 50,
                marks: 75,
                rawMarks: 75,
                rawMax: 100
            },
            aggregate: {
                obtained: 76.0,
                max: 100
            },
            grade: {
                letter: 'A',
                gradePoint: 8,
                description: 'Very Good'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE and attendance requirements met'
            }
        },
        {
            code: '21CS44',
            name: 'Microcontrollers and Embedded Systems',
            credits: 3,
            evaluationGroup: 'theory',
            contributesToSGPA: true,
            cie: {
                obtained: 44.0,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'TEST_1', name: 'Internal Assessment Test 1', targetMax: 17, normalizedMarks: 15.5, rawMarks: 27.5, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'TEST_2', name: 'Internal Assessment Test 2', targetMax: 17, normalizedMarks: 15.0, rawMarks: 26.5, rawMaxMarks: 30, status: 'ENTERED' },
                    { key: 'QUIZ_1', name: 'Quiz 1', targetMax: 4, normalizedMarks: 3.25, rawMarks: 8.0, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'QUIZ_2', name: 'Quiz 2', targetMax: 4, normalizedMarks: 3.25, rawMarks: 8.0, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_1', name: 'Course Assignment 1', targetMax: 4, normalizedMarks: 3.5, rawMarks: 8.75, rawMaxMarks: 10, status: 'ENTERED' },
                    { key: 'ASSIGNMENT_2', name: 'Course Assignment 2', targetMax: 4, normalizedMarks: 3.5, rawMarks: 8.75, rawMaxMarks: 10, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: true,
                obtained: 44.5,
                max: 50,
                marks: 89,
                rawMarks: 89,
                rawMax: 100
            },
            aggregate: {
                obtained: 88.5,
                max: 100
            },
            grade: {
                letter: 'A+',
                gradePoint: 9,
                description: 'Excellent'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE and attendance requirements met'
            }
        },
        {
            code: '21CSL46',
            name: 'Design and Analysis of Algorithms Laboratory',
            credits: 1.5,
            evaluationGroup: 'lab',
            contributesToSGPA: true,
            cie: {
                obtained: 47.0,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'LAB_CONDUCTION', name: 'Lab Conduction & Record', targetMax: 35, normalizedMarks: 33.5, rawMarks: 38.5, rawMaxMarks: 40, status: 'ENTERED' },
                    { key: 'LAB_TEST', name: 'Lab Internal Test', targetMax: 15, normalizedMarks: 13.5, rawMarks: 18.0, rawMaxMarks: 20, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: true,
                obtained: 46.0,
                max: 50,
                marks: 92,
                rawMarks: 92,
                rawMax: 100
            },
            aggregate: {
                obtained: 93.0,
                max: 100
            },
            grade: {
                letter: 'O',
                gradePoint: 10,
                description: 'Outstanding'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE and attendance requirements met'
            }
        },
        {
            code: '21CIP47',
            name: 'Constitution of India and Professional Ethics',
            credits: 1,
            evaluationGroup: 'ncmc',
            contributesToSGPA: false,
            cie: {
                obtained: 42.0,
                max: 50,
                status: 'COMPLETE',
                components: [
                    { key: 'TEST_1', name: 'Internal Assessment Test 1', targetMax: 25, normalizedMarks: 21.0, rawMarks: 21, rawMaxMarks: 25, status: 'ENTERED' },
                    { key: 'TEST_2', name: 'Internal Assessment Test 2', targetMax: 25, normalizedMarks: 21.0, rawMarks: 21, rawMaxMarks: 25, status: 'ENTERED' }
                ]
            },
            see: {
                enabled: false,
                obtained: null,
                max: 0
            },
            aggregate: {
                obtained: 84.0,
                max: 100
            },
            grade: {
                letter: 'PP',
                gradePoint: 0,
                description: 'Passed'
            },
            eligibility: {
                eligible: true,
                status: 'ELIGIBLE',
                reason: 'CIE requirements met'
            }
        }
    ]
};

/**
 * Distinguishes between entered marks, partially entered marks, and unentered data.
 */
function getCieState(sub) {
    const comps = sub.cie?.components || sub.components?.filter(c => 
        c.type !== 'THEORY_EXAM' && c.type !== 'PRACTICAL_EXAM' && !c.key?.includes('SEE')
    ) || [];

    if (comps.length === 0) {
        if (typeof sub.cie?.obtained === 'number' && sub.cie.obtained > 0) {
            return { status: 'COMPLETE', score: sub.cie.obtained, max: sub.cie?.max || 50, comps: [] };
        }
        return { status: 'NOT_ENTERED', score: null, max: sub.cie?.max || 50, comps: [] };
    }

    const enteredComps = comps.filter(c => 
        c.status === 'ENTERED' || c.status === 'ZERO' || c.status === 'ABSENT' ||
        (c.rawMarks !== null && c.rawMarks !== undefined && c.status !== 'NOT_ENTERED')
    );

    const totalCount = comps.length;
    const enteredCount = enteredComps.length;

    if (enteredCount === 0) {
        return { status: 'NOT_ENTERED', score: null, max: sub.cie?.max || 50, comps, enteredCount, totalCount };
    }
    if (enteredCount < totalCount) {
        return { status: 'PARTIAL', score: sub.cie?.obtained ?? 0, max: sub.cie?.max || 50, comps, enteredCount, totalCount };
    }
    return { status: 'COMPLETE', score: sub.cie?.obtained ?? 0, max: sub.cie?.max || 50, comps, enteredCount, totalCount };
}

function getSeeState(sub) {
    const isNcmc = sub.credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc');
    if (!sub.see?.enabled || isNcmc) {
        return { status: 'NOT_APPLICABLE', rawMarks: null, rawMax: null, scaledScore: null, max: 0 };
    }

    const seeComp = sub.components?.find(c => 
        c.type === 'THEORY_EXAM' || c.type === 'PRACTICAL_EXAM' || c.key?.includes('SEE')
    );

    const rawMax = seeComp?.rawMaxMarks || sub.see?.rawMax || (
        sub.evaluationGroup?.toLowerCase().includes('theory') || sub.evaluationGroup?.toLowerCase().includes('ipcc') ? 100 : 50
    );

    const isEntered = seeComp 
        ? (seeComp.status === 'ENTERED' || seeComp.status === 'ZERO' || (typeof seeComp.rawMarks === 'number' && seeComp.status !== 'NOT_ENTERED'))
        : (typeof sub.see?.marks === 'number' || typeof sub.see?.obtained === 'number' || typeof sub.see?.rawMarks === 'number');

    if (!isEntered) {
        return { status: 'NOT_ENTERED', rawMarks: null, rawMax, scaledScore: null, max: sub.see?.max || 50 };
    }

    const rawMarks = seeComp ? seeComp.rawMarks : (sub.see?.rawMarks ?? sub.see?.marks ?? null);
    const scaledScore = sub.see?.obtained ?? (typeof sub.see?.marks === 'number' ? (rawMax === 100 ? sub.see.marks / 2 : sub.see.marks) : 0);

    return {
        status: 'ENTERED',
        rawMarks,
        rawMax,
        scaledScore,
        max: sub.see?.max || 50
    };
}

/**
 * Extracts CIE reduced component contributions for the CIE table: TESTS, QUIZZES, ASSIGNMENTS, LABS, LAB TEST.
 * Displays the actual normalized contribution after applying the active evaluation rule: e.g. "27.20 / 34", "6.40 / 8".
 * Unentered marks or non-applicable components display "—".
 */
function extractCieComponents(sub) {
    const comps = sub.cie?.components || sub.components || [];

    const findComp = (matcher) => {
        return comps.find(c => matcher(c.key || '', c.type || '', c.name || ''));
    };

    const testComps = comps.filter(c => 
        (c.key?.includes('TEST') || (c.name && c.name.toLowerCase().includes('test'))) && 
        !c.key?.includes('LAB') && !c.key?.includes('SEE') && c.type !== 'LAB_TEST'
    );
    const quizComps = comps.filter(c => 
        (c.key?.includes('QUIZ') || (c.name && c.name.toLowerCase().includes('quiz'))) && 
        !c.key?.includes('ASSIGNMENT') && !c.key?.includes('SEE')
    );
    const quizAssignComp = findComp((k, t, n) => 
        k.includes('QUIZ_ASSIGNMENT') || k.includes('AEC_QUIZ_ASSIGNMENT') || 
        (n && n.toLowerCase().includes('quiz / assignment'))
    );
    // Support single or multiple assignment components (e.g. CAED Classwork + Experiential Learning)
    const assignComps = comps.filter(c => {
        const k = c.key || '';
        const n = (c.name || '').toLowerCase();
        return (
            k.includes('ASSIGNMENT') || k.includes('CLASSWORK') || k.includes('COURSEWORK') || k.includes('EL') ||
            n.includes('assignment') || n.includes('abl') || n.includes('classwork') || n.includes('sketchbook') || n.includes('experiential')
        ) && !k.includes('QUIZ') && !k.includes('SEE') && !k.includes('TEST');
    });

    const labComp = findComp((k, t, n) => 
        k.includes('LAB_CONDUCTION') || k.includes('LAB_RECORD') || t === 'LAB_RECORD' || 
        (n && n.toLowerCase().includes('conduction')) || (n && n.toLowerCase().includes('record'))
    );
    const labTestComp = findComp((k, t, n) => 
        k.includes('LAB_TEST') || t === 'LAB_TEST' || 
        (n && n.toLowerCase().includes('lab internal test')) || (n && n.toLowerCase().includes('viva'))
    );

    const formatContribution = (comp, defaultTargetMax) => {
        if (!comp) return '—';
        const targetMax = comp.targetMax ?? defaultTargetMax;

        // Missing / unentered marks explicitly display "—"
        if (comp.status === 'NOT_ENTERED' || comp.rawMarks === null || comp.rawMarks === undefined) {
            return '—';
        }
        if (comp.status === 'ABSENT' || comp.isAbsent) {
            return `Ab / ${targetMax}`;
        }

        const score = typeof comp.normalizedMarks === 'number' ? comp.normalizedMarks : (comp.obtained ?? 0);
        return `${Number(score).toFixed(2)} / ${targetMax}`;
    };

    const formatMultiple = (compList, defaultTargetMax) => {
        if (!compList || compList.length === 0) return '—';
        const hasEntered = compList.some(c => c.status !== 'NOT_ENTERED' && c.rawMarks !== null && c.rawMarks !== undefined);
        if (!hasEntered) return '—';
        const targetMax = compList.reduce((sum, c) => sum + (c.targetMax || 0), 0) || defaultTargetMax;
        const totalScore = compList.reduce((sum, c) => sum + (typeof c.normalizedMarks === 'number' ? c.normalizedMarks : (c.obtained ?? 0)), 0);
        return `${Number(totalScore).toFixed(2)} / ${targetMax}`;
    };

    return {
        tests: testComps.length > 1 ? formatMultiple(testComps, 34) : formatContribution(testComps[0], 34),
        quizzes: quizComps.length > 0 
            ? (quizComps.length > 1 ? formatMultiple(quizComps, 8) : formatContribution(quizComps[0], 8))
            : (quizAssignComp ? formatContribution(quizAssignComp, 16) : '—'),
        assignments: assignComps.length > 1 
            ? formatMultiple(assignComps, 8) 
            : formatContribution(assignComps[0], 8),
        labs: formatContribution(labComp, 35),
        labTest: formatContribution(labTestComp, 15)
    };
}

const SemesterResultSheet = ({ initialSemester = null, initialTab = 'cie' }) => {
    const { isDark = true } = useTheme?.() || { isDark: true };
    const { hasPlusAccess, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLockedAction = () => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
        } else {
            navigate('/plus');
        }
    };

    const [selectedSemester, setSelectedSemester] = useState(() => {
        if (initialSemester) return initialSemester;
        return 1;
    });
    const [activeSidebarTab, setActiveSidebarTab] = useState(initialTab || 'cie'); // 'cie' | 'see' | 'overview'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resultData, setResultData] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Drawer state
    const [cieDrawerSubject, setCieDrawerSubject] = useState(null);
    const [seeDrawerSubject, setSeeDrawerSubject] = useState(null);

    const toggleRow = (code) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const cacheRef = useRef({});

    const fetchResults = async (sem, force = false) => {
        if (!hasPlusAccess) {
            setResultData(DUMMY_ACADEMIC_RESULTS);
            setLoading(false);
            return;
        }

        const targetSem = sem || selectedSemester || 1;
        if (!force && cacheRef.current[targetSem]) {
            setResultData(cacheRef.current[targetSem]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await apiV2.getStudentSemesterResults(targetSem);
            const payload = res.data?.data || res.data;
            if (payload && Array.isArray(payload.subjects)) {
                cacheRef.current[targetSem] = payload;
                setResultData(payload);
            } else {
                const emptyPayload = { semester: targetSem, scheme: 'Scheme 2025', subjects: [] };
                cacheRef.current[targetSem] = emptyPayload;
                setResultData(emptyPayload);
            }
        } catch (err) {
            console.error('[SemesterResultSheet] Error fetching results:', err);
            setError(err.response?.data?.message || err.message || 'Unable to load semester results.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasPlusAccess) {
            setResultData(DUMMY_ACADEMIC_RESULTS);
            setLoading(false);
            return;
        }
        fetchResults(selectedSemester);
    }, [selectedSemester, hasPlusAccess]);

    const subjects = resultData?.subjects || [];
    const scheme = resultData?.scheme || 'Scheme 2025';
    const student = resultData?.student || {};
    const currentSemester = student.currentSemester || 1;
    const availableSemesters = resultData?.availableSemesters && resultData.availableSemesters.length > 0
        ? resultData.availableSemesters
        : [1];

    // Canonical summary statistics & live SGPA
    const totalSubjects = subjects.length;
    const totalCreditsAttempted = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

    let passedSubjects = 0;
    let failedSubjects = 0;
    let totalGradePoints = 0;
    let totalSgpaCredits = 0;
    let hasUnevaluatedCreditSubjects = false;

    subjects.forEach((s) => {
        const cr = Number(s.credits) || 0;
        const isNcmc = cr === 0 || s.evaluationGroup?.toLowerCase().includes('ncmc');
        const isEligible = s.eligibility?.eligible !== false;
        const isPassed = isNcmc
            ? s.grade?.letter === 'PP'
            : (s.grade?.letter && s.grade.letter !== 'F' && s.grade.letter !== 'NP' && s.grade.letter !== 'NE');
        
        if (isEligible && isPassed) {
            passedSubjects += 1;
        } else {
            failedSubjects += 1;
        }

        if (!isNcmc && cr > 0 && s.contributesToSGPA !== false) {
            const gp = s.grade?.gradePoint;
            if (typeof gp === 'number') {
                totalGradePoints += gp * cr;
                totalSgpaCredits += cr;
            } else {
                hasUnevaluatedCreditSubjects = true;
            }
        }
    });

    const liveSgpa = (totalSgpaCredits > 0 && !hasUnevaluatedCreditSubjects)
        ? (Math.round((totalGradePoints / totalSgpaCredits + Number.EPSILON) * 100) / 100).toFixed(2)
        : (resultData?.summary?.sgpa ? Number(resultData.summary.sgpa).toFixed(2) : null);

    // Theme Tokens
    const pageBg = isDark ? 'bg-[#07090e] text-slate-100' : 'bg-slate-50 text-slate-900';
    const sidebarBg = isDark ? 'bg-[#0b0e17] border-white/5' : 'bg-white border-slate-200';
    const contentBg = isDark ? 'bg-[#0e121d] border-white/5' : 'bg-white border-slate-200';
    const stripBg = isDark ? 'bg-[#0b0e17] border-white/5' : 'bg-white border-slate-200 shadow-xs';
    const tableHeaderBg = isDark ? 'bg-[#0b0e17] text-slate-400 border-white/5' : 'bg-slate-50 text-slate-600 border-slate-200 font-semibold';
    const borderSubtle = isDark ? 'border-white/5' : 'border-slate-200';

    return (
        <div className={`w-full h-full flex flex-col md:flex-row overflow-hidden ${pageBg} font-sans`}>
            {/* ══════════════════════════════════════════════════════════════════
                1. SECONDARY ACADEMIC SIDEBAR (Desktop Only: ≥ 768px)
            ══════════════════════════════════════════════════════════════════ */}
            <aside className={`hidden md:flex w-[260px] shrink-0 h-full border-r flex-col justify-between p-4 z-10 ${sidebarBg}`}>
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {hasPlusAccess ? `Semester ${selectedSemester}` : 'Semester Result'}
                            </span>
                            {hasPlusAccess && selectedSemester === currentSemester && (
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                                    isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                                }`}>
                                    CURRENT
                                </span>
                            )}
                        </div>
                        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Academic Result
                        </span>
                    </div>

                    {/* Subtle Divider */}
                    <div className={`h-[1px] w-full ${isDark ? 'bg-white/5' : 'bg-slate-200'}`} />

                    {/* Navigation Groups: CIE, SEE, OVERVIEW */}
                    <div className="flex flex-col gap-3">
                        {/* MARKS */}
                        <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                MARKS
                            </span>
                            <SidebarNavButton
                                icon={ClipboardCheck}
                                label="CIE"
                                active={activeSidebarTab === 'cie'}
                                onClick={() => setActiveSidebarTab('cie')}
                                isDark={isDark}
                            />
                            <SidebarNavButton
                                icon={FileText}
                                label="SEE"
                                active={activeSidebarTab === 'see'}
                                onClick={() => setActiveSidebarTab('see')}
                                isDark={isDark}
                            />
                        </div>

                        {/* RESULT */}
                        <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                RESULT
                            </span>
                            <SidebarNavButton
                                icon={LayoutDashboard}
                                label="Overview"
                                active={activeSidebarTab === 'overview'}
                                onClick={() => setActiveSidebarTab('overview')}
                                isDark={isDark}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Semesters (Only displayed for Plus users with personalized semester tracking) */}
                {hasPlusAccess && (
                    <div className={`pt-4 border-t flex flex-col gap-2 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            SEMESTERS
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {availableSemesters.map((sem) => (
                                <button
                                    key={sem}
                                    type="button"
                                    onClick={() => setSelectedSemester(sem)}
                                    className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center ${
                                        selectedSemester === sem
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/30'
                                            : isDark
                                                ? 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                                                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                                    }`}
                                >
                                    {sem}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

            {/* ══════════════════════════════════════════════════════════════════
                1B. MOBILE HEADER & NAVIGATION (< 768px)
            ══════════════════════════════════════════════════════════════════ */}
            <div className={`md:hidden flex flex-col shrink-0 border-b z-10 ${sidebarBg}`}>
                {/* Title & Switcher Row */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                    isDark ? 'border-white/5 bg-[#090d16]/80' : 'border-slate-200 bg-white'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {hasPlusAccess ? `Semester ${selectedSemester}` : 'Semester Result'}
                        </span>
                        {hasPlusAccess && selectedSemester === currentSemester && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                            }`}>
                                CURRENT
                            </span>
                        )}
                        <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            · Result Sheet
                        </span>
                    </div>

                    {/* Semester Switcher Pills (Plus users only) */}
                    {hasPlusAccess && (
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold font-mono uppercase mr-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Sem
                            </span>
                            {availableSemesters.map((sem) => (
                                <button
                                    key={sem}
                                    type="button"
                                    onClick={() => setSelectedSemester(sem)}
                                    className={`w-7 h-7 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center ${
                                        selectedSemester === sem
                                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/40'
                                            : isDark
                                                ? 'bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]'
                                                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                                    }`}
                                >
                                    {sem}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Segmented Tab Controls: CIE, SEE, Overview */}
                <div className={`flex items-center gap-1 p-2 ${isDark ? 'bg-[#0c101a]' : 'bg-slate-100 border-t border-slate-200'}`}>
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('cie')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'cie'
                                ? (isDark ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold' : 'bg-white text-purple-700 border border-purple-300 shadow-xs font-bold')
                                : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent font-medium')
                        }`}
                    >
                        <ClipboardCheck size={13} className={activeSidebarTab === 'cie' ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <span>CIE</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('see')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'see'
                                ? (isDark ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold' : 'bg-white text-purple-700 border border-purple-300 shadow-xs font-bold')
                                : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent font-medium')
                        }`}
                    >
                        <FileText size={13} className={activeSidebarTab === 'see' ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <span>SEE</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('overview')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'overview'
                                ? (isDark ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold' : 'bg-white text-purple-700 border border-purple-300 shadow-xs font-bold')
                                : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent font-medium')
                        }`}
                    >
                        <LayoutDashboard size={13} className={activeSidebarTab === 'overview' ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <span>Overview</span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                2. MAIN WORKSPACE CONTENT
            ══════════════════════════════════════════════════════════════════ */}
            <main className="flex-1 h-full min-w-0 overflow-y-auto p-3.5 sm:p-5 md:p-7 flex flex-col gap-3.5 md:gap-4">
                {/* View Container */}
                {loading ? (
                    <div className={`p-16 rounded-xl border ${contentBg} flex flex-col items-center justify-center gap-2.5 text-slate-400 min-h-[300px]`}>
                        <Loader2 size={24} className="animate-spin text-purple-400" />
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading semester result...</span>
                    </div>
                ) : error ? (
                    <div className={`p-6 rounded-xl border text-center flex flex-col items-center justify-center gap-3 ${
                        isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'
                    }`}>
                        <AlertCircle size={24} className={isDark ? 'text-red-400' : 'text-red-600'} />
                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-red-900'}`}>Unable to load semester result</div>
                        <p className={`text-xs max-w-md ${isDark ? 'text-slate-400' : 'text-red-700'}`}>{error}</p>
                        <button
                            onClick={() => fetchResults(selectedSemester)}
                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className={`p-12 rounded-xl border ${contentBg} text-center flex flex-col items-center justify-center gap-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No subjects registered for Semester {selectedSemester}</span>
                    </div>
                ) : (
                    <>
                        {/* ─────────────────────────────────────────────────────────────
                            PAGE 1: CIE (Where did my internal marks come from?)
                        ───────────────────────────────────────────────────────────── */}
                        {activeSidebarTab === 'cie' && (
                            <div className="flex flex-col gap-3.5 md:gap-4">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2 pb-1">
                                    <div>
                                        <h1 className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            CIE
                                        </h1>
                                        <span className={`text-[11px] sm:text-xs font-mono mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {hasPlusAccess ? `Internal Assessment · ${scheme} · Semester ${selectedSemester}` : `Internal Assessment · ${scheme}`}
                                        </span>
                                    </div>

                                    {hasPlusAccess && (
                                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
                                            isDark ? 'bg-white/[0.03] border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                                        }`}>
                                            <span>Semester {selectedSemester}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className={`flex md:hidden items-center justify-between text-[11px] font-mono -mt-1 px-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    <span className={isDark ? 'text-purple-400/90 font-medium' : 'text-purple-600 font-semibold'}>
                                        ⚡ Tap subject row to view marks
                                    </span>
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>⇄ Swipe table</span>
                                </div>

                                {/* CIE Table */}
                                <CieTableSection 
                                    subjects={subjects}
                                    onSelectSubject={(sub) => !hasPlusAccess ? handleLockedAction() : setCieDrawerSubject(sub)}
                                    isLocked={!hasPlusAccess}
                                    contentBg={contentBg}
                                    tableHeaderBg={tableHeaderBg}
                                    borderSubtle={borderSubtle}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {/* ─────────────────────────────────────────────────────────────
                            PAGE 2: SEE (What SEE marks do I have?)
                        ───────────────────────────────────────────────────────────── */}
                        {activeSidebarTab === 'see' && (
                            <div className="flex flex-col gap-3.5 md:gap-4">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2 pb-1">
                                    <div>
                                        <h1 className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            SEE
                                        </h1>
                                        <span className={`text-[11px] sm:text-xs font-mono mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {hasPlusAccess ? `Semester End Examination · ${scheme} · Semester ${selectedSemester}` : `Semester End Examination · ${scheme}`}
                                        </span>
                                    </div>

                                    {hasPlusAccess && (
                                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
                                            isDark ? 'bg-white/[0.03] border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                                        }`}>
                                            <span>Semester {selectedSemester}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className={`flex md:hidden items-center justify-between text-[11px] font-mono -mt-1 px-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    <span className={isDark ? 'text-purple-400/90 font-medium' : 'text-purple-600 font-semibold'}>
                                        ⚡ Tap subject row to view SEE marks
                                    </span>
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>⇄ Swipe table</span>
                                </div>

                                {/* SEE Table */}
                                <SeeTableSection 
                                    subjects={subjects}
                                    onSelectSubject={(sub) => !hasPlusAccess ? handleLockedAction() : setSeeDrawerSubject(sub)}
                                    isLocked={!hasPlusAccess}
                                    contentBg={contentBg}
                                    tableHeaderBg={tableHeaderBg}
                                    borderSubtle={borderSubtle}
                                    isDark={isDark}
                                />
                            </div>
                        )}

                        {/* ─────────────────────────────────────────────────────────────
                            PAGE 3: OVERVIEW (What is my semester result?)
                        ───────────────────────────────────────────────────────────── */}
                        {activeSidebarTab === 'overview' && (
                            <div className="flex flex-col gap-3.5 md:gap-4">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-2 pb-1">
                                    <div>
                                        <h1 className={`text-lg sm:text-xl md:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Semester Result
                                        </h1>
                                        <span className={`text-[11px] sm:text-xs font-mono mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {hasPlusAccess ? `${scheme} · Semester ${selectedSemester}` : `${scheme} · Result Evaluation Sheet`}
                                        </span>
                                    </div>

                                    {hasPlusAccess && (
                                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono ${
                                            isDark ? 'bg-white/[0.03] border-white/5 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-xs'
                                        }`}>
                                            <span>Semester {selectedSemester}</span>
                                            {selectedSemester === currentSemester && (
                                                <>
                                                    <span>·</span>
                                                    <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Current</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CSES Summary Strip - Responsive Grid on Mobile */}
                                <div className={`rounded-lg border p-3 md:px-4 md:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 font-mono text-xs ${stripBg}`}>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[11px] md:text-xs">
                                        {hasPlusAccess && (
                                            <>
                                                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>SEM {selectedSemester}</span>
                                                <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                            </>
                                        )}
                                        <span className={`uppercase font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{scheme}</span>
                                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                        <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{totalSubjects} SUBJECTS</span>
                                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                        <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{passedSubjects} PASSED</span>
                                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                        <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>{failedSubjects} FAIL/NE</span>
                                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                        <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{totalCreditsAttempted} CREDITS</span>
                                        {liveSgpa && (
                                            <>
                                                <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                                <span className={`font-black px-2 py-0.5 rounded text-[11px] font-mono tracking-tight ${
                                                    isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-100 text-purple-800 border border-purple-200'
                                                }`}>
                                                    SGPA: {liveSgpa}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    <div className={`self-start sm:self-auto flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        liveSgpa
                                            ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                                            : (isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200')
                                    }`}>
                                        <CheckCircle2 size={11} />
                                        {liveSgpa ? 'Result Evaluated' : 'Evaluation in Progress'}
                                    </div>
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className={`flex md:hidden items-center justify-between text-[11px] font-mono -mt-1 px-0.5 ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    <span className={isDark ? 'text-purple-400/90 font-medium' : 'text-purple-600 font-semibold'}>⚡ Tap subject row to view breakdown</span>
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>⇄ Swipe table</span>
                                </div>

                                {/* Result Table */}
                                <OverviewTableSection 
                                    subjects={subjects}
                                    expandedRows={expandedRows}
                                    toggleRow={toggleRow}
                                    contentBg={contentBg}
                                    tableHeaderBg={tableHeaderBg}
                                    borderSubtle={borderSubtle}
                                    isDark={isDark}
                                    isLocked={!hasPlusAccess}
                                    onLockedClick={handleLockedAction}
                                />
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ══════════════════════════════════════════════════════════════════
                3. DRAWERS FOR RAW MARKS ENTRY
            ══════════════════════════════════════════════════════════════════ */}
            {cieDrawerSubject && (
                <CieMarksDrawer 
                    subject={cieDrawerSubject}
                    semester={selectedSemester}
                    onClose={() => setCieDrawerSubject(null)}
                    isDark={isDark}
                    onSaveSuccess={(savedData) => {
                        setCieDrawerSubject(null);
                        if (savedData) {
                            setResultData(prev => {
                                if (!prev || !Array.isArray(prev.subjects)) return prev;
                                return {
                                    ...prev,
                                    subjects: prev.subjects.map(s => {
                                        const isMatch = String(s.registeredSubjectId) === String(savedData.registeredSubjectId) ||
                                            s.code === savedData.subjectCode ||
                                            String(s.subjectId) === String(savedData.subjectId);
                                        if (!isMatch) return s;
                                        return {
                                            ...s,
                                            rawMarks: savedData.rawMarks || s.rawMarks,
                                            cie: {
                                                ...s.cie,
                                                obtained: savedData.totalCie ?? s.cie?.obtained,
                                                total: savedData.totalCie ?? s.cie?.total
                                            }
                                        };
                                    })
                                };
                            });
                        }
                        cacheRef.current = {};
                        fetchResults(selectedSemester, true);
                    }}
                />
            )}

            {seeDrawerSubject && (
                <SeeMarksDrawer 
                    subject={seeDrawerSubject}
                    semester={selectedSemester}
                    onClose={() => setSeeDrawerSubject(null)}
                    isDark={isDark}
                    onSaveSuccess={() => {
                        setSeeDrawerSubject(null);
                        cacheRef.current = {};
                        fetchResults(selectedSemester, true);
                    }}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════════
   SIDEBAR BUTTON COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
function SidebarNavButton({ icon: Icon, label, active, onClick, isDark }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                active
                    ? (isDark 
                        ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30' 
                        : 'bg-purple-50 text-purple-700 border border-purple-200 font-bold shadow-xs')
                    : (isDark 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent')
            }`}
        >
            <Icon size={14} className={active ? (isDark ? 'text-purple-400' : 'text-purple-600') : (isDark ? 'text-slate-400' : 'text-slate-500')} />
            <span>{label}</span>
        </button>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE 1: OVERVIEW TABLE (What is my semester result?)
══════════════════════════════════════════════════════════════════════════════ */
function OverviewTableSection({ subjects, expandedRows, toggleRow, contentBg, tableHeaderBg, borderSubtle, isDark, isLocked = false, onLockedClick }) {
    return (
        <div className={`overflow-hidden rounded-lg border ${contentBg}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono min-w-[650px]">
                    <thead>
                        <tr className={`border-b ${tableHeaderBg} text-[10px] font-bold uppercase tracking-wider`}>
                            <th className="py-2 px-3 text-center w-10">#</th>
                            <th className="py-2 px-3 font-sans">SUBJECT</th>
                            <th className="py-2 px-2 text-center">CREDITS</th>
                            <th className="py-2 px-3 text-center">CIE</th>
                            <th className="py-2 px-3 text-center">SEE</th>
                            <th className="py-2 px-3 text-center">TOTAL</th>
                            <th className="py-2 px-3 text-center">GRADE</th>
                            <th className="py-2 px-2 text-center">GP</th>
                            <th className="py-2 px-3 text-center">STATUS</th>
                            <th className="py-2 px-2 text-center w-8"></th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${borderSubtle}`}>
                        {subjects.map((sub, idx) => {
                            const code = sub.code || sub.subjectCode;
                            const isNcmc = sub.credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc');
                            const isExpanded = expandedRows.has(code);

                            const cie = getCieState(sub);
                            const see = getSeeState(sub);

                            const isEligible = sub.eligibility?.eligible !== false;
                            const isPassed = isNcmc
                                ? sub.grade?.letter === 'PP'
                                : (sub.grade?.letter && sub.grade.letter !== 'F' && sub.grade.letter !== 'NP' && sub.grade.letter !== 'NE');

                            // Clean short evaluation group name
                            const cleanGroupName = (sub.evaluationGroup || sub.pattern || '')
                                .replace(/Evaluation Rule \(v\d+\)/i, '')
                                .replace(/\(v\d+\)/i, '')
                                .trim();

                            return (
                                <React.Fragment key={code || idx}>
                                    <tr 
                                        onClick={() => toggleRow(code)}
                                        className={`cursor-pointer transition-colors ${
                                            isExpanded 
                                                ? (isDark ? 'bg-purple-950/20' : 'bg-purple-50/70') 
                                                : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                                        }`}
                                    >
                                        {/* # */}
                                        <td className={`py-2 px-3 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>

                                        {/* Subject */}
                                        <td className="py-2 px-3 font-sans">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                                                        {sub.name || sub.subjectName}
                                                    </span>
                                                    {isLocked && (
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onLockedClick?.();
                                                            }}
                                                            title="Unlock with Plus"
                                                            className="cursor-pointer inline-flex items-center"
                                                        >
                                                            <Lock size={11} className="text-slate-400 opacity-60 shrink-0" />
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{code}</span>
                                                    {' · '}
                                                    <span>{cleanGroupName}</span>
                                                </span>
                                            </div>
                                        </td>

                                        {/* Credits */}
                                        <td className={`py-2 px-2 text-center font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {isNcmc ? '0' : sub.credits}
                                        </td>

                                        {/* CIE */}
                                        <td className="py-2 px-3 text-center font-bold">
                                            {cie.status === 'NOT_ENTERED' ? (
                                                <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                            ) : (
                                                <span className={isDark ? 'text-cyan-400' : 'text-sky-700 font-bold'}>{cie.score} / {cie.max}</span>
                                            )}
                                        </td>

                                        {/* SEE */}
                                        <td className="py-2 px-3 text-center font-bold">
                                            {!sub.see?.enabled || isNcmc ? (
                                                <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>N/A</span>
                                            ) : see.status === 'NOT_ENTERED' ? (
                                                <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                            ) : (
                                                <span className={isDark ? 'text-indigo-300' : 'text-indigo-700 font-bold'}>{see.scaledScore} / {see.max}</span>
                                            )}
                                        </td>

                                        {/* TOTAL */}
                                        <td className="py-2 px-3 text-center font-black">
                                            {cie.status === 'NOT_ENTERED' || (!isNcmc && see.status === 'NOT_ENTERED') ? (
                                                <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                            ) : (
                                                <span className={isDark ? 'text-slate-100 font-black' : 'text-slate-900 font-black'}>
                                                    {typeof sub.aggregate?.obtained === 'number'
                                                        ? sub.aggregate.obtained
                                                        : (typeof cie.score === 'number' && typeof see.scaledScore === 'number' 
                                                            ? Math.round((cie.score + see.scaledScore) * 10) / 10 
                                                            : (cie.score ?? 0))} / {sub.aggregate?.max || (isNcmc ? (cie.max || 50) : 100)}
                                                </span>
                                            )}
                                        </td>

                                        {/* GRADE */}
                                        <td className="py-2 px-3 text-center">
                                            <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                                                sub.grade?.letter === 'F' || sub.grade?.letter === 'NP' || sub.grade?.letter === 'NE'
                                                    ? (isDark ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200 font-bold')
                                                    : (isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold')
                                            }`}>
                                                {sub.grade?.letter || '—'}
                                            </span>
                                        </td>

                                        {/* GP */}
                                        <td className={`py-2 px-2 text-center font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                            {sub.grade?.gradePoint ?? 0}
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-2 px-3 text-center">
                                            {!isEligible ? (
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                    isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    NOT ELIGIBLE
                                                </span>
                                            ) : !isPassed ? (
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                    isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    FAIL
                                                </span>
                                            ) : (
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                    isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                }`}>
                                                    PASS
                                                </span>
                                            )}
                                        </td>

                                        {/* Chevron */}
                                        <td className={`py-2 px-2 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </td>
                                    </tr>

                                    {/* Inline Row Expansion */}
                                    {isExpanded && (
                                        <tr className={isDark ? 'bg-black/30' : 'bg-slate-50/70'}>
                                            <td colSpan={10} className="p-3.5">
                                                <InlineDetails sub={sub} isNcmc={isNcmc} cie={cie} see={see} isDark={isDark} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE 2: CIE TABLE (Where did my internal marks come from?)
   Columns: # | SUBJECT | TESTS | QUIZZES | ASSIGNMENTS | LABS | LAB TEST | CIE | STATUS
   Clicking a row opens the CIE marks drawer!
══════════════════════════════════════════════════════════════════════════════ */
function CieTableSection({ subjects, onSelectSubject, contentBg, tableHeaderBg, borderSubtle, isDark, isLocked = false }) {
    return (
        <div className={`overflow-hidden rounded-lg border ${contentBg}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono min-w-[650px]">
                    <thead>
                        <tr className={`border-b ${tableHeaderBg} text-[10px] font-bold uppercase tracking-wider`}>
                            <th className="py-2 px-3 text-center w-10">#</th>
                            <th className="py-2 px-3 font-sans">SUBJECT</th>
                            <th className="py-2 px-3 text-right">TESTS</th>
                            <th className="py-2 px-3 text-right">QUIZZES</th>
                            <th className="py-2 px-3 text-right">ASSIGNMENTS</th>
                            <th className="py-2 px-3 text-right">LABS</th>
                            <th className="py-2 px-3 text-right">LAB TEST</th>
                            <th className="py-2 px-3 text-right">CIE</th>
                            <th className="py-2 px-3 text-center">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${borderSubtle}`}>
                        {subjects.map((sub, idx) => {
                            const code = sub.code || sub.subjectCode;
                            const cie = getCieState(sub);
                            const parts = extractCieComponents(sub);

                            const cleanGroupName = (sub.evaluationGroup || sub.pattern || '')
                                .replace(/Evaluation Rule \(v\d+\)/i, '')
                                .replace(/\(v\d+\)/i, '')
                                .trim();

                            return (
                                <tr 
                                    key={code || idx} 
                                    onClick={() => onSelectSubject(sub)}
                                    className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} transition-colors group`}
                                    title={isLocked ? "Unlock with Plus to edit marks" : "Click to enter/edit marks"}
                                >
                                    <td className={`py-2.5 px-3 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-2.5 px-3 font-sans">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-xs transition-colors ${
                                                    isDark ? 'text-slate-200 group-hover:text-purple-300' : 'text-slate-900 group-hover:text-purple-700'
                                                }`}>
                                                    {sub.name || sub.subjectName}
                                                </span>
                                                {isLocked ? (
                                                    <Lock size={11} className="text-slate-400 opacity-60" />
                                                ) : (
                                                    <Edit3 size={11} className={`${
                                                        isDark ? 'text-slate-600 group-hover:text-purple-400' : 'text-slate-400 group-hover:text-purple-600'
                                                    } opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{code}</span>
                                                {' · '}
                                                <span>{cleanGroupName}</span>
                                            </span>
                                        </div>
                                    </td>

                                    {/* TESTS */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {parts.tests !== '—' ? (
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{parts.tests}</span>
                                        ) : (
                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                        )}
                                    </td>

                                    {/* QUIZZES */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {parts.quizzes !== '—' ? (
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{parts.quizzes}</span>
                                        ) : (
                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                        )}
                                    </td>

                                    {/* ASSIGNMENTS */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {parts.assignments !== '—' ? (
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{parts.assignments}</span>
                                        ) : (
                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                        )}
                                    </td>

                                    {/* LABS */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {parts.labs !== '—' ? (
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{parts.labs}</span>
                                        ) : (
                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                        )}
                                    </td>

                                    {/* LAB TEST */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {parts.labTest !== '—' ? (
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{parts.labTest}</span>
                                        ) : (
                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                        )}
                                    </td>

                                    {/* CIE TOTAL */}
                                    <td className={`py-2.5 px-3 text-right font-bold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>
                                        {cie.status === 'NOT_ENTERED' ? (
                                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                        ) : (
                                            <span>{Number(cie.score).toFixed(2)} / {cie.max}</span>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-2.5 px-3 text-center">
                                        {cie.status === 'NOT_ENTERED' ? (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                NOT ENTERED
                                            </span>
                                        ) : cie.status === 'PARTIAL' ? (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}>
                                                PARTIAL
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                COMPLETE
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE 3: SEE TABLE (What SEE marks do I have?)
   Clicking a row opens the SEE marks drawer!
══════════════════════════════════════════════════════════════════════════════ */
function SeeTableSection({ subjects, onSelectSubject, isLocked = false, contentBg, tableHeaderBg, borderSubtle, isDark }) {
    return (
        <div className={`overflow-hidden rounded-lg border ${contentBg}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono min-w-[480px]">
                    <thead>
                        <tr className={`border-b ${tableHeaderBg} text-[10px] font-bold uppercase tracking-wider`}>
                            <th className="py-2 px-3 text-center w-10">#</th>
                            <th className="py-2 px-3 font-sans">SUBJECT</th>
                            <th className="py-2 px-3 text-right">SEE MARKS</th>
                            <th className="py-2 px-3 text-right">MAXIMUM</th>
                            <th className="py-2 px-3 text-center">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${borderSubtle}`}>
                        {subjects.map((sub, idx) => {
                            const code = sub.code || sub.subjectCode;
                            const isNcmc = sub.credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc');
                            const see = getSeeState(sub);

                            const cleanGroupName = (sub.evaluationGroup || sub.pattern || '')
                                .replace(/Evaluation Rule \(v\d+\)/i, '')
                                .replace(/\(v\d+\)/i, '')
                                .trim();

                            return (
                                <tr 
                                    key={code || idx} 
                                    onClick={() => onSelectSubject(sub)}
                                    className={`${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'} ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} transition-colors group`}
                                    title={isNcmc ? 'SEE not applicable for NCMC' : isLocked ? 'Unlock with Plus to enter/edit SEE marks' : 'Click to enter/edit SEE marks'}
                                >
                                    <td className={`py-2.5 px-3 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-2.5 px-3 font-sans">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-xs transition-colors ${
                                                    isDark ? 'text-slate-200 group-hover:text-purple-300' : 'text-slate-900 group-hover:text-purple-700'
                                                }`}>
                                                    {sub.name || sub.subjectName}
                                                </span>
                                                {!isNcmc && sub.see?.enabled && (
                                                    isLocked ? (
                                                        <Lock size={11} className="text-slate-400 opacity-60" />
                                                    ) : (
                                                        <Edit3 size={11} className={`${
                                                            isDark ? 'text-slate-600 group-hover:text-purple-400' : 'text-slate-400 group-hover:text-purple-600'
                                                        } opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                    )
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{code}</span>
                                                {' · '}
                                                <span>{cleanGroupName}</span>
                                            </span>
                                        </div>
                                    </td>

                                    {/* SEE MARKS */}
                                    <td className={`py-2.5 px-3 text-right font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                        ) : see.status === 'NOT_ENTERED' ? (
                                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>
                                        ) : (
                                            <span>{see.rawMarks !== null ? see.rawMarks : see.scaledScore}</span>
                                        )}
                                    </td>

                                    {/* MAXIMUM (Rule-driven) */}
                                    <td className={`py-2.5 px-3 text-right font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className={`italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Disabled / Not Applicable</span>
                                        ) : (
                                            <span>/{see.rawMax || 100}</span>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-2.5 px-3 text-center">
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                Not Applicable
                                            </span>
                                        ) : see.status === 'NOT_ENTERED' ? (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                Not Entered
                                            </span>
                                        ) : (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                                isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            }`}>
                                                Entered
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   INLINE DETAILS EXPANSION FOR OVERVIEW TABLE
══════════════════════════════════════════════════════════════════════════════ */
function InlineDetails({ sub, isNcmc, cie, see, isDark }) {
    const isIpcc = sub.evaluationGroup?.toLowerCase().includes('ipcc') || sub.partitions?.length > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Left: Components */}
            <div className={`flex flex-col gap-2 p-3 rounded border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-xs'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Component Evaluation
                </span>
                <div className="flex flex-col gap-1.5">
                    {sub.components?.filter(c => !c.key?.includes('SEE')).map((c) => (
                        <div key={c.key} className={`flex items-center justify-between py-0.5 border-b ${isDark ? 'border-white/[0.03]' : 'border-slate-100'}`}>
                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{c.name || c.key}</span>
                            <span className="font-bold">
                                {c.status === 'NOT_ENTERED' || c.rawMarks === null ? (
                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                ) : (
                                    <span className={isDark ? 'text-cyan-400' : 'text-sky-700 font-bold'}>
                                        {c.rawMarks} / {c.rawMaxMarks}
                                        {c.normalizedMarks !== null && c.normalizedMarks !== c.rawMarks && (
                                            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-[10px] ml-1`}>
                                                (→ {c.normalizedMarks})
                                            </span>
                                        )}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Partitions & Diagnostics */}
            <div className={`flex flex-col gap-2 p-3 rounded border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200 shadow-xs'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Eligibility &amp; Partitions
                </span>

                {isIpcc && sub.partitions && sub.partitions.length > 0 && (
                    <div className={`flex flex-col gap-1 pb-2 border-b ${isDark ? 'border-white/[0.03]' : 'border-slate-100'}`}>
                        {sub.partitions.map((p) => (
                            <div key={p.key} className="flex items-center justify-between">
                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{p.name || p.key} Partition:</span>
                                <span className={p.passed ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : (isDark ? 'text-red-400 font-bold' : 'text-red-700 font-bold')}>
                                    {p.score} / {p.max} {p.minRequired ? `(Min ${p.minRequired} req)` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Eligibility Status:</span>
                    <span className={sub.eligibility?.eligible !== false ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : (isDark ? 'text-red-400 font-bold' : 'text-red-700 font-bold')}>
                        {sub.eligibility?.eligible !== false ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                </div>

                {sub.eligibility?.reasons && sub.eligibility.reasons.length > 0 && (
                    <div className={`mt-1 p-2 rounded border text-[11px] ${
                        isDark ? 'bg-red-950/30 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {sub.eligibility.reasons.map((r, i) => (
                            <div key={i}>• {r}</div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>SEE Scaled:</span>
                    <span className={`font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                        {isNcmc ? 'N/A' : (see.status === 'NOT_ENTERED' ? '—' : `${see.scaledScore} / ${see.max}`)}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DRAWER 1: CIE RAW MARKS ENTRY DRAWER
   Allows student to input Test 1, Test 2, Quiz 1, Quiz 2, Assignments, Labs etc.
   Displays exact entered raw marks AND active Scheme 2025 reduced contributions.
══════════════════════════════════════════════════════════════════════════════ */
function calcReduced(val, rawMax, reducedMax) {
    if (val === '' || val === null || val === undefined || isNaN(Number(val))) {
        return null;
    }
    const num = Math.max(0, Math.min(rawMax, Number(val)));
    return Math.round(((num / rawMax) * reducedMax) * 100) / 100;
}

function CieDrawerRow({ label, rawValue, rawMax, reducedMax, onChange, disabled = false, helperText = null, isDark = true }) {
    const isInvalid = rawValue !== '' && rawValue !== null && rawValue !== undefined && !isNaN(Number(rawValue)) && (Number(rawValue) < 0 || Number(rawValue) > rawMax);
    const reduced = isInvalid ? null : calcReduced(rawValue, rawMax, reducedMax);
    const hasValue = reduced !== null;

    return (
        <div className={`flex flex-col py-2 border-b last:border-0 ${isDark ? 'border-white/[0.04]' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-2">
                {/* Component Label */}
                <span className={`w-32 sm:w-36 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {label}
                </span>

                {/* Editable Raw Input: [ raw ] / rawMax */}
                <div className="flex-1 flex items-center justify-center gap-1.5">
                    <input
                        type="number"
                        min="0"
                        max={rawMax}
                        step="any"
                        placeholder="—"
                        value={rawValue}
                        disabled={disabled}
                        onChange={e => onChange(e.target.value)}
                        className={`w-16 rounded px-2 py-1 text-xs text-right font-mono focus:outline-none transition-colors border ${
                            isInvalid 
                                ? 'border-red-500 text-red-600 bg-red-50' 
                                : isDark 
                                    ? 'bg-black/50 border-white/10 focus:border-purple-500 text-white' 
                                    : 'bg-white border-slate-300 focus:border-purple-600 text-slate-900 shadow-xs'
                        }`}
                    />
                    <span className={`text-xs font-mono w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {rawMax}</span>
                </div>

                {/* Arrow */}
                <span className={`w-5 font-mono text-center text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>→</span>

                {/* Calculated Reduced Contribution: reduced / reducedMax (READ-ONLY) */}
                <div className="w-24 text-right font-mono text-xs pr-1">
                    {isInvalid ? (
                        <span className="text-red-500 font-bold text-[10px]">
                            Max {rawMax}
                        </span>
                    ) : hasValue ? (
                        <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>
                            {reduced.toFixed(2)}{' '}
                            <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ {reducedMax}</span>
                        </span>
                    ) : (
                        <span className={`font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            —{' '}
                            <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/ {reducedMax}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Inline Helper Text if provided */}
            {helperText && (
                <span className={`text-[10px] italic mt-1 font-sans pl-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {helperText}
                </span>
            )}
        </div>
    );
}

function resolveSubjectCieComponents(subject) {
    if (subject.cie?.components && subject.cie.components.length > 0) {
        return subject.cie.components;
    }
    const evalGroup = (subject.evaluationGroup || subject.pattern || '').toLowerCase();
    const isNcmc = subject.credits === 0 || evalGroup.includes('ncmc');
    const isIpcc = evalGroup.includes('ipcc');
    const isLab = evalGroup.includes('lab') && !isIpcc;
    const isAec = evalGroup.includes('aec');
    const isCaed = evalGroup.includes('caed') || evalGroup.includes('drawing');
    const isSdc = evalGroup.includes('sdc') || evalGroup.includes('project');

    if (isNcmc) {
        return [
            { key: 'NCMC_CIE', name: 'Continuous Internal Evaluation', entryCount: 1, entryMaxRaw: 100, entryMaxReduced: 100, targetMax: 100, type: 'ASSESSMENT' }
        ];
    }
    if (isIpcc) {
        return [
            { key: 'IPCC_THEORY_TEST', name: 'Theory: Internal Tests', entryCount: 2, entryMaxRaw: 50, entryMaxReduced: 8.5, targetMax: 17, type: 'ASSESSMENT' },
            { key: 'IPCC_THEORY_QUIZ', name: 'Theory: Quizzes', entryCount: 2, entryMaxRaw: 20, entryMaxReduced: 2, targetMax: 4, type: 'ASSESSMENT' },
            { key: 'IPCC_THEORY_ASSIGNMENT', name: 'Theory: Assignments / ABL', entryCount: 2, entryMaxRaw: 20, entryMaxReduced: 2, targetMax: 4, type: 'ASSESSMENT' },
            { key: 'IPCC_LAB_CONDUCTION', name: 'Practical: Lab Conduction & Record', entryCount: 1, entryMaxRaw: 350, entryMaxReduced: 15, targetMax: 15, type: 'LAB_RECORD' },
            { key: 'IPCC_LAB_TEST', name: 'Practical: Lab Internal Test', entryCount: 1, entryMaxRaw: 15, entryMaxReduced: 10, targetMax: 10, type: 'LAB_TEST' }
        ];
    }
    if (isAec) {
        return [
            { key: 'AEC_TEST', name: 'Internal Assessment Tests', entryCount: 2, entryMaxRaw: 50, entryMaxReduced: 17, targetMax: 34, type: 'ASSESSMENT' },
            { key: 'AEC_QUIZ_ASSIGNMENT', name: 'Quiz / Assignment', entryCount: 1, entryMaxRaw: 20, entryMaxReduced: 16, targetMax: 16, type: 'ASSESSMENT' }
        ];
    }
    if (isLab) {
        return [
            { key: 'LAB_CONDUCTION', name: 'Continuous Lab Conduction & Record', entryCount: 1, entryMaxRaw: 35, entryMaxReduced: 35, targetMax: 35, type: 'LAB_RECORD' },
            { key: 'LAB_TEST', name: 'Lab Internal Test & Viva Voce', entryCount: 1, entryMaxRaw: 15, entryMaxReduced: 15, targetMax: 15, type: 'LAB_TEST' }
        ];
    }
    if (isSdc) {
        return [
            { key: 'PHASE_1', name: 'Phase I Review', entryCount: 1, entryMaxRaw: 20, entryMaxReduced: 20, targetMax: 20, type: 'PROJECT' },
            { key: 'PHASE_2', name: 'Phase II Prototype', entryCount: 1, entryMaxRaw: 20, entryMaxReduced: 20, targetMax: 20, type: 'PROJECT' },
            { key: 'REPORT', name: 'Technical Report', entryCount: 1, entryMaxRaw: 10, entryMaxReduced: 10, targetMax: 10, type: 'PROJECT' }
        ];
    }
    if (isCaed) {
        return [
            { key: 'CAED_CLASSWORK', name: 'Classwork: Sketchbook & CAD Printouts', entryCount: 1, entryMaxRaw: 80, entryMaxReduced: 20, targetMax: 20, type: 'ASSESSMENT' },
            { key: 'CAED_EL', name: 'Experiential Learning', entryCount: 1, entryMaxRaw: 20, entryMaxReduced: 10, targetMax: 10, type: 'ASSESSMENT' },
            { key: 'CAED_TESTS', name: 'CAD & Manual Tests', entryCount: 2, entryMaxRaw: 50, entryMaxReduced: 10, targetMax: 20, type: 'ASSESSMENT' }
        ];
    }
    // Standard Theory
    return [
        { key: 'THEORY_TEST', name: 'Tests', entryCount: 2, entryMaxRaw: 50, entryMaxReduced: 17, targetMax: 34, type: 'ASSESSMENT' },
        { key: 'THEORY_QUIZ', name: 'Quizzes', entryCount: 2, entryMaxRaw: 20, entryMaxReduced: 4, targetMax: 8, type: 'ASSESSMENT' },
        { key: 'THEORY_ASSIGNMENT', name: 'Assignments / ABL', entryCount: 2, entryMaxRaw: 20, entryMaxReduced: 4, targetMax: 8, type: 'ASSESSMENT' }
    ];
}

function getComponentKeyMapping(compKey, index = 0) {
    const k = compKey || '';
    if (k.includes('THEORY_TEST') || k.includes('AEC_TEST') || k.includes('CAED_TEST') || k === 'TESTS') {
        return index === 0 ? 'test1' : 'test2';
    }
    if (k.includes('QUIZ_ASSIGNMENT') || k.includes('AEC_QUIZ')) {
        return 'quiz1';
    }
    if (k.includes('QUIZ')) {
        return index === 0 ? 'quiz1' : 'quiz2';
    }
    if (k.includes('ASSIGNMENT')) {
        return index === 0 ? 'assignment1' : 'assignment2';
    }
    if (k.includes('CAED_CLASSWORK') || k.includes('CAED_COURSEWORK')) {
        return 'assignment1';
    }
    if (k.includes('CAED_EL') || k.includes('CAED_EXPERIENTIAL')) {
        return 'assignment2';
    }
    if (k.includes('LAB_CONDUCTION') || k.includes('LAB_RECORD')) {
        return 'labRecord';
    }
    if (k.includes('LAB_TEST') || k.includes('VIVA')) {
        return 'labTest';
    }
    if (k.includes('NCMC') || k.includes('COMPLETION')) {
        return 'cie';
    }
    return compKey + (index > 0 ? `_${index + 1}` : '');
}

function CieMarksDrawer({ subject, semester, onClose, onSaveSuccess, isDark }) {
    const evalGroup = (subject.evaluationGroup || subject.pattern || '').toLowerCase();
    const isNcmc = subject.credits === 0 || evalGroup.includes('ncmc');
    const isIpcc = evalGroup.includes('ipcc') || subject.partitions?.length > 0;
    const comps = resolveSubjectCieComponents(subject);

    // Initial state setup mapping both canonical and dynamic keys
    const initialRaw = subject.rawMarks || {};
    const [marks, setMarks] = useState(() => {
        const state = {
            test1: initialRaw.test1 !== null && initialRaw.test1 !== undefined ? initialRaw.test1 : '',
            test2: initialRaw.test2 !== null && initialRaw.test2 !== undefined ? initialRaw.test2 : '',
            quiz1: initialRaw.quiz1 !== null && initialRaw.quiz1 !== undefined ? initialRaw.quiz1 : '',
            quiz2: initialRaw.quiz2 !== null && initialRaw.quiz2 !== undefined ? initialRaw.quiz2 : '',
            assignment1: initialRaw.assignment1 !== null && initialRaw.assignment1 !== undefined ? initialRaw.assignment1 : '',
            assignment2: initialRaw.assignment2 !== null && initialRaw.assignment2 !== undefined ? initialRaw.assignment2 : '',
            labRecord: initialRaw.labRecord !== null && initialRaw.labRecord !== undefined ? initialRaw.labRecord : '',
            labTest: initialRaw.labTest !== null && initialRaw.labTest !== undefined ? initialRaw.labTest : '',
            cie: initialRaw.cie !== null && initialRaw.cie !== undefined ? initialRaw.cie : ''
        };
        // Populate any dynamic rule components (e.g. PHASE_1, PHASE_2, REPORT, SDC, etc.)
        comps.forEach(c => {
            const mapKey = getComponentKeyMapping(c.key, 0);
            if (initialRaw[c.key] !== undefined && initialRaw[c.key] !== null) {
                state[c.key] = initialRaw[c.key];
            } else if (state[mapKey] === '' && c.rawMarks !== null && c.rawMarks !== undefined) {
                state[mapKey] = c.rawMarks;
            }
        });
        return state;
    });

    const [saving, setSaving] = useState(false);

    // ──────────────────────────────────────────────────────────────────────────
    // Interactive Helper: Lab Sub-Activity Auto-Calculator
    // E.g. IDTE 1 (9/10) + IDTE 2 (14/15) + IDTE 3 (24/25) -> 47 / 50
    // ──────────────────────────────────────────────────────────────────────────
    const [showLabCalculator, setShowLabCalculator] = useState(false);
    const [labActivities, setLabActivities] = useState([
        { id: 1, name: 'Activity 1 (e.g. IDTE 1)', score: '', max: 10 },
        { id: 2, name: 'Activity 2 (e.g. IDTE 2)', score: '', max: 15 },
        { id: 3, name: 'Activity 3 (e.g. IDTE 3)', score: '', max: 25 }
    ]);

    const labActivityTotalScore = labActivities.reduce((sum, a) => {
        const val = Number(a.score);
        return sum + (!isNaN(val) && a.score !== '' ? val : 0);
    }, 0);
    const labActivityTotalMax = labActivities.reduce((sum, a) => sum + (Number(a.max) || 0), 0) || 50;

    const handleApplyLabActivities = (targetMaxRaw) => {
        // If target rule expects e.g. 350 or 35, scale proportionately, or apply directly
        let scaledVal = labActivityTotalScore;
        if (targetMaxRaw && targetMaxRaw !== labActivityTotalMax) {
            scaledVal = Math.round(((labActivityTotalScore / labActivityTotalMax) * targetMaxRaw) * 100) / 100;
        }
        setMarks(prev => ({ ...prev, labRecord: scaledVal }));
        setShowLabCalculator(false);
        toast.success(`Applied calculated lab score: ${scaledVal} / ${targetMaxRaw}`);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Interactive Helper: Lab Multiple Tests Auto-Averager
    // E.g. (42 + 46) / 2 = 44 / 50
    // ──────────────────────────────────────────────────────────────────────────
    const [showLabTestAverager, setShowLabTestAverager] = useState(false);
    const [labTestValues, setLabTestValues] = useState({ t1: '', t2: '', scaleMax: 50 });

    const avgT1 = Number(labTestValues.t1);
    const avgT2 = Number(labTestValues.t2);
    const hasBothAvg = labTestValues.t1 !== '' && labTestValues.t2 !== '' && !isNaN(avgT1) && !isNaN(avgT2);
    const calculatedLabTestAvg = hasBothAvg ? Math.round(((avgT1 + avgT2) / 2) * 100) / 100 : null;

    const handleApplyLabTestAverage = (targetMaxRaw) => {
        if (calculatedLabTestAvg === null) return;
        const scaleMax = Number(labTestValues.scaleMax) || 50;
        let finalVal = calculatedLabTestAvg;
        if (targetMaxRaw && targetMaxRaw !== scaleMax) {
            finalVal = Math.round(((calculatedLabTestAvg / scaleMax) * targetMaxRaw) * 100) / 100;
        }
        setMarks(prev => ({ ...prev, labTest: finalVal }));
        setShowLabTestAverager(false);
        toast.success(`Applied lab test average: ${finalVal} / ${targetMaxRaw}`);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Live Rule-Driven Totals Calculation
    // ──────────────────────────────────────────────────────────────────────────
    const calculateLiveTotals = () => {
        if (isNcmc) {
            const hasVal = marks.cie !== '' && marks.cie !== null && !isNaN(Number(marks.cie));
            const score = hasVal ? Math.min(100, Math.max(0, Number(marks.cie))) : null;
            return {
                totalCie: score,
                maxCie: 100,
                status: hasVal ? (score >= 40 ? 'PASSED (PP)' : 'NOT PASSED (NP)') : 'NOT ENTERED'
            };
        }

        if (isIpcc) {
            // Theory Gate: Test 1 (50->8.5) + Test 2 (50->8.5) + Q1 (20->2) + Q2 (20->2) + A1 (20->2) + A2 (20->2) = 25
            const t1 = calcReduced(marks.test1, 50, 8.5);
            const t2 = calcReduced(marks.test2, 50, 8.5);
            const q1 = calcReduced(marks.quiz1, 20, 2);
            const q2 = calcReduced(marks.quiz2, 20, 2);
            const a1 = calcReduced(marks.assignment1, 20, 2);
            const a2 = calcReduced(marks.assignment2, 20, 2);

            const hasAnyTheory = t1 !== null || t2 !== null || q1 !== null || q2 !== null || a1 !== null || a2 !== null;
            const theorySubtotal = hasAnyTheory ? (t1 || 0) + (t2 || 0) + (q1 || 0) + (q2 || 0) + (a1 || 0) + (a2 || 0) : null;

            // Practical Gate: Lab Record (350->15) + Lab Test (15->10) = 25
            const labRec = calcReduced(marks.labRecord, 350, 15);
            const labT = calcReduced(marks.labTest, 15, 10);
            const hasAnyPractical = labRec !== null || labT !== null;
            const practicalSubtotal = hasAnyPractical ? (labRec || 0) + (labT || 0) : null;

            const hasAny = hasAnyTheory || hasAnyPractical;
            const totalCie = hasAny ? Math.round(((theorySubtotal || 0) + (practicalSubtotal || 0)) * 100) / 100 : null;

            const theoryPassed = theorySubtotal !== null ? theorySubtotal >= 10 : null;
            const practicalPassed = practicalSubtotal !== null ? practicalSubtotal >= 10 : null;
            const isEligible = totalCie !== null ? (theoryPassed && practicalPassed && totalCie >= 20) : null;

            return {
                theorySubtotal,
                practicalSubtotal,
                totalCie,
                maxCie: 50,
                theoryPassed,
                practicalPassed,
                isEligible
            };
        }

        // Generic Dynamic Rule calculation
        let runningTotal = 0;
        let hasAnyMark = false;

        comps.forEach(comp => {
            const count = comp.entryCount || 1;
            const rawMaxEach = comp.entryMaxRaw || comp.rawMaxMarks || 50;
            const targetMax = comp.targetMax || 50;
            const reducedMaxEach = comp.entryMaxReduced || (targetMax / count);

            for (let i = 0; i < count; i++) {
                const mapKey = getComponentKeyMapping(comp.key, i);
                const val = marks[comp.key] !== undefined && marks[comp.key] !== '' ? marks[comp.key] : marks[mapKey];
                const red = calcReduced(val, rawMaxEach, reducedMaxEach);
                if (red !== null) {
                    runningTotal += red;
                    hasAnyMark = true;
                }
            }
        });

        const targetCieMax = comps.reduce((sum, c) => sum + (c.targetMax || 0), 0) || 50;
        return {
            totalCie: hasAnyMark ? Math.round(runningTotal * 100) / 100 : null,
            maxCie: targetCieMax,
            isEligible: hasAnyMark ? runningTotal >= (targetCieMax * 0.4) : null
        };
    };

    const totals = calculateLiveTotals();

    const handleSave = async (e) => {
        e.preventDefault();

        // Strict bounds validation: reject < 0 or > rawMax
        const validationErrors = [];
        if (isNcmc) {
            if (marks.cie !== '' && marks.cie !== null && marks.cie !== undefined) {
                const val = Number(marks.cie);
                if (isNaN(val) || val < 0 || val > 100) {
                    validationErrors.push('Completion Score must be between 0 and 100');
                }
            }
        } else if (isIpcc) {
            const checks = [
                { name: 'Internal Test 1', val: marks.test1, max: 50 },
                { name: 'Internal Test 2', val: marks.test2, max: 50 },
                { name: 'Quiz 1', val: marks.quiz1, max: 20 },
                { name: 'Quiz 2', val: marks.quiz2, max: 20 },
                { name: 'Assignment 1', val: marks.assignment1, max: 20 },
                { name: 'Assignment 2', val: marks.assignment2, max: 20 },
                { name: 'Total Lab Marks', val: marks.labRecord, max: 350 },
                { name: 'Average Lab Test Marks', val: marks.labTest, max: 15 }
            ];
            checks.forEach(c => {
                if (c.val !== '' && c.val !== null && c.val !== undefined) {
                    const num = Number(c.val);
                    if (isNaN(num) || num < 0 || num > c.max) {
                        validationErrors.push(`${c.name} must be between 0 and ${c.max}`);
                    }
                }
            });
        } else {
            comps.forEach(comp => {
                const count = comp.entryCount || 1;
                const rawMaxEach = comp.entryMaxRaw || comp.rawMaxMarks || 50;
                for (let i = 0; i < count; i++) {
                    const mapKey = getComponentKeyMapping(comp.key, i);
                    const val = marks[comp.key] !== undefined && marks[comp.key] !== '' && count === 1
                        ? marks[comp.key]
                        : marks[mapKey];
                    if (val !== '' && val !== null && val !== undefined) {
                        const num = Number(val);
                        if (isNaN(num) || num < 0 || num > rawMaxEach) {
                            const label = count > 1 ? `${comp.name} Entry ${i + 1}` : comp.name;
                            validationErrors.push(`${label} must be between 0 and ${rawMaxEach}`);
                        }
                    }
                }
            });
        }

        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }

        setSaving(true);
        try {
            const rawMarks = {
                test1: marks.test1 !== '' && marks.test1 !== undefined ? Number(marks.test1) : null,
                test2: marks.test2 !== '' && marks.test2 !== undefined ? Number(marks.test2) : null,
                quiz1: marks.quiz1 !== '' && marks.quiz1 !== undefined ? Number(marks.quiz1) : null,
                quiz2: marks.quiz2 !== '' && marks.quiz2 !== undefined ? Number(marks.quiz2) : null,
                assignment1: marks.assignment1 !== '' && marks.assignment1 !== undefined ? Number(marks.assignment1) : null,
                assignment2: marks.assignment2 !== '' && marks.assignment2 !== undefined ? Number(marks.assignment2) : null,
                labRecord: marks.labRecord !== '' && marks.labRecord !== undefined ? Number(marks.labRecord) : null,
                labTest: marks.labTest !== '' && marks.labTest !== undefined ? Number(marks.labTest) : null,
                cie: marks.cie !== '' && marks.cie !== undefined ? Number(marks.cie) : null
            };

            // Also attach explicit dynamic keys (e.g. PHASE_1, PHASE_2, REPORT, SDC, etc.)
            comps.forEach(c => {
                if (marks[c.key] !== '' && marks[c.key] !== undefined && rawMarks[c.key] === undefined) {
                    rawMarks[c.key] = Number(marks[c.key]);
                }
            });

            const payload = {
                registeredSubjectId: subject.registeredSubjectId || subject.registeredSubject || subject._id,
                semester: Number(semester),
                rawMarks,
                evaluationType: isIpcc ? 'IPCC' : evalGroup.includes('lab') ? 'LAB_ONLY' : evalGroup.includes('aec') ? 'LOW_THEORY' : 'THEORY_ONLY'
            };

            const res = await apiV2.saveCieRecord(payload);
            toast.success(`Saved CIE marks for ${subject.code}`);
            onSaveSuccess(res.data?.data);
        } catch (err) {
            console.error('Failed to save CIE marks:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to save CIE marks');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 ${
                isDark ? 'bg-[#0c101a] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                    isDark ? 'border-white/10 bg-[#0c101a]' : 'border-slate-200 bg-slate-50'
                }`}>
                    <div className="flex flex-col">
                        <h2 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {subject.name || subject.subjectName}
                        </h2>
                        <span className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{subject.code}</span> · {subject.evaluationGroup || subject.pattern}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                            isDark ? 'bg-white/[0.04] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* Header Columns Guide */}
                    <div className={`flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider pb-1 border-b ${
                        isDark ? 'text-slate-400 border-white/10' : 'text-slate-500 border-slate-200'
                    }`}>
                        <span className="w-28">Component</span>
                        <span className="flex-1 text-center">Entered (Raw)</span>
                        <span className="w-5"></span>
                        <span className="w-24 text-right pr-1">Reduced</span>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        NCMC NON-CREDIT EVALUATION
                    ───────────────────────────────────────────────────────────── */}
                    {isNcmc ? (
                        <div className={`flex flex-col gap-2.5 p-3 rounded-lg border ${
                            isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                                isDark ? 'text-purple-400' : 'text-purple-700'
                            }`}>
                                Non-Credit Continuous Evaluation
                            </span>
                            <CieDrawerRow 
                                label="Completion Score"
                                rawValue={marks.cie}
                                rawMax={100}
                                reducedMax={100}
                                onChange={val => setMarks({ ...marks, cie: val })}
                                isDark={isDark}
                            />
                            <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Passing Requirement:</span>
                                <span className={totals.status?.includes('PP') ? (isDark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold') : (isDark ? 'text-amber-400 font-bold' : 'text-amber-700 font-bold')}>
                                    {totals.status} (Min 40 req)
                                </span>
                            </div>
                        </div>
                    ) : isIpcc ? (
                        /* ─────────────────────────────────────────────────────────────
                            INTEGRATED IPCC DUAL-GATE EVALUATION
                        ───────────────────────────────────────────────────────────── */
                        <div className="flex flex-col gap-3.5">
                            {/* THEORY PARTITION */}
                            <div className={`flex flex-col gap-1 p-3 rounded-lg border ${
                                isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className={`flex items-center justify-between pb-1.5 border-b ${
                                    isDark ? 'border-white/5' : 'border-slate-200'
                                }`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                                        isDark ? 'text-purple-400' : 'text-purple-700'
                                    }`}>
                                        Theory Partition (Max 25)
                                    </span>
                                    {totals.theorySubtotal !== null && (
                                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                            totals.theoryPassed 
                                                ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                                                : (isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-700 border border-red-200')
                                        }`}>
                                            {totals.theorySubtotal.toFixed(2)} / 25 {totals.theoryPassed ? '· PASS' : '· FAIL'}
                                        </span>
                                    )}
                                </div>

                                <CieDrawerRow 
                                    label="Internal Test 1"
                                    rawValue={marks.test1}
                                    rawMax={50}
                                    reducedMax={8.5}
                                    onChange={val => setMarks({ ...marks, test1: val })}
                                    isDark={isDark}
                                />
                                <CieDrawerRow 
                                    label="Internal Test 2"
                                    rawValue={marks.test2}
                                    rawMax={50}
                                    reducedMax={8.5}
                                    onChange={val => setMarks({ ...marks, test2: val })}
                                    isDark={isDark}
                                />
                                <CieDrawerRow 
                                    label="Quiz 1"
                                    rawValue={marks.quiz1}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, quiz1: val })}
                                    isDark={isDark}
                                />
                                <CieDrawerRow 
                                    label="Quiz 2"
                                    rawValue={marks.quiz2}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, quiz2: val })}
                                    isDark={isDark}
                                />
                                <CieDrawerRow 
                                    label="Assignment 1"
                                    rawValue={marks.assignment1}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, assignment1: val })}
                                    isDark={isDark}
                                />
                                <CieDrawerRow 
                                    label="Assignment 2"
                                    rawValue={marks.assignment2}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, assignment2: val })}
                                    isDark={isDark}
                                />

                                <div className={`pt-1.5 flex items-center justify-between text-[10px] font-mono ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    <span>Gate requirement:</span>
                                    <span className={isDark ? 'text-amber-400' : 'text-amber-700 font-semibold'}>Min 10.0 Theory CIE required</span>
                                </div>
                            </div>

                            {/* PRACTICAL PARTITION */}
                            <div className={`flex flex-col gap-2 p-3 rounded-lg border ${
                                isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className={`flex items-center justify-between pb-1.5 border-b ${
                                    isDark ? 'border-white/5' : 'border-slate-200'
                                }`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                                        isDark ? 'text-cyan-400' : 'text-sky-700'
                                    }`}>
                                        Practical Partition (Max 25)
                                    </span>
                                    {totals.practicalSubtotal !== null && (
                                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                            totals.practicalPassed 
                                                ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                                                : (isDark ? 'bg-red-500/15 text-red-300' : 'bg-red-50 text-red-700 border border-red-200')
                                        }`}>
                                            {totals.practicalSubtotal.toFixed(2)} / 25 {totals.practicalPassed ? '· PASS' : '· FAIL'}
                                        </span>
                                    )}
                                </div>

                                <CieDrawerRow 
                                    label="Total Lab Marks"
                                    helperText="Add all lab conduction/record marks and enter the total."
                                    rawValue={marks.labRecord}
                                    rawMax={350}
                                    reducedMax={15}
                                    onChange={val => setMarks({ ...marks, labRecord: val })}
                                    isDark={isDark}
                                />

                                {/* Sub-Activity Helper Trigger for IPCC Lab */}
                                <button
                                    type="button"
                                    onClick={() => setShowLabCalculator(!showLabCalculator)}
                                    className={`self-start text-[11px] flex items-center gap-1 font-mono transition-colors ${
                                        isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900 font-semibold'
                                    }`}
                                >
                                    <Calculator size={12} />
                                    <span>{showLabCalculator ? 'Hide activity breakdown' : 'Calculate from lab activities (e.g. IDTE 1, 2, 3)'}</span>
                                </button>
                                {showLabCalculator && (
                                    <div className={`p-2.5 rounded border flex flex-col gap-2 font-mono text-xs ${
                                        isDark ? 'bg-black/40 border-purple-500/20' : 'bg-purple-50/50 border-purple-200'
                                    }`}>
                                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                                            Continuous Lab Activities Auto-Calculator
                                        </span>
                                        {labActivities.map((act, i) => (
                                            <div key={act.id} className="flex items-center justify-between gap-1">
                                                <input
                                                    type="text"
                                                    value={act.name}
                                                    onChange={e => {
                                                        const next = [...labActivities];
                                                        next[i].name = e.target.value;
                                                        setLabActivities(next);
                                                    }}
                                                    className={`w-32 bg-transparent text-[11px] focus:outline-none border-b ${
                                                        isDark ? 'text-slate-300 border-white/5' : 'text-slate-800 border-slate-200'
                                                    }`}
                                                />
                                                <div className="flex items-center gap-1 text-[11px]">
                                                    <input
                                                        type="number"
                                                        placeholder="—"
                                                        value={act.score}
                                                        onChange={e => {
                                                            const next = [...labActivities];
                                                            next[i].score = e.target.value;
                                                            setLabActivities(next);
                                                        }}
                                                        className={`w-14 rounded px-1.5 py-0.5 text-right border ${
                                                            isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                        }`}
                                                    />
                                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/</span>
                                                    <input
                                                        type="number"
                                                        value={act.max}
                                                        onChange={e => {
                                                            const next = [...labActivities];
                                                            next[i].max = e.target.value;
                                                            setLabActivities(next);
                                                        }}
                                                        className={`w-12 rounded px-1.5 py-0.5 text-right border ${
                                                            isDark ? 'bg-black/50 border-white/10 text-slate-400' : 'bg-white border-slate-300 text-slate-600 shadow-xs'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <div className={`flex items-center justify-between pt-1 border-t ${isDark ? 'border-white/5' : 'border-purple-200/60'}`}>
                                            <button
                                                type="button"
                                                onClick={() => setLabActivities([...labActivities, { id: Date.now(), name: `Activity ${labActivities.length + 1}`, score: '', max: 10 }])}
                                                className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-700 hover:text-sky-900 font-semibold'}`}
                                            >
                                                <Plus size={11} />
                                                <span>Add Activity</span>
                                            </button>
                                            <div className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                Sum: <span className={isDark ? 'text-purple-300' : 'text-purple-700'}>{labActivityTotalScore} / {labActivityTotalMax}</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleApplyLabActivities(350)}
                                            className="w-full mt-1 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-colors"
                                        >
                                            Apply Sum to Lab Conduction
                                        </button>
                                    </div>
                                )}

                                <CieDrawerRow 
                                    label="Average Lab Test Marks"
                                    helperText="If multiple lab tests were conducted, enter the average of all lab test marks."
                                    rawValue={marks.labTest}
                                    rawMax={15}
                                    reducedMax={10}
                                    onChange={val => setMarks({ ...marks, labTest: val })}
                                    isDark={isDark}
                                />

                                {/* Multi-Test Averager Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setShowLabTestAverager(!showLabTestAverager)}
                                    className={`self-start text-[11px] flex items-center gap-1 font-mono transition-colors ${
                                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-700 hover:text-sky-900 font-semibold'
                                    }`}
                                >
                                    <Calculator size={12} />
                                    <span>{showLabTestAverager ? 'Hide test averager' : 'Average 2 Lab Tests (e.g. 42 + 46 / 2)'}</span>
                                </button>

                                {showLabTestAverager && (
                                    <div className={`p-2.5 rounded border flex flex-col gap-2 font-mono text-xs ${
                                        isDark ? 'bg-black/40 border-cyan-500/20' : 'bg-sky-50/50 border-sky-200'
                                    }`}>
                                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-cyan-300' : 'text-sky-800'}`}>
                                            Lab Tests Auto-Averager
                                        </span>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Test 1:</span>
                                            <input
                                                type="number"
                                                placeholder="e.g. 42"
                                                value={labTestValues.t1}
                                                onChange={e => setLabTestValues({ ...labTestValues, t1: e.target.value })}
                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                    isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                }`}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Test 2:</span>
                                            <input
                                                type="number"
                                                placeholder="e.g. 46"
                                                value={labTestValues.t2}
                                                onChange={e => setLabTestValues({ ...labTestValues, t2: e.target.value })}
                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                    isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                }`}
                                            />
                                        </div>
                                        <div className={`flex items-center justify-between pt-1 border-t text-[11px] ${
                                            isDark ? 'border-white/5' : 'border-sky-200/60'
                                        }`}>
                                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Scale / Max:</span>
                                            <input
                                                type="number"
                                                value={labTestValues.scaleMax}
                                                onChange={e => setLabTestValues({ ...labTestValues, scaleMax: e.target.value })}
                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                    isDark ? 'bg-black/50 border-white/10 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-xs'
                                                }`}
                                            />
                                        </div>
                                        {calculatedLabTestAvg !== null && (
                                            <div className={`text-[11px] font-bold text-center py-1 ${isDark ? 'text-cyan-300' : 'text-sky-800'}`}>
                                                Average: ({avgT1} + {avgT2}) / 2 = {calculatedLabTestAvg} / {labTestValues.scaleMax}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            disabled={calculatedLabTestAvg === null}
                                            onClick={() => handleApplyLabTestAverage(15)}
                                            className="w-full mt-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[11px] font-bold transition-colors"
                                        >
                                            Apply Average to Lab Test
                                        </button>
                                    </div>
                                )}

                                <div className={`pt-1.5 flex items-center justify-between text-[10px] font-mono ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    <span>Gate requirement:</span>
                                    <span className={isDark ? 'text-amber-400' : 'text-amber-700 font-semibold'}>Min 10.0 Practical CIE required</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ─────────────────────────────────────────────────────────────
                            DYNAMIC RULE-DRIVEN EVALUATION COMPONENTS
                            (Standard Theory, AEC, Standard Lab, Project SDC, CAED)
                        ───────────────────────────────────────────────────────────── */
                        <div className="flex flex-col gap-3.5">
                            {comps.map((comp) => {
                                const count = comp.entryCount || 1;
                                const rawMaxEach = comp.entryMaxRaw || comp.rawMaxMarks || 50;
                                const targetMax = comp.targetMax || 50;
                                const reducedMaxEach = comp.entryMaxReduced || (targetMax / count);
                                const isLabConduction = comp.key.includes('LAB_CONDUCTION') || comp.key.includes('LAB_RECORD');
                                const isLabTest = comp.key.includes('LAB_TEST') || comp.key.includes('VIVA');

                                // Calculate subtotal contribution for this component block
                                let compSubtotal = 0;
                                let compHasEntry = false;
                                for (let i = 0; i < count; i++) {
                                    const mapKey = getComponentKeyMapping(comp.key, i);
                                    const val = marks[comp.key] !== undefined && marks[comp.key] !== '' ? marks[comp.key] : marks[mapKey];
                                    const red = calcReduced(val, rawMaxEach, reducedMaxEach);
                                    if (red !== null) {
                                        compSubtotal += red;
                                        compHasEntry = true;
                                    }
                                }

                                return (
                                    <div key={comp.key} className={`flex flex-col gap-1 p-3 rounded-lg border ${
                                        isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <div className={`flex items-center justify-between pb-1 border-b ${
                                            isDark ? 'border-white/5' : 'border-slate-200'
                                        }`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                                                isDark ? 'text-purple-400' : 'text-purple-700'
                                            }`}>
                                                {comp.name} (Max {targetMax})
                                            </span>
                                            {compHasEntry && (
                                                <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-cyan-300' : 'text-sky-700'}`}>
                                                    {compSubtotal.toFixed(2)} / {targetMax}
                                                </span>
                                            )}
                                        </div>

                                        {Array.from({ length: count }).map((_, idx) => {
                                            const mapKey = getComponentKeyMapping(comp.key, idx);
                                            const entryLabel = count > 1 
                                                ? `${comp.name.includes('Test') ? 'Test' : comp.name.includes('Quiz') ? 'Quiz' : comp.name.includes('Assignment') ? 'Assignment' : 'Entry'} ${idx + 1}`
                                                : comp.name;

                                            const currentVal = marks[comp.key] !== undefined && marks[comp.key] !== '' && count === 1
                                                ? marks[comp.key]
                                                : (marks[mapKey] ?? '');

                                            return (
                                                <CieDrawerRow
                                                    key={`${comp.key}_${idx}`}
                                                    label={entryLabel}
                                                    rawValue={currentVal}
                                                    rawMax={rawMaxEach}
                                                    reducedMax={reducedMaxEach}
                                                    onChange={val => {
                                                        const next = { ...marks };
                                                        next[mapKey] = val;
                                                        if (count === 1) next[comp.key] = val;
                                                        setMarks(next);
                                                    }}
                                                    isDark={isDark}
                                                />
                                            );
                                        })}

                                        {/* Optional Sub-Activity Auto-Calculator for Lab Conduction */}
                                        {isLabConduction && (
                                            <div className="pt-1 flex flex-col gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLabCalculator(!showLabCalculator)}
                                                    className={`self-start text-[11px] flex items-center gap-1 font-mono transition-colors ${
                                                        isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-700 hover:text-purple-900 font-semibold'
                                                    }`}
                                                >
                                                    <Calculator size={12} />
                                                    <span>{showLabCalculator ? 'Hide activity breakdown' : 'Calculate from lab activities (e.g. IDTE 1, 2, 3)'}</span>
                                                </button>

                                                {showLabCalculator && (
                                                    <div className={`p-2.5 rounded border flex flex-col gap-2 font-mono text-xs ${
                                                        isDark ? 'bg-black/40 border-purple-500/20' : 'bg-purple-50/50 border-purple-200'
                                                    }`}>
                                                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                                                            Continuous Lab Activities Auto-Calculator
                                                        </span>
                                                        {labActivities.map((act, i) => (
                                                            <div key={act.id} className="flex items-center justify-between gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={act.name}
                                                                    onChange={e => {
                                                                        const next = [...labActivities];
                                                                        next[i].name = e.target.value;
                                                                        setLabActivities(next);
                                                                    }}
                                                                    className={`w-32 bg-transparent text-[11px] focus:outline-none border-b ${
                                                                        isDark ? 'text-slate-300 border-white/5' : 'text-slate-800 border-slate-200'
                                                                    }`}
                                                                />
                                                                <div className="flex items-center gap-1 text-[11px]">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="—"
                                                                        value={act.score}
                                                                        onChange={e => {
                                                                            const next = [...labActivities];
                                                                            next[i].score = e.target.value;
                                                                            setLabActivities(next);
                                                                        }}
                                                                        className={`w-14 rounded px-1.5 py-0.5 text-right border ${
                                                                            isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                                        }`}
                                                                    />
                                                                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>/</span>
                                                                    <input
                                                                        type="number"
                                                                        value={act.max}
                                                                        onChange={e => {
                                                                            const next = [...labActivities];
                                                                            next[i].max = e.target.value;
                                                                            setLabActivities(next);
                                                                        }}
                                                                        className={`w-12 rounded px-1.5 py-0.5 text-right border ${
                                                                            isDark ? 'bg-black/50 border-white/10 text-slate-400' : 'bg-white border-slate-300 text-slate-600 shadow-xs'
                                                                        }`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div className={`flex items-center justify-between pt-1 border-t ${isDark ? 'border-white/5' : 'border-purple-200/60'}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setLabActivities([...labActivities, { id: Date.now(), name: `Activity ${labActivities.length + 1}`, score: '', max: 10 }])}
                                                                className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-700 hover:text-sky-900 font-semibold'}`}
                                                            >
                                                                <Plus size={11} />
                                                                <span>Add Activity</span>
                                                            </button>
                                                            <div className={`text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                                                Sum: <span className={isDark ? 'text-purple-300' : 'text-purple-700'}>{labActivityTotalScore} / {labActivityTotalMax}</span>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleApplyLabActivities(rawMaxEach)}
                                                            className="w-full mt-1 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-colors"
                                                        >
                                                            Apply Sum to {comp.name}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Optional Averager for Lab Test */}
                                        {isLabTest && (
                                            <div className="pt-1 flex flex-col gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLabTestAverager(!showLabTestAverager)}
                                                    className={`self-start text-[11px] flex items-center gap-1 font-mono transition-colors ${
                                                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-sky-700 hover:text-sky-900 font-semibold'
                                                    }`}
                                                >
                                                    <Calculator size={12} />
                                                    <span>{showLabTestAverager ? 'Hide test averager' : 'Average 2 Lab Tests (e.g. 42 + 46 / 2)'}</span>
                                                </button>

                                                {showLabTestAverager && (
                                                    <div className={`p-2.5 rounded border flex flex-col gap-2 font-mono text-xs ${
                                                        isDark ? 'bg-black/40 border-cyan-500/20' : 'bg-sky-50/50 border-sky-200'
                                                    }`}>
                                                        <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-cyan-300' : 'text-sky-800'}`}>
                                                            Lab Tests Auto-Averager
                                                        </span>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Test 1:</span>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 42"
                                                                value={labTestValues.t1}
                                                                onChange={e => setLabTestValues({ ...labTestValues, t1: e.target.value })}
                                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                                    isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Test 2:</span>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 46"
                                                                value={labTestValues.t2}
                                                                onChange={e => setLabTestValues({ ...labTestValues, t2: e.target.value })}
                                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                                    isDark ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className={`flex items-center justify-between pt-1 border-t text-[11px] ${
                                                            isDark ? 'border-white/5' : 'border-sky-200/60'
                                                        }`}>
                                                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Scale / Max:</span>
                                                            <input
                                                                type="number"
                                                                value={labTestValues.scaleMax}
                                                                onChange={e => setLabTestValues({ ...labTestValues, scaleMax: e.target.value })}
                                                                className={`w-16 rounded px-1.5 py-0.5 text-right border ${
                                                                    isDark ? 'bg-black/50 border-white/10 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-xs'
                                                                }`}
                                                            />
                                                        </div>
                                                        {calculatedLabTestAvg !== null && (
                                                            <div className={`text-[11px] font-bold text-center py-1 ${isDark ? 'text-cyan-300' : 'text-sky-800'}`}>
                                                                Average: ({avgT1} + {avgT2}) / 2 = {calculatedLabTestAvg} / {labTestValues.scaleMax}
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={calculatedLabTestAvg === null}
                                                            onClick={() => handleApplyLabTestAverage(rawMaxEach)}
                                                            className="w-full mt-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[11px] font-bold transition-colors"
                                                        >
                                                            Apply Average to {comp.name}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Calculated Live Preview */}
                    <div className={`mt-auto pt-3 border-t flex items-center justify-between font-mono ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                    }`}>
                        <div className="flex flex-col">
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Calculated CIE</span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {isNcmc ? 'Min 40 required to Pass' : 'Min 20.0 required for SEE eligibility'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {totals.totalCie !== null && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                                    isNcmc
                                        ? (totals.totalCie >= 40 ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'))
                                        : isIpcc
                                            ? (totals.isEligible ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (isDark ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'))
                                            : (totals.totalCie >= 20 ? (isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : (isDark ? 'bg-red-500/15 text-red-300 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200'))
                                }`}>
                                    {isNcmc 
                                        ? (totals.totalCie >= 40 ? 'PASSED (PP)' : 'NOT PASSED')
                                        : isIpcc
                                            ? (totals.theoryPassed === false ? 'THEORY < 10' : totals.practicalPassed === false ? 'PRACTICAL < 10' : totals.totalCie < 20 ? 'CIE < 20' : 'ELIGIBLE')
                                            : (totals.totalCie >= 20 ? 'ELIGIBLE' : 'BELOW 20')
                                    }
                                </span>
                            )}
                            <span className={`text-sm font-black ${isDark ? 'text-cyan-400' : 'text-sky-700'}`}>
                                {totals.totalCie !== null ? `${totals.totalCie.toFixed(2)} / ${totals.maxCie}` : `— / ${totals.maxCie}`}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-1.5 rounded text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                            <span>Save Marks</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DRAWER 2: SEE RAW MARKS ENTRY DRAWER
   Allows student to input raw SEE mark and view rule-based conversion.
══════════════════════════════════════════════════════════════════════════════ */
function SeeMarksDrawer({ subject, semester, onClose, onSaveSuccess, isDark }) {
    const isNcmc = subject.credits === 0 || subject.evaluationGroup?.toLowerCase().includes('ncmc');
    const seeState = getSeeState(subject);
    const rawMax = seeState.rawMax || 100;

    const [seeMark, setSeeMark] = useState(
        seeState.rawMarks !== null && seeState.rawMarks !== undefined ? String(seeState.rawMarks) : ''
    );
    const [saving, setSaving] = useState(false);

    // Live evaluated SEE preview
    const evaluatedSee = () => {
        if (seeMark === '' || isNaN(Number(seeMark))) return '— / 50';
        const raw = Number(seeMark);
        if (rawMax === 100) {
            return `${Math.round((raw / 2) * 100) / 100} / 50`;
        }
        return `${raw} / 50`;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                registeredSubjectId: subject.registeredSubjectId || subject.registeredSubject || subject._id,
                semester: Number(semester),
                seeRawMarks: seeMark !== '' ? Number(seeMark) : null,
                seeRawMaximum: rawMax
            };

            await apiV2.saveSgpaRecord(payload);
            toast.success(`Saved SEE mark for ${subject.code}`);
            onSaveSuccess();
        } catch (err) {
            console.error('Failed to save SEE mark:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to save SEE mark');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 ${
                isDark ? 'bg-[#0c101a] border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}>
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between ${
                    isDark ? 'border-white/10 bg-[#0c101a]' : 'border-slate-200 bg-slate-50'
                }`}>
                    <div>
                        <h2 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {subject.name || subject.subjectName}
                        </h2>
                        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{subject.code}</span> · {subject.evaluationGroup || subject.pattern}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                            isDark ? 'bg-white/[0.04] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                        SEE MARKS
                    </span>

                    {isNcmc || !subject.see?.enabled ? (
                        <div className={`p-4 rounded-lg border text-xs ${
                            isDark ? 'bg-black/30 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                            <span className={`font-bold block mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Not applicable</span>
                            This evaluation rule does not have a Semester End Examination component.
                        </div>
                    ) : (
                        <div className={`flex flex-col gap-3 p-3.5 rounded-lg border ${
                            isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                            <label className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                Marks obtained
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={rawMax}
                                    placeholder="Enter mark"
                                    value={seeMark}
                                    onChange={e => setSeeMark(e.target.value)}
                                    className={`w-28 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none border ${
                                        isDark 
                                            ? 'bg-black/40 border-white/10 focus:border-purple-500 text-white' 
                                            : 'bg-white border-slate-300 focus:border-purple-600 text-slate-900 shadow-xs'
                                    }`}
                                />
                                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ {rawMax}</span>
                            </div>

                            <div className={`text-[11px] font-mono flex flex-col gap-0.5 pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <span>Maximum marks: {rawMax}</span>
                                <span className={`font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                    Evaluated SEE: {evaluatedSee()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className={`mt-auto pt-3 border-t flex items-center justify-end gap-2 ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                    }`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            Cancel
                        </button>
                        {(!isNcmc && subject.see?.enabled) && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-1.5 rounded text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                <span>Save Marks</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

export default SemesterResultSheet;
