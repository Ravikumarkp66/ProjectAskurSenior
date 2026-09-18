import React, { useState, useEffect, useRef } from 'react';
import { apiV2 } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { 
    LayoutDashboard, ClipboardCheck, FileText, 
    ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2,
    X, Edit3, Save, Check, Calculator, Plus, Trash2, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

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

    const rawMax = seeComp?.rawMaxMarks || (
        sub.evaluationGroup?.toLowerCase().includes('theory') || sub.evaluationGroup?.toLowerCase().includes('ipcc') ? 100 : 50
    );

    const isEntered = seeComp 
        ? (seeComp.status === 'ENTERED' || seeComp.status === 'ZERO' || (typeof seeComp.rawMarks === 'number' && seeComp.status !== 'NOT_ENTERED'))
        : (typeof sub.see?.marks === 'number' || typeof sub.see?.obtained === 'number');

    if (!isEntered || seeComp?.rawMarks === null || seeComp?.rawMarks === undefined) {
        return { status: 'NOT_ENTERED', rawMarks: null, rawMax, scaledScore: null, max: sub.see?.max || 50 };
    }

    return {
        status: 'ENTERED',
        rawMarks: seeComp?.rawMarks ?? null,
        rawMax,
        scaledScore: sub.see?.obtained ?? sub.see?.marks ?? 0,
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

    const testComp = findComp((k, t, n) => 
        (k.includes('TEST') || (n && n.toLowerCase().includes('test'))) && 
        !k.includes('LAB') && !k.includes('SEE') && t !== 'LAB_TEST'
    );
    const quizComp = findComp((k, t, n) => 
        (k.includes('QUIZ') || (n && n.toLowerCase().includes('quiz'))) && 
        !k.includes('ASSIGNMENT') && !k.includes('SEE')
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

        const score = typeof comp.normalizedMarks === 'number' ? comp.normalizedMarks : 0;
        return `${score.toFixed(2)} / ${targetMax}`;
    };

    const formatMultiple = (compList, defaultTargetMax) => {
        if (!compList || compList.length === 0) return '—';
        const hasEntered = compList.some(c => c.status !== 'NOT_ENTERED' && c.rawMarks !== null && c.rawMarks !== undefined);
        if (!hasEntered) return '—';
        const targetMax = compList.reduce((sum, c) => sum + (c.targetMax || 0), 0) || defaultTargetMax;
        const totalScore = compList.reduce((sum, c) => sum + (typeof c.normalizedMarks === 'number' ? c.normalizedMarks : 0), 0);
        return `${totalScore.toFixed(2)} / ${targetMax}`;
    };

    return {
        tests: formatContribution(testComp, 34),
        quizzes: quizComp 
            ? formatContribution(quizComp, 8) 
            : (quizAssignComp ? formatContribution(quizAssignComp, 16) : '—'),
        assignments: assignComps.length > 1 
            ? formatMultiple(assignComps, 30) 
            : formatContribution(assignComps[0], 8),
        labs: formatContribution(labComp, 35),
        labTest: formatContribution(labTestComp, 15)
    };
}

const SemesterResultSheet = ({ initialSemester = null }) => {
    const { isDark = true } = useTheme?.() || { isDark: true };

    const [selectedSemester, setSelectedSemester] = useState(initialSemester || 1);
    const [activeSidebarTab, setActiveSidebarTab] = useState('cie'); // 'cie' | 'see' | 'overview'
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
        fetchResults(selectedSemester);
    }, [selectedSemester]);

    const subjects = resultData?.subjects || [];
    const scheme = resultData?.scheme || 'Scheme 2025';
    const student = resultData?.student || {};
    const currentSemester = student.currentSemester || 1;
    const availableSemesters = resultData?.availableSemesters && resultData.availableSemesters.length > 0
        ? resultData.availableSemesters
        : [1];

    // Canonical summary statistics
    const totalSubjects = subjects.length;
    const totalCreditsAttempted = subjects.reduce((sum, s) => sum + (Number(s.credits) || 0), 0);

    let passedSubjects = 0;
    let failedSubjects = 0;

    subjects.forEach((s) => {
        const isNcmc = s.credits === 0 || s.evaluationGroup?.toLowerCase().includes('ncmc');
        const isEligible = s.eligibility?.eligible !== false;
        const isPassed = isNcmc
            ? s.grade?.letter === 'PP'
            : (s.grade?.letter && s.grade.letter !== 'F' && s.grade.letter !== 'NP' && s.grade.letter !== 'NE');
        
        if (isEligible && isPassed) {
            passedSubjects += 1;
        } else {
            failedSubjects += 1;
        }
    });

    // Theme Tokens
    const pageBg = isDark ? 'bg-[#07090e] text-slate-100' : 'bg-slate-50 text-slate-900';
    const sidebarBg = isDark ? 'bg-[#0b0e17] border-white/5' : 'bg-white border-slate-200';
    const contentBg = isDark ? 'bg-[#0e121d] border-white/5' : 'bg-white border-slate-200';
    const stripBg = isDark ? 'bg-[#0b0e17] border-white/5' : 'bg-slate-100 border-slate-200';
    const tableHeaderBg = isDark ? 'bg-[#0b0e17] text-slate-400 border-white/5' : 'bg-slate-100 text-slate-600 border-slate-200';
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
                            <span className="text-sm font-black tracking-tight text-white">
                                Semester {selectedSemester}
                            </span>
                            {selectedSemester === currentSemester && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                                    CURRENT
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                            Academic Result
                        </span>
                    </div>

                    {/* Subtle Divider */}
                    <div className="h-[1px] bg-white/5 w-full" />

                    {/* Navigation Groups: CIE, SEE, OVERVIEW */}
                    <div className="flex flex-col gap-3">
                        {/* MARKS */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 font-mono">
                                MARKS
                            </span>
                            <SidebarNavButton
                                icon={ClipboardCheck}
                                label="CIE"
                                active={activeSidebarTab === 'cie'}
                                onClick={() => setActiveSidebarTab('cie')}
                            />
                            <SidebarNavButton
                                icon={FileText}
                                label="SEE"
                                active={activeSidebarTab === 'see'}
                                onClick={() => setActiveSidebarTab('see')}
                            />
                        </div>

                        {/* RESULT */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 font-mono">
                                RESULT
                            </span>
                            <SidebarNavButton
                                icon={LayoutDashboard}
                                label="Overview"
                                active={activeSidebarTab === 'overview'}
                                onClick={() => setActiveSidebarTab('overview')}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Semesters */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
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
                                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                                }`}
                            >
                                {sem}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════════════════════
                1B. MOBILE HEADER & NAVIGATION (< 768px)
            ══════════════════════════════════════════════════════════════════ */}
            <div className={`md:hidden flex flex-col shrink-0 border-b z-10 ${sidebarBg}`}>
                {/* Semester Title & Switcher Row */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#090d16]/80">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black tracking-tight text-white">
                            Semester {selectedSemester}
                        </span>
                        {selectedSemester === currentSemester && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                                CURRENT
                            </span>
                        )}
                        <span className="text-[11px] font-medium text-slate-400">
                            · Result
                        </span>
                    </div>

                    {/* Semester Switcher Pills */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 font-mono uppercase mr-0.5">
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
                                        : 'bg-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.1]'
                                }`}
                            >
                                {sem}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Segmented Tab Controls: CIE, SEE, Overview */}
                <div className="flex items-center gap-1 p-2 bg-[#0c101a]">
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('cie')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'cie'
                                ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium'
                        }`}
                    >
                        <ClipboardCheck size={13} className={activeSidebarTab === 'cie' ? 'text-purple-400' : 'text-slate-500'} />
                        <span>CIE</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('see')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'see'
                                ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium'
                        }`}
                    >
                        <FileText size={13} className={activeSidebarTab === 'see' ? 'text-purple-400' : 'text-slate-500'} />
                        <span>SEE</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSidebarTab('overview')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            activeSidebarTab === 'overview'
                                ? 'bg-purple-600/25 text-purple-200 border border-purple-500/40 shadow-sm font-bold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent font-medium'
                        }`}
                    >
                        <LayoutDashboard size={13} className={activeSidebarTab === 'overview' ? 'text-purple-400' : 'text-slate-500'} />
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
                        <span className="text-xs font-semibold text-slate-300">Loading semester result...</span>
                    </div>
                ) : error ? (
                    <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/30 text-center flex flex-col items-center justify-center gap-3">
                        <AlertCircle size={24} className="text-red-400" />
                        <div className="text-xs font-bold text-white">Unable to load semester result</div>
                        <p className="text-xs text-slate-400 max-w-md">{error}</p>
                        <button
                            onClick={() => fetchResults(selectedSemester)}
                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className={`p-12 rounded-xl border ${contentBg} text-center flex flex-col items-center justify-center gap-2 text-slate-400`}>
                        <span className="text-xs font-bold text-slate-300">No subjects registered for Semester {selectedSemester}</span>
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
                                        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
                                            CIE
                                        </h1>
                                        <span className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 block">
                                            Internal Assessment · {scheme}
                                        </span>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                        <span>Semester {selectedSemester}</span>
                                    </div>
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className="flex md:hidden items-center justify-between text-[11px] text-slate-400 font-mono -mt-1 px-0.5">
                                    <span className="text-purple-400/90 font-medium">⚡ Tap subject row to edit marks</span>
                                    <span className="text-slate-500">⇄ Swipe table</span>
                                </div>

                                {/* CIE Table */}
                                <CieTableSection 
                                    subjects={subjects}
                                    onSelectSubject={(sub) => setCieDrawerSubject(sub)}
                                    contentBg={contentBg}
                                    tableHeaderBg={tableHeaderBg}
                                    borderSubtle={borderSubtle}
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
                                        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
                                            SEE
                                        </h1>
                                        <span className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 block">
                                            Semester End Examination · {scheme}
                                        </span>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                        <span>Semester {selectedSemester}</span>
                                    </div>
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className="flex md:hidden items-center justify-between text-[11px] text-slate-400 font-mono -mt-1 px-0.5">
                                    <span className="text-purple-400/90 font-medium">⚡ Tap subject row to edit SEE marks</span>
                                    <span className="text-slate-500">⇄ Swipe table</span>
                                </div>

                                {/* SEE Table */}
                                <SeeTableSection 
                                    subjects={subjects}
                                    onSelectSubject={(sub) => setSeeDrawerSubject(sub)}
                                    contentBg={contentBg}
                                    tableHeaderBg={tableHeaderBg}
                                    borderSubtle={borderSubtle}
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
                                        <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white">
                                            Semester Result
                                        </h1>
                                        <span className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 block">
                                            {scheme} · Semester {selectedSemester}
                                        </span>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                        <span>Semester {selectedSemester}</span>
                                        {selectedSemester === currentSemester && (
                                            <>
                                                <span>·</span>
                                                <span className="text-purple-400 font-semibold">Current</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* CSES Summary Strip - Responsive Grid on Mobile */}
                                <div className={`rounded-lg border p-3 md:px-4 md:py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 font-mono text-xs ${stripBg}`}>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[11px] md:text-xs">
                                        <span className="font-bold text-slate-200">SEM {selectedSemester}</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-slate-400 uppercase">{scheme}</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-slate-300 font-bold">{totalSubjects} SUBJECTS</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-emerald-400 font-bold">{passedSubjects} PASSED</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-red-400 font-bold">{failedSubjects} FAIL/NE</span>
                                        <span className="text-slate-600">·</span>
                                        <span className="text-purple-300 font-bold">{totalCreditsAttempted} CREDITS</span>
                                    </div>

                                    <div className="self-start sm:self-auto flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <CheckCircle2 size={11} />
                                        Result Evaluated
                                    </div>
                                </div>

                                {/* Mobile Interaction Hint */}
                                <div className="flex md:hidden items-center justify-between text-[11px] text-slate-400 font-mono -mt-1 px-0.5">
                                    <span className="text-purple-400/90 font-medium">⚡ Tap subject row to view breakdown</span>
                                    <span className="text-slate-500">⇄ Swipe table</span>
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
function SidebarNavButton({ icon: Icon, label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                active
                    ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
            }`}
        >
            <Icon size={14} className={active ? 'text-purple-400' : 'text-slate-400'} />
            <span>{label}</span>
        </button>
    );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE 1: OVERVIEW TABLE (What is my semester result?)
