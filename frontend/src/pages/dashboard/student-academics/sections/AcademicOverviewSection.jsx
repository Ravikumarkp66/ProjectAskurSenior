import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronDown, RefreshCw, CheckCircle2, AlertTriangle, 
    AlertCircle, Lock
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';
import { AuthContext } from '../../../../context/AuthContext';
import { apiV2 } from '../../../../services/authService';
import { DUMMY_ACADEMIC_OVERVIEW } from '../academicDummyData';

const AcademicOverviewSection = ({ isPreview: propIsPreview }) => {
    const navigate = useNavigate();
    const { isDark = true } = useTheme?.() || { isDark: true };
    const auth = useContext(AuthContext);

    // If propIsPreview is specified, it takes priority.
    // If auth context is present, check hasPlusAccess.
    // If auth is null (e.g. running in isolated unit tests without AuthProvider), default to true.
    const hasPlusAccess = propIsPreview !== undefined
        ? !propIsPreview
        : (auth ? Boolean(auth.hasPlusAccess) : true);

    const { 
        profile, 
        currentSemester, 
        selectedSemester,
        selectSemester,
        semestersData, 
        registeredSubjects: contextRegisteredSubjects, 
        timetableConfig, 
    } = useStudentAcademics();

    const [loading, setLoading] = useState(hasPlusAccess);
    const [localSemester, setLocalSemester] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [resultData, setResultData] = useState(() => {
        if (!hasPlusAccess) {
            return { ...DUMMY_ACADEMIC_OVERVIEW };
        }
        return null;
    });

    // Active semester defaults to selectedSemester or currentSemester or dummy default
    const activeSem = localSemester !== null 
        ? localSemester 
        : (selectedSemester || currentSemester || (!hasPlusAccess ? DUMMY_ACADEMIC_OVERVIEW.semester : 1));

    const fetchSemesterResults = async (sem, isRefresh = false) => {
        if (!hasPlusAccess) {
            setResultData({
                ...DUMMY_ACADEMIC_OVERVIEW,
                semester: sem || activeSem
            });
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const res = await apiV2.getStudentSemesterResults(sem);
            const payload = res.data?.data || res.data;
            if (payload && Array.isArray(payload.subjects)) {
                setResultData(payload);
            } else {
                setResultData({
                    semester: sem,
                    scheme: profile?.scheme?.name || 'Scheme 2025',
                    subjects: []
                });
            }
        } catch (err) {
            console.error('[AcademicOverviewSection] Error fetching results:', err);
            setError(err.response?.data?.message || err.message || 'Unable to load academic sheet.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!hasPlusAccess) {
            setResultData({
                ...DUMMY_ACADEMIC_OVERVIEW,
                semester: activeSem
            });
            setLoading(false);
            setRefreshing(false);
            return;
        }

        let isCancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiV2.getStudentSemesterResults(activeSem);
                if (isCancelled) return;
                const payload = res.data?.data || res.data;
                if (payload && Array.isArray(payload.subjects)) {
                    setResultData(payload);
                } else {
                    setResultData({
                        semester: activeSem,
                        scheme: profile?.scheme?.name || 'Scheme 2025',
                        subjects: []
                    });
                }
            } catch (err) {
                if (isCancelled) return;
                console.error('[AcademicOverviewSection] Error fetching results:', err);
                setError(err.response?.data?.message || err.message || 'Unable to load academic sheet.');
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        };

        load();

        return () => {
            isCancelled = true;
        };
    }, [activeSem, hasPlusAccess, profile?.scheme?.name]);

    // Subjects list
    const subjects = useMemo(() => {
        if (resultData?.subjects && resultData.subjects.length > 0) {
            return resultData.subjects;
        }
        return (contextRegisteredSubjects || []).map((reg, idx) => ({
            code: reg.customCode || reg.subject?.code || `SUB${idx + 1}`,
            name: reg.customName || reg.subject?.name || 'Subject',
            credits: reg.registeredCredits ?? reg.subject?.credits ?? 0,
            category: reg.category || 'Theory',
            pattern: 'Standard Theory',
            cie: { obtained: null, max: 50 },
            see: { marks: null, max: 50, enabled: true },
            aggregate: { marks: null, max: 100 },
            attendance: { percentage: null, status: 'NOT_AVAILABLE' },
            eligibility: { eligible: true, reasons: [] },
            grade: { letter: null, gradePoint: null },
            contributesToSGPA: true
        }));
    }, [resultData, contextRegisteredSubjects]);

    // Available semesters (1..currentSemester or resultData or dummy)
    const availableSemesters = useMemo(() => {
        if (resultData?.availableSemesters && resultData.availableSemesters.length > 0) {
            return resultData.availableSemesters;
        }
        if (!hasPlusAccess && DUMMY_ACADEMIC_OVERVIEW.availableSemesters) {
            return DUMMY_ACADEMIC_OVERVIEW.availableSemesters;
        }
        if (semestersData && semestersData.length > 0) {
            return semestersData.map(s => Number(s.number || s.semester)).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
        }
        const maxSem = Math.max(currentSemester || 1, 1);
        const sems = [];
        for (let i = 1; i <= maxSem; i++) sems.push(i);
        return sems;
    }, [resultData, semestersData, currentSemester, hasPlusAccess]);

    // Summary calculations (presentation aggregation only)
    const metrics = useMemo(() => {
        let totalCredits = 0;
        let earnedCredits = 0;
        let totalGradePoints = 0;
        let totalSgpaCredits = 0;
        let backlogsCount = 0;

        let totalAttendancePct = 0;
        let attendanceCount = 0;

        let totalCie = 0;
        let totalCieMax = 0;
        let cieCount = 0;

        subjects.forEach(sub => {
            const credits = Number(sub.credits) || 0;
            totalCredits += credits;

            const isNcmc = credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc') || sub.category === 'NCMC' || sub.see?.enabled === false;

            // Attendance
            if (sub.attendance?.percentage !== null && sub.attendance?.percentage !== undefined) {
                totalAttendancePct += Number(sub.attendance.percentage);
                attendanceCount += 1;
            }

            // CIE
            if (sub.cie?.obtained !== null && sub.cie?.obtained !== undefined) {
                totalCie += Number(sub.cie.obtained);
                totalCieMax += (Number(sub.cie.max) || 50);
                cieCount += 1;
            }

            // Grades & Credits
            const gradeLetter = sub.grade?.letter;
            const hasGrade = gradeLetter && gradeLetter !== 'PENDING' && gradeLetter !== 'NOT_ENTERED';

            if (hasGrade) {
                const isPass = isNcmc ? (gradeLetter === 'PP') : (gradeLetter !== 'F' && gradeLetter !== 'NP' && gradeLetter !== 'NE');
                if (isPass) {
                    earnedCredits += credits;
                } else {
                    backlogsCount += 1;
                }

                if (!isNcmc && sub.contributesToSGPA !== false && sub.grade?.gradePoint !== undefined && sub.grade.gradePoint !== null) {
                    totalGradePoints += credits * Number(sub.grade.gradePoint);
                    totalSgpaCredits += credits;
                }
            }
        });

        // SGPA calculation
        let sgpa = null;
        if (resultData?.summary?.sgpa !== undefined && resultData?.summary?.sgpa !== null) {
            sgpa = Number(resultData.summary.sgpa).toFixed(2);
        } else if (totalSgpaCredits > 0) {
            sgpa = (totalGradePoints / totalSgpaCredits).toFixed(2);
        }

        // CGPA
        const cgpa = resultData?.student?.cgpa ?? profile?.cgpa ?? resultData?.summary?.cgpa ?? null;
        const formattedCgpa = cgpa !== null && !isNaN(cgpa) ? Number(cgpa).toFixed(2) : '—';

        // Averages
        const avgAttendance = attendanceCount > 0 ? (totalAttendancePct / attendanceCount).toFixed(1) + '%' : '—';
        const avgCie = cieCount > 0 && totalCieMax > 0 
            ? `${(totalCie / cieCount).toFixed(1)} / ${(totalCieMax / cieCount).toFixed(0)}`
            : '—';

        return {
            sgpa: sgpa || '—',
            cgpa: formattedCgpa,
            creditsDisplay: `${earnedCredits} / ${totalCredits}`,
            backlogs: backlogsCount,
            attendance: avgAttendance,
            cie: avgCie,
            totalCredits,
            earnedCredits
        };
    }, [subjects, resultData, profile]);

    const schemeName = resultData?.scheme || profile?.scheme?.name || 'Scheme 2025';

    return (
        <div className={`w-full flex flex-col gap-4 font-sans ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {/* ══════════════════════════════════════════════════════════════════
                1. TOP HEADER (Extremely Compact)
            ══════════════════════════════════════════════════════════════════ */}
            <div className={`flex items-center justify-between gap-4 pb-2 border-b ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                    <h1 className={`text-lg md:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Academic Overview
                    </h1>
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Semester {activeSem} · {schemeName}
                    </span>
                    {!hasPlusAccess && (
                        <span 
                            title="Interactive preview mode with static dummy data"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                                isDark 
                                    ? 'bg-purple-950/30 border-purple-500/30 text-purple-300' 
                                    : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}
                        >
                            <Lock size={10} className="opacity-70" />
                            Preview
                        </span>
                    )}
                </div>

                {/* Right Controls: Semester Selector & Refresh */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={activeSem}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setLocalSemester(val);
                                if (selectSemester && hasPlusAccess) selectSemester(val);
                            }}
                            className={`appearance-none text-xs font-semibold rounded-md pl-2.5 pr-7 py-1 cursor-pointer focus:outline-none transition-colors ${
                                isDark
                                    ? 'bg-[#0e121d] hover:bg-[#131826] text-slate-200 border border-white/10 focus:border-purple-500/50'
                                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs focus:border-purple-500'
                            }`}
                        >
                            {availableSemesters.map((sem) => (
                                <option
                                    key={sem}
                                    value={sem}
                                    className={isDark ? 'bg-[#0e121d] text-white' : 'bg-white text-slate-800'}
                                >
                                    Semester {sem} {sem === currentSemester ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    </div>

                    <button
                        type="button"
                        onClick={() => !hasPlusAccess ? null : fetchSemesterResults(activeSem, true)}
                        disabled={!hasPlusAccess || loading || refreshing}
                        title={!hasPlusAccess ? "Data synchronization disabled in Preview mode" : "Sync Academic Data"}
                        className={`p-1.5 rounded-md transition-colors border ${
                            !hasPlusAccess ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        } ${
                            isDark
                                ? 'bg-[#0e121d] hover:bg-[#131826] border-white/10 text-slate-400 hover:text-white'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
                        }`}
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin text-purple-500' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading / Error States */}
            {loading ? (
                <div className={`py-16 text-center text-xs flex items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <RefreshCw size={14} className="animate-spin text-purple-500" />
                    <span>Loading academic sheet...</span>
                </div>
            ) : error ? (
                <div className={`p-4 rounded-lg border text-xs flex items-center justify-between ${
                    isDark
                        ? 'bg-red-950/20 border-red-500/30 text-red-300'
                        : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => fetchSemesterResults(activeSem)}
                        className={`px-2 py-0.5 rounded font-medium ${
                            isDark
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-white'
                                : 'bg-red-100 hover:bg-red-200 text-red-800'
                        }`}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════════════════════════════════════════
                        2. SUMMARY STRIP (Compact SaaS Toolbar - No Big Cards)
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className={`w-full overflow-x-auto rounded-lg px-4 py-2 flex items-center text-xs border ${
                        isDark
                            ? 'bg-[#0a0d16] border-white/[0.08] divide-x divide-white/[0.08]'
                            : 'bg-white border-slate-200 divide-x divide-slate-100 shadow-xs'
                    }`}>
                        {/* SGPA */}
                        <div className="flex flex-col pr-5 min-w-[75px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                SGPA
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {metrics.sgpa}
                            </span>
                        </div>

                        {/* CGPA */}
                        <div className="flex flex-col px-5 min-w-[75px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                CGPA
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {metrics.cgpa}
                            </span>
                        </div>

                        {/* Credits */}
                        <div className="flex flex-col px-5 min-w-[90px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Credits
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {metrics.creditsDisplay}
                            </span>
                        </div>

                        {/* Backlogs */}
                        <div className="flex flex-col px-5 min-w-[75px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Backlogs
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${
                                metrics.backlogs > 0 
                                    ? (isDark ? 'text-red-400' : 'text-red-600 font-bold') 
                                    : (isDark ? 'text-slate-200' : 'text-slate-800')
                            }`}>
                                {metrics.backlogs}
                            </span>
                        </div>

                        {/* Attendance */}
                        <div className="flex flex-col px-5 min-w-[90px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Attendance
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {metrics.attendance}
                            </span>
                        </div>

                        {/* CIE */}
                        <div className="flex flex-col pl-5 min-w-[90px]">
                            <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                CIE
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {metrics.cie}
                            </span>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        3. MAIN TABLE (CSES Problem Sheet / Academic Marks Sheet)
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className={`w-full rounded-lg border overflow-hidden ${
                        isDark ? 'border-white/[0.08] bg-[#07090e] shadow-sm' : 'border-slate-200 bg-white shadow-xs'
                    }`}>
                        <div className="overflow-x-auto">
                            <table className={`w-full text-left text-xs border-collapse ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <thead>
                                    <tr className={`border-b text-[10px] font-bold uppercase tracking-wider font-mono ${
                                        isDark
                                            ? 'bg-[#0c101a] border-white/[0.08] text-slate-400'
                                            : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}>
                                        <th className="py-2.5 px-3 min-w-[180px]">Subject</th>
                                        <th className="py-2.5 px-3 min-w-[85px]">Code</th>
                                        <th className="py-2.5 px-3 text-center min-w-[45px]">Cr</th>
                                        <th className="py-2.5 px-3 text-right min-w-[85px]">Attendance</th>
                                        <th className="py-2.5 px-3 text-right min-w-[75px]">CIE</th>
                                        <th className="py-2.5 px-3 text-right min-w-[75px]">SEE</th>
                                        <th className="py-2.5 px-3 text-center min-w-[90px]">Eligibility</th>
                                        <th className="py-2.5 px-3 text-center min-w-[65px]">Grade</th>
                                        <th className="py-2.5 px-3 text-right min-w-[85px]">Result</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                                    {subjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className={`py-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                No enrolled subjects recorded for Semester {activeSem}.
                                            </td>
                                        </tr>
                                    ) : (
                                        subjects.map((sub, idx) => {
                                            const credits = Number(sub.credits) || 0;
                                            const isNcmc = credits === 0 || sub.evaluationGroup?.toLowerCase().includes('ncmc') || sub.category === 'NCMC' || sub.see?.enabled === false;
                                            
                                            // Attendance
                                            const attPct = sub.attendance?.percentage !== null && sub.attendance?.percentage !== undefined
                                                ? Number(sub.attendance.percentage)
                                                : null;

                                            // CIE
                                            const cieVal = sub.cie?.obtained !== null && sub.cie?.obtained !== undefined
                                                ? Number(sub.cie.obtained)
                                                : null;
                                            const cieMax = Number(sub.cie?.max) || (isNcmc ? 100 : 50);

                                            // SEE (Adaptive: N/A for NCMC, never 0/0)
                                            const seeVal = sub.see?.marks !== null && sub.see?.marks !== undefined
                                                ? Number(sub.see.marks)
                                                : (sub.see?.obtained !== null && sub.see?.obtained !== undefined ? Number(sub.see.obtained) : null);
                                            const seeMax = Number(sub.see?.max) || 50;

                                            // Eligibility
                                            const isEligible = sub.eligibility?.eligible !== false;

                                            // Grade
                                            const gradeLetter = sub.grade?.letter;
                                            const gradePoint = sub.grade?.gradePoint !== undefined && sub.grade?.gradePoint !== null ? sub.grade.gradePoint : null;
                                            const hasGrade = gradeLetter && gradeLetter !== 'PENDING' && gradeLetter !== 'NOT_ENTERED';

                                            // Result
                                            let resultLabel = 'In Progress';
                                            let resultColor = isDark ? 'text-slate-400' : 'text-slate-500';

                                            if (!isEligible) {
                                                resultLabel = 'At Risk';
                                                resultColor = isDark ? 'text-amber-400' : 'text-amber-600 font-semibold';
                                            } else if (hasGrade) {
                                                if (isNcmc) {
                                                    resultLabel = gradeLetter === 'PP' ? 'Passed' : 'Not Passed';
                                                    resultColor = gradeLetter === 'PP' 
                                                        ? (isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-bold') 
                                                        : (isDark ? 'text-red-400 font-semibold' : 'text-red-600 font-bold');
                                                } else {
                                                    if (gradeLetter === 'F' || gradeLetter === 'NP' || gradeLetter === 'NE') {
                                                        resultLabel = gradeLetter === 'NE' ? 'Not Eligible' : 'Failed';
                                                        resultColor = isDark ? 'text-red-400 font-semibold' : 'text-red-600 font-bold';
                                                    } else {
                                                        resultLabel = 'Passed';
                                                        resultColor = isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-600 font-bold';
                                                    }
                                                }
                                            }

                                            return (
                                                <tr 
                                                    key={sub.code || idx}
                                                    className={`transition-colors group ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                                                >
                                                    {/* Subject Name */}
                                                    <td className="py-2.5 px-3">
                                                        <span className={`font-semibold transition-colors ${
                                                            isDark ? 'text-slate-100 group-hover:text-purple-300' : 'text-slate-900 font-bold group-hover:text-purple-700'
                                                        }`}>
                                                            {sub.name || 'Subject'}
                                                        </span>
                                                    </td>

                                                    {/* Code */}
                                                    <td className={`py-2.5 px-3 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                                                        {sub.code}
                                                    </td>

                                                    {/* Credits */}
                                                    <td className={`py-2.5 px-3 text-center font-mono font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                                        {credits}
                                                    </td>

                                                    {/* Attendance */}
                                                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                                                        {attPct !== null ? (
                                                            <span className={
                                                                attPct < 85 
                                                                    ? (isDark ? 'text-amber-400 font-semibold' : 'text-amber-600 font-bold') 
                                                                    : (isDark ? 'text-slate-200' : 'text-slate-700 font-medium')
                                                            }>
                                                                {attPct}%
                                                            </span>
                                                        ) : (
                                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>—</span>
                                                        )}
                                                    </td>

                                                    {/* CIE */}
                                                    <td className={`py-2.5 px-3 text-right font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>
                                                        {cieVal !== null ? `${cieVal} / ${cieMax}` : '—'}
                                                    </td>

                                                    {/* SEE */}
                                                    <td className={`py-2.5 px-3 text-right font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800 font-medium'}`}>
                                                        {isNcmc ? (
                                                            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-sans`}>N/A</span>
                                                        ) : seeVal !== null ? (
                                                            `${seeVal} / ${seeMax}`
                                                        ) : (
                                                            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Upcoming</span>
                                                        )}
                                                    </td>

                                                    {/* Eligibility */}
                                                    <td className="py-2.5 px-3 text-center font-mono text-xs">
                                                        {isEligible ? (
                                                            <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                                                                isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'
                                                            }`}>
                                                                ✓ Eligible
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                                                                isDark ? 'text-amber-400' : 'text-amber-600 font-semibold'
                                                            }`}>
                                                                ⚠ At Risk
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Grade */}
                                                    <td className={`py-2.5 px-3 text-center font-mono text-xs font-bold ${
                                                        isDark ? 'text-slate-200' : 'text-slate-900'
                                                    }`}>
                                                        {hasGrade ? (
                                                            <span>
                                                                {gradeLetter}
                                                                {gradePoint !== null && (
                                                                    <span className={`text-[10px] font-normal ml-1 ${
                                                                        isDark ? 'text-slate-500' : 'text-slate-400'
                                                                    }`}>
                                                                        · {gradePoint}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} font-normal`}>—</span>
                                                        )}
                                                    </td>

                                                    {/* Final Result */}
                                                    <td className={`py-2.5 px-3 text-right font-mono text-xs ${resultColor}`}>
                                                        {resultLabel}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        4. MINIMAL SEMESTER SUMMARY (Bottom Footnote)
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className={`flex flex-wrap items-center justify-between gap-3 text-xs font-mono px-1 pt-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                        <div className="flex items-center gap-4">
                            <span>Total Credits: <strong className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>{metrics.totalCredits}</strong></span>
                            <span>Earned Credits: <strong className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>{metrics.earnedCredits}</strong></span>
                            <span>SGPA: <strong className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>{metrics.sgpa}</strong></span>
                            {metrics.cgpa !== null && <span>CGPA: <strong className={isDark ? 'text-white' : 'text-slate-900 font-bold'}>{metrics.cgpa}</strong></span>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AcademicOverviewSection;