══════════════════════════════════════════════════════════════════════════════ */
function OverviewTableSection({ subjects, expandedRows, toggleRow, contentBg, tableHeaderBg, borderSubtle, isDark }) {
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
                                                ? (isDark ? 'bg-purple-950/20' : 'bg-purple-50/60') 
                                                : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                                        }`}
                                    >
                                        {/* # */}
                                        <td className="py-2 px-3 text-center text-slate-500 text-[11px]">
                                            {String(idx + 1).padStart(2, '0')}
                                        </td>

                                        {/* Subject */}
                                        <td className="py-2 px-3 font-sans">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-slate-200">
                                                    {sub.name || sub.subjectName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    <span className="text-purple-400 font-semibold">{code}</span>
                                                    {' · '}
                                                    <span>{cleanGroupName}</span>
                                                </span>
                                            </div>
                                        </td>

                                        {/* Credits */}
                                        <td className="py-2 px-2 text-center font-bold text-slate-300">
                                            {isNcmc ? '0' : sub.credits}
                                        </td>

                                        {/* CIE */}
                                        <td className="py-2 px-3 text-center font-bold">
                                            {cie.status === 'NOT_ENTERED' ? (
                                                <span className="text-slate-500 font-normal">—</span>
                                            ) : (
                                                <span className="text-cyan-400">{cie.score} / {cie.max}</span>
                                            )}
                                        </td>

                                        {/* SEE */}
                                        <td className="py-2 px-3 text-center font-bold">
                                            {!sub.see?.enabled || isNcmc ? (
                                                <span className="text-slate-500 font-normal">N/A</span>
                                            ) : see.status === 'NOT_ENTERED' ? (
                                                <span className="text-slate-500 font-normal">—</span>
                                            ) : (
                                                <span className="text-indigo-300">{see.scaledScore} / {see.max}</span>
                                            )}
                                        </td>

                                        {/* TOTAL */}
                                        <td className="py-2 px-3 text-center font-black">
                                            {cie.status === 'NOT_ENTERED' || (!isNcmc && see.status === 'NOT_ENTERED') ? (
                                                <span className="text-slate-500 font-normal">—</span>
                                            ) : (
                                                <span className="text-slate-100">{sub.aggregate?.obtained} / {sub.aggregate?.max || 100}</span>
                                            )}
                                        </td>

                                        {/* GRADE */}
                                        <td className="py-2 px-3 text-center">
                                            <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                                                sub.grade?.letter === 'F' || sub.grade?.letter === 'NP' || sub.grade?.letter === 'NE'
                                                    ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            }`}>
                                                {sub.grade?.letter || '—'}
                                            </span>
                                        </td>

                                        {/* GP */}
                                        <td className="py-2 px-2 text-center font-bold text-slate-300">
                                            {sub.grade?.gradePoint ?? 0}
                                        </td>

                                        {/* STATUS */}
                                        <td className="py-2 px-3 text-center">
                                            {!isEligible ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
                                                    NOT ELIGIBLE
                                                </span>
                                            ) : !isPassed ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/15 text-red-400 border border-red-500/30">
                                                    FAIL
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                    PASS
                                                </span>
                                            )}
                                        </td>

                                        {/* Chevron */}
                                        <td className="py-2 px-2 text-center text-slate-500">
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </td>
                                    </tr>

                                    {/* Inline Row Expansion */}
                                    {isExpanded && (
                                        <tr className={isDark ? 'bg-black/30' : 'bg-slate-100/50'}>
                                            <td colSpan={10} className="p-3.5">
                                                <InlineDetails sub={sub} isNcmc={isNcmc} cie={cie} see={see} />
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
function CieTableSection({ subjects, onSelectSubject, contentBg, tableHeaderBg, borderSubtle }) {
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
                            const isNcmc = sub.credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc');
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
                                    className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                                    title="Click to enter/edit marks"
                                >
                                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-2.5 px-3 font-sans">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs text-slate-200 group-hover:text-purple-300 transition-colors">
                                                    {sub.name || sub.subjectName}
                                                </span>
                                                <Edit3 size={11} className="text-slate-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                <span className="text-purple-400 font-semibold">{code}</span>
                                                {' · '}
                                                <span>{cleanGroupName}</span>
                                            </span>
                                        </div>
                                    </td>

                                    {/* TESTS */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                        {parts.tests !== '—' ? (
                                            <span className="text-slate-200 font-semibold">{parts.tests}</span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>

                                    {/* QUIZZES */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                        {parts.quizzes !== '—' ? (
                                            <span className="text-slate-200 font-semibold">{parts.quizzes}</span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>

                                    {/* ASSIGNMENTS */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                        {parts.assignments !== '—' ? (
                                            <span className="text-slate-200 font-semibold">{parts.assignments}</span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>

                                    {/* LABS */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                        {parts.labs !== '—' ? (
                                            <span className="text-slate-200 font-semibold">{parts.labs}</span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>

                                    {/* LAB TEST */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-300">
                                        {parts.labTest !== '—' ? (
                                            <span className="text-slate-200 font-semibold">{parts.labTest}</span>
                                        ) : (
                                            <span className="text-slate-500">—</span>
                                        )}
                                    </td>

                                    {/* CIE TOTAL */}
                                    <td className="py-2.5 px-3 text-right font-bold text-cyan-400">
                                        {cie.status === 'NOT_ENTERED' ? (
                                            <span className="text-slate-500 font-normal">—</span>
                                        ) : (
                                            <span>{Number(cie.score).toFixed(2)} / {cie.max}</span>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-2.5 px-3 text-center">
                                        {cie.status === 'NOT_ENTERED' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                                                NOT ENTERED
                                            </span>
                                        ) : cie.status === 'PARTIAL' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                                PARTIAL
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
function SeeTableSection({ subjects, onSelectSubject, contentBg, tableHeaderBg, borderSubtle }) {
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
                                    className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                                    title={isNcmc ? 'SEE not applicable for NCMC' : 'Click to enter/edit SEE marks'}
                                >
                                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td className="py-2.5 px-3 font-sans">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-xs text-slate-200 group-hover:text-purple-300 transition-colors">
                                                    {sub.name || sub.subjectName}
                                                </span>
                                                {!isNcmc && sub.see?.enabled && (
                                                    <Edit3 size={11} className="text-slate-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                <span className="text-purple-400 font-semibold">{code}</span>
                                                {' · '}
                                                <span>{cleanGroupName}</span>
                                            </span>
                                        </div>
                                    </td>

                                    {/* SEE MARKS */}
                                    <td className="py-2.5 px-3 text-right font-bold text-indigo-300">
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className="text-slate-500 font-normal">—</span>
                                        ) : see.status === 'NOT_ENTERED' ? (
                                            <span className="text-slate-500 font-normal">—</span>
                                        ) : (
                                            <span>{see.rawMarks !== null ? see.rawMarks : see.scaledScore}</span>
                                        )}
                                    </td>

                                    {/* MAXIMUM (Rule-driven) */}
                                    <td className="py-2.5 px-3 text-right font-medium text-slate-400">
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className="text-slate-500 italic">Disabled / Not Applicable</span>
                                        ) : (
                                            <span>/{see.rawMax || 100}</span>
                                        )}
                                    </td>

                                    {/* STATUS */}
                                    <td className="py-2.5 px-3 text-center">
                                        {isNcmc || !sub.see?.enabled ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                                                Not Applicable
                                            </span>
                                        ) : see.status === 'NOT_ENTERED' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400">
                                                Not Entered
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
function InlineDetails({ sub, isNcmc, cie, see }) {
    const isIpcc = sub.evaluationGroup?.toLowerCase().includes('ipcc') || sub.partitions?.length > 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {/* Left: Components */}
            <div className="flex flex-col gap-2 p-3 rounded bg-black/20 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Component Evaluation
                </span>
                <div className="flex flex-col gap-1.5">
                    {sub.components?.filter(c => !c.key?.includes('SEE')).map((c) => (
                        <div key={c.key} className="flex items-center justify-between py-0.5 border-b border-white/[0.03]">
                            <span className="text-slate-300">{c.name || c.key}</span>
                            <span className="font-bold">
                                {c.status === 'NOT_ENTERED' || c.rawMarks === null ? (
                                    <span className="text-slate-500">—</span>
                                ) : (
                                    <span className="text-cyan-400">
                                        {c.rawMarks} / {c.rawMaxMarks}
                                        {c.normalizedMarks !== null && c.normalizedMarks !== c.rawMarks && (
                                            <span className="text-slate-500 text-[10px] ml-1">
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
            <div className="flex flex-col gap-2 p-3 rounded bg-black/20 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Eligibility &amp; Partitions
                </span>

                {isIpcc && sub.partitions && sub.partitions.length > 0 && (
                    <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.03]">
                        {sub.partitions.map((p) => (
                            <div key={p.key} className="flex items-center justify-between">
                                <span className="text-slate-300">{p.name || p.key} Partition:</span>
                                <span className={p.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                    {p.score} / {p.max} {p.minRequired ? `(Min ${p.minRequired} req)` : ''}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-slate-400">Eligibility Status:</span>
                    <span className={sub.eligibility?.eligible !== false ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {sub.eligibility?.eligible !== false ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                </div>

                {sub.eligibility?.reasons && sub.eligibility.reasons.length > 0 && (
                    <div className="mt-1 p-2 rounded bg-red-950/30 border border-red-500/20 text-[11px] text-red-300">
                        {sub.eligibility.reasons.map((r, i) => (
                            <div key={i}>• {r}</div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">SEE Scaled:</span>
                    <span className="font-bold text-indigo-300">
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

function CieDrawerRow({ label, rawValue, rawMax, reducedMax, onChange, disabled = false, helperText = null }) {
    const isInvalid = rawValue !== '' && rawValue !== null && rawValue !== undefined && !isNaN(Number(rawValue)) && (Number(rawValue) < 0 || Number(rawValue) > rawMax);
    const reduced = isInvalid ? null : calcReduced(rawValue, rawMax, reducedMax);
    const hasValue = reduced !== null;

    return (
        <div className="flex flex-col py-2 border-b border-white/[0.04] last:border-0">
            <div className="flex items-center justify-between gap-2">
                {/* Component Label */}
                <span className="w-32 sm:w-36 text-xs font-semibold text-slate-200">
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
                        className={`w-16 bg-black/50 border ${isInvalid ? 'border-red-500 text-red-300' : 'border-white/10 focus:border-purple-500 text-white'} rounded px-2 py-1 text-xs text-right font-mono focus:outline-none transition-colors`}
                    />
                    <span className="text-xs text-slate-500 font-mono w-10">/ {rawMax}</span>
                </div>

                {/* Arrow */}
                <span className="w-5 text-slate-600 font-mono text-center text-xs">→</span>

                {/* Calculated Reduced Contribution: reduced / reducedMax (READ-ONLY) */}
                <div className="w-24 text-right font-mono text-xs pr-1">
                    {isInvalid ? (
                        <span className="text-red-400 font-bold text-[10px]">
                            Max {rawMax}
                        </span>
                    ) : hasValue ? (
                        <span className="text-cyan-400 font-bold">
                            {reduced.toFixed(2)}{' '}
                            <span className="text-slate-500 font-normal">/ {reducedMax}</span>
                        </span>
                    ) : (
                        <span className="text-slate-500 font-normal">
                            —{' '}
                            <span className="text-slate-600">/ {reducedMax}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Inline Helper Text if provided */}
            {helperText && (
                <span className="text-[10px] text-slate-400 italic mt-1 font-sans pl-0.5">
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

function CieMarksDrawer({ subject, semester, onClose, onSaveSuccess }) {
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
            const rT1 = calcReduced(marks.test1, 50, 8.5);
            const rT2 = calcReduced(marks.test2, 50, 8.5);
            const rQ1 = calcReduced(marks.quiz1, 20, 2);
            const rQ2 = calcReduced(marks.quiz2, 20, 2);
            const rA1 = calcReduced(marks.assignment1, 20, 2);
            const rA2 = calcReduced(marks.assignment2, 20, 2);
            const thItems = [rT1, rT2, rQ1, rQ2, rA1, rA2].filter(r => r !== null);
            const thHasEntered = thItems.length > 0;
            const thScore = thHasEntered ? Math.min(25, Math.round(thItems.reduce((a, b) => a + b, 0) * 100) / 100) : null;

            const rLabRec = calcReduced(marks.labRecord, 350, 15);
            const rLabT = calcReduced(marks.labTest, 15, 10);
            const prItems = [rLabRec, rLabT].filter(r => r !== null);
            const prHasEntered = prItems.length > 0;
            const prScore = prHasEntered ? Math.min(25, Math.round(prItems.reduce((a, b) => a + b, 0) * 100) / 100) : null;

            const hasAny = thHasEntered || prHasEntered;
            const total = hasAny ? Math.round(((thScore || 0) + (prScore || 0)) * 100) / 100 : null;

            const theoryPassed = thScore !== null ? thScore >= 10 : null;
            const practicalPassed = prScore !== null ? prScore >= 10 : null;
            const isEligible = hasAny && (theoryPassed !== false) && (practicalPassed !== false) && (total !== null && total >= 20);

            return {
                totalCie: total,
                maxCie: 50,
                theorySubtotal: thScore,
                practicalSubtotal: prScore,
                theoryPassed,
                practicalPassed,
                isEligible,
                status: !hasAny ? 'NOT_ENTERED' : (theoryPassed === false || practicalPassed === false || (total !== null && total < 20)) ? 'BELOW_MINIMUM' : 'ELIGIBLE'
            };
        }

        // Generic Dynamic Calculation from comps list
        let sumReduced = 0;
        let hasAnyInput = false;

        comps.forEach(c => {
            const count = c.entryCount || 1;
            const rawMaxEach = c.entryMaxRaw || c.rawMaxMarks || 50;
            const reducedMaxEach = c.entryMaxReduced || (c.targetMax ? (c.targetMax / count) : 25);

            for (let i = 0; i < count; i++) {
                const mapKey = getComponentKeyMapping(c.key, i);
                const rawVal = marks[c.key] !== undefined && marks[c.key] !== '' ? marks[c.key] : marks[mapKey];
                const red = calcReduced(rawVal, rawMaxEach, reducedMaxEach);
                if (red !== null) {
                    sumReduced += red;
                    hasAnyInput = true;
                }
            }
        });

        const maxCie = subject.cie?.max || 50;
        const total = hasAnyInput ? Math.min(maxCie, Math.round(sumReduced * 100) / 100) : null;

        return {
            totalCie: total,
            maxCie,
            status: total !== null ? (total >= (maxCie * 0.4) ? 'ELIGIBLE' : 'BELOW_MINIMUM') : 'NOT_ENTERED'
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
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg bg-[#0c101a] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black text-white tracking-tight">
                            {subject.name || subject.subjectName}
                        </h2>
                        <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                            <span className="text-purple-400 font-semibold">{subject.code}</span> · {subject.evaluationGroup || subject.pattern}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 rounded-md bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* Header Columns Guide */}
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-white/10">
                        <span className="w-28">Component</span>
                        <span className="flex-1 text-center">Entered (Raw)</span>
                        <span className="w-5"></span>
                        <span className="w-24 text-right pr-1">Reduced</span>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        NCMC NON-CREDIT EVALUATION
                    ───────────────────────────────────────────────────────────── */}
                    {isNcmc ? (
                        <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                                Non-Credit Continuous Evaluation
                            </span>
                            <CieDrawerRow 
                                label="Completion Score"
                                rawValue={marks.cie}
                                rawMax={100}
                                reducedMax={100}
                                onChange={val => setMarks({ ...marks, cie: val })}
                            />
                            <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-400">Passing Requirement:</span>
                                <span className={totals.status?.includes('PP') ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
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
                            <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/30 border border-white/5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                                        Theory Partition (Max 25)
                                    </span>
                                    {totals.theorySubtotal !== null && (
                                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                            totals.theoryPassed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
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
                                />
                                <CieDrawerRow 
                                    label="Internal Test 2"
                                    rawValue={marks.test2}
                                    rawMax={50}
                                    reducedMax={8.5}
                                    onChange={val => setMarks({ ...marks, test2: val })}
                                />
                                <CieDrawerRow 
                                    label="Quiz 1"
                                    rawValue={marks.quiz1}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, quiz1: val })}
                                />
                                <CieDrawerRow 
                                    label="Quiz 2"
                                    rawValue={marks.quiz2}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, quiz2: val })}
                                />
                                <CieDrawerRow 
                                    label="Assignment 1"
                                    rawValue={marks.assignment1}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, assignment1: val })}
                                />
                                <CieDrawerRow 
                                    label="Assignment 2"
                                    rawValue={marks.assignment2}
                                    rawMax={20}
                                    reducedMax={2}
                                    onChange={val => setMarks({ ...marks, assignment2: val })}
                                />

                                <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                    <span>Gate requirement:</span>
                                    <span className="text-amber-400">Min 10.0 Theory CIE required</span>
                                </div>
                            </div>

                            {/* PRACTICAL PARTITION */}
                            <div className="flex flex-col gap-2 p-3 rounded-lg bg-black/30 border border-white/5">
                                <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">
                                        Practical Partition (Max 25)
                                    </span>
                                    {totals.practicalSubtotal !== null && (
                                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                            totals.practicalPassed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
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
                                />

                                {/* Sub-Activity Helper Trigger for IPCC Lab */}
                                <button
                                    type="button"
                                    onClick={() => setShowLabCalculator(!showLabCalculator)}
                                    className="self-start text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors"
                                >
                                    <Calculator size={12} />
                                    <span>{showLabCalculator ? 'Hide activity breakdown' : 'Calculate from lab activities (e.g. IDTE 1, 2, 3)'}</span>
                                </button>

                                {showLabCalculator && (
                                    <div className="p-2.5 rounded bg-black/40 border border-purple-500/20 flex flex-col gap-2 font-mono text-xs">
                                        <span className="text-[10px] font-bold uppercase text-purple-300">
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
                                                    className="w-32 bg-transparent text-slate-300 text-[11px] focus:outline-none border-b border-white/5"
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
                                                        className="w-14 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                                    />
                                                    <span className="text-slate-500">/</span>
                                                    <input
                                                        type="number"
                                                        value={act.max}
                                                        onChange={e => {
                                                            const next = [...labActivities];
                                                            next[i].max = e.target.value;
                                                            setLabActivities(next);
                                                        }}
                                                        className="w-12 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-slate-400"
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setLabActivities([...labActivities, { id: Date.now(), name: `Activity ${labActivities.length + 1}`, score: '', max: 10 }])}
                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                            >
                                                <Plus size={11} />
                                                <span>Add Activity</span>
                                            </button>
                                            <div className="text-[11px] font-bold text-slate-200">
                                                Sum: <span className="text-purple-300">{labActivityTotalScore} / {labActivityTotalMax}</span>
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
                                />

                                {/* Multi-Test Averager Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setShowLabTestAverager(!showLabTestAverager)}
                                    className="self-start text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                                >
                                    <Calculator size={12} />
                                    <span>{showLabTestAverager ? 'Hide test averager' : 'Average 2 Lab Tests (e.g. 42 + 46 / 2)'}</span>
                                </button>

                                {showLabTestAverager && (
                                    <div className="p-2.5 rounded bg-black/40 border border-cyan-500/20 flex flex-col gap-2 font-mono text-xs">
                                        <span className="text-[10px] font-bold uppercase text-cyan-300">
                                            Lab Tests Auto-Averager
                                        </span>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-300">Test 1:</span>
                                            <input
                                                type="number"
                                                placeholder="e.g. 42"
                                                value={labTestValues.t1}
                                                onChange={e => setLabTestValues({ ...labTestValues, t1: e.target.value })}
                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-300">Test 2:</span>
                                            <input
                                                type="number"
                                                placeholder="e.g. 46"
                                                value={labTestValues.t2}
                                                onChange={e => setLabTestValues({ ...labTestValues, t2: e.target.value })}
                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                                            <span className="text-slate-400">Scale / Max:</span>
                                            <input
                                                type="number"
                                                value={labTestValues.scaleMax}
                                                onChange={e => setLabTestValues({ ...labTestValues, scaleMax: e.target.value })}
                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-slate-300"
                                            />
                                        </div>
                                        {calculatedLabTestAvg !== null && (
                                            <div className="text-[11px] font-bold text-cyan-300 text-center py-1">
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

                                <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                                    <span>Gate requirement:</span>
                                    <span className="text-amber-400">Min 10.0 Practical CIE required</span>
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
                                    <div key={comp.key} className="flex flex-col gap-1 p-3 rounded-lg bg-black/30 border border-white/5">
                                        <div className="flex items-center justify-between pb-1 border-b border-white/5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 font-mono">
                                                {comp.name} (Max {targetMax})
                                            </span>
                                            {compHasEntry && (
                                                <span className="text-[10px] font-bold font-mono text-cyan-300">
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
                                                />
                                            );
                                        })}

                                        {/* Optional Sub-Activity Auto-Calculator for Lab Conduction */}
                                        {isLabConduction && (
                                            <div className="pt-1 flex flex-col gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowLabCalculator(!showLabCalculator)}
                                                    className="self-start text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors"
                                                >
                                                    <Calculator size={12} />
                                                    <span>{showLabCalculator ? 'Hide activity breakdown' : 'Calculate from lab activities (e.g. IDTE 1, 2, 3)'}</span>
                                                </button>

                                                {showLabCalculator && (
                                                    <div className="p-2.5 rounded bg-black/40 border border-purple-500/20 flex flex-col gap-2 font-mono text-xs">
                                                        <span className="text-[10px] font-bold uppercase text-purple-300">
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
                                                                    className="w-32 bg-transparent text-slate-300 text-[11px] focus:outline-none border-b border-white/5"
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
                                                                        className="w-14 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                                                    />
                                                                    <span className="text-slate-500">/</span>
                                                                    <input
                                                                        type="number"
                                                                        value={act.max}
                                                                        onChange={e => {
                                                                            const next = [...labActivities];
                                                                            next[i].max = e.target.value;
                                                                            setLabActivities(next);
                                                                        }}
                                                                        className="w-12 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-slate-400"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setLabActivities([...labActivities, { id: Date.now(), name: `Activity ${labActivities.length + 1}`, score: '', max: 10 }])}
                                                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                                            >
                                                                <Plus size={11} />
                                                                <span>Add Activity</span>
                                                            </button>
                                                            <div className="text-[11px] font-bold text-slate-200">
                                                                Sum: <span className="text-purple-300">{labActivityTotalScore} / {labActivityTotalMax}</span>
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
                                                    className="self-start text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                                                >
                                                    <Calculator size={12} />
                                                    <span>{showLabTestAverager ? 'Hide test averager' : 'Average 2 Lab Tests (e.g. 42 + 46 / 2)'}</span>
                                                </button>

                                                {showLabTestAverager && (
                                                    <div className="p-2.5 rounded bg-black/40 border border-cyan-500/20 flex flex-col gap-2 font-mono text-xs">
                                                        <span className="text-[10px] font-bold uppercase text-cyan-300">
                                                            Lab Tests Auto-Averager
                                                        </span>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-300">Test 1:</span>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 42"
                                                                value={labTestValues.t1}
                                                                onChange={e => setLabTestValues({ ...labTestValues, t1: e.target.value })}
                                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-slate-300">Test 2:</span>
                                                            <input
                                                                type="number"
                                                                placeholder="e.g. 46"
                                                                value={labTestValues.t2}
                                                                onChange={e => setLabTestValues({ ...labTestValues, t2: e.target.value })}
                                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-white"
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                                                            <span className="text-slate-400">Scale / Max:</span>
                                                            <input
                                                                type="number"
                                                                value={labTestValues.scaleMax}
                                                                onChange={e => setLabTestValues({ ...labTestValues, scaleMax: e.target.value })}
                                                                className="w-16 bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-right text-slate-300"
                                                            />
                                                        </div>
                                                        {calculatedLabTestAvg !== null && (
                                                            <div className="text-[11px] font-bold text-cyan-300 text-center py-1">
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
                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between font-mono">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Calculated CIE</span>
                            <span className="text-[10px] text-slate-500">
                                {isNcmc ? 'Min 40 required to Pass' : 'Min 20.0 required for SEE eligibility'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {totals.totalCie !== null && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                                    isNcmc
                                        ? (totals.totalCie >= 40 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300')
                                        : isIpcc
                                            ? (totals.isEligible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')
                                            : (totals.totalCie >= 20 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')
                                }`}>
                                    {isNcmc 
                                        ? (totals.totalCie >= 40 ? 'PASSED (PP)' : 'NOT PASSED')
                                        : isIpcc
                                            ? (totals.theoryPassed === false ? 'THEORY < 10' : totals.practicalPassed === false ? 'PRACTICAL < 10' : totals.totalCie < 20 ? 'CIE < 20' : 'ELIGIBLE')
                                            : (totals.totalCie >= 20 ? 'ELIGIBLE' : 'BELOW 20')
                                    }
                                </span>
                            )}
                            <span className="text-sm font-black text-cyan-400">
                                {totals.totalCie !== null ? `${totals.totalCie.toFixed(2)} / ${totals.maxCie}` : `— / ${totals.maxCie}`}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-white transition-colors"
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
function SeeMarksDrawer({ subject, semester, onClose, onSaveSuccess }) {
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
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-[#0c101a] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight">
                            {subject.name || subject.subjectName}
                        </h2>
                        <span className="text-[11px] text-slate-400 font-mono">
                            <span className="text-purple-400 font-semibold">{subject.code}</span> · {subject.evaluationGroup || subject.pattern}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-md bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                        SEE MARKS
                    </span>

                    {isNcmc || !subject.see?.enabled ? (
                        <div className="p-4 rounded-lg bg-black/30 border border-white/5 text-slate-400 text-xs">
                            <span className="font-bold text-slate-300 block mb-1">Not applicable</span>
                            This evaluation rule does not have a Semester End Examination component.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-black/30 border border-white/5">
                            <label className="text-xs font-semibold text-slate-200">
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
                                    className="w-28 bg-black/40 border border-white/10 focus:border-purple-500 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                                />
                                <span className="text-xs text-slate-400 font-mono">/ {rawMax}</span>
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono flex flex-col gap-0.5 pt-1">
                                <span>Maximum marks: {rawMax}</span>
                                <span className="text-indigo-300 font-bold">
                                    Evaluated SEE: {evaluatedSee()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded text-xs font-semibold text-slate-400 hover:text-white transition-colors"
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
