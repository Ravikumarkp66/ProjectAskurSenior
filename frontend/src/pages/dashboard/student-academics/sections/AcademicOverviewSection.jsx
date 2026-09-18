import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronDown, RefreshCw, CheckCircle2, AlertTriangle, 
    AlertCircle
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { apiV2 } from '../../../../services/authService';

const AcademicOverviewSection = () => {
    const navigate = useNavigate();
    const { 
        profile, 
        currentSemester, 
        selectedSemester,
        selectSemester,
        semestersData, 
        registeredSubjects: contextRegisteredSubjects, 
        timetableConfig, 
    } = useStudentAcademics();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [resultData, setResultData] = useState(null);

    // Active semester defaults to selectedSemester or currentSemester or 1
    const activeSem = selectedSemester || currentSemester || 1;

    const fetchSemesterResults = async (sem, isRefresh = false) => {
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
        fetchSemesterResults(activeSem);
    }, [activeSem]);

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

    // Available semesters (1..8)
    const availableSemesters = useMemo(() => {
        if (resultData?.availableSemesters && resultData.availableSemesters.length > 0) {
            return resultData.availableSemesters;
        }
        if (semestersData && semestersData.length > 0) {
            return semestersData.map(s => Number(s.number || s.semester)).filter(n => !isNaN(n) && n > 0).sort((a, b) => a - b);
        }
        return [1, 2, 3, 4, 5, 6, 7, 8];
    }, [resultData, semestersData]);

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
            creditsDisplay: `${earnedCredits || totalCredits} / ${totalCredits}`,
            backlogs: backlogsCount,
            attendance: avgAttendance,
            cie: avgCie,
            totalCredits,
            earnedCredits: earnedCredits || totalCredits
        };
    }, [subjects, resultData, profile]);

    const schemeName = resultData?.scheme || profile?.scheme?.name || 'Scheme 2025';

    return (
        <div className="w-full flex flex-col gap-4 font-sans text-slate-200">
            {/* ══════════════════════════════════════════════════════════════════
                1. TOP HEADER (Extremely Compact)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
                        Academic Overview
                    </h1>
                    <span className="text-xs text-slate-400 font-mono">
                        Semester {activeSem} · {schemeName}
                    </span>
                </div>

                {/* Right Controls: Semester Selector & Refresh */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={activeSem}
                            onChange={(e) => selectSemester && selectSemester(Number(e.target.value))}
                            className="appearance-none bg-[#0e121d] hover:bg-[#131826] text-xs font-semibold text-slate-200 border border-white/10 rounded-md pl-2.5 pr-7 py-1 cursor-pointer focus:outline-none focus:border-purple-500/50 transition-colors"
                        >
                            {availableSemesters.map((sem) => (
                                <option key={sem} value={sem} className="bg-[#0e121d] text-white">
                                    Semester {sem} {sem === currentSemester ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchSemesterResults(activeSem, true)}
                        disabled={loading || refreshing}
                        title="Sync Academic Data"
                        className="p-1.5 rounded-md bg-[#0e121d] hover:bg-[#131826] border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin text-purple-400' : ''} />
                    </button>
                </div>
            </div>

            {/* Loading / Error States */}
            {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-purple-400" />
                    <span>Loading academic sheet...</span>
                </div>
            ) : error ? (
                <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => fetchSemesterResults(activeSem)}
                        className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-white font-medium"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <>
                    {/* ══════════════════════════════════════════════════════════════════
                        2. SUMMARY STRIP (Compact SaaS Toolbar - No Big Cards)
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className="w-full overflow-x-auto rounded-lg bg-[#0a0d16] border border-white/[0.08] px-4 py-2 flex items-center divide-x divide-white/[0.08] text-xs">
                        {/* SGPA */}
                        <div className="flex flex-col pr-5 min-w-[75px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                SGPA
                            </span>
                            <span className="text-sm font-bold text-white font-mono mt-0.5">
                                {metrics.sgpa}
                            </span>
                        </div>

                        {/* CGPA */}
                        <div className="flex flex-col px-5 min-w-[75px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                CGPA
                            </span>
                            <span className="text-sm font-bold text-white font-mono mt-0.5">
                                {metrics.cgpa}
                            </span>
                        </div>

                        {/* Credits */}
                        <div className="flex flex-col px-5 min-w-[90px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Credits
                            </span>
                            <span className="text-sm font-bold text-white font-mono mt-0.5">
                                {metrics.creditsDisplay}
                            </span>
                        </div>

                        {/* Backlogs */}
                        <div className="flex flex-col px-5 min-w-[75px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Backlogs
                            </span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${
                                metrics.backlogs > 0 ? 'text-red-400' : 'text-slate-200'
                            }`}>
                                {metrics.backlogs}
                            </span>
                        </div>

                        {/* Attendance */}
                        <div className="flex flex-col px-5 min-w-[90px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                Attendance
                            </span>
                            <span className="text-sm font-bold text-white font-mono mt-0.5">
                                {metrics.attendance}
                            </span>
                        </div>

                        {/* CIE */}
                        <div className="flex flex-col pl-5 min-w-[90px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                CIE
                            </span>
                            <span className="text-sm font-bold text-white font-mono mt-0.5">
                                {metrics.cie}
                            </span>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════════
                        3. MAIN TABLE (CSES Problem Sheet / Academic Marks Sheet)
                    ══════════════════════════════════════════════════════════════════ */}
                    <div className="w-full rounded-lg border border-white/[0.08] bg-[#07090e] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300 border-collapse">
                                <thead>
                                    <tr className="bg-[#0c101a] border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
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
                                <tbody className="divide-y divide-white/[0.04]">
                                    {subjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
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
                                            let resultColor = 'text-slate-400';

                                            if (!isEligible) {
                                                resultLabel = 'At Risk';
                                                resultColor = 'text-amber-400';
                                            } else if (hasGrade) {
                                                if (isNcmc) {
                                                    resultLabel = gradeLetter === 'PP' ? 'Passed' : 'Not Passed';
                                                    resultColor = gradeLetter === 'PP' ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold';
                                                } else {
                                                    if (gradeLetter === 'F' || gradeLetter === 'NP' || gradeLetter === 'NE') {
                                                        resultLabel = gradeLetter === 'NE' ? 'Not Eligible' : 'Failed';
                                                        resultColor = 'text-red-400 font-semibold';
                                                    } else {
                                                        resultLabel = 'Passed';
                                                        resultColor = 'text-emerald-400 font-semibold';
                                                    }
                                                }
                                            }

                                            return (
                                                <tr 
                                                    key={sub.code || idx}
                                                    className="hover:bg-white/[0.02] transition-colors group"
                                                >
                                                    {/* Subject Name */}
                                                    <td className="py-2.5 px-3">
                                                        <span className="font-semibold text-slate-100 group-hover:text-purple-300 transition-colors">
                                                            {sub.name || 'Subject'}
                                                        </span>
                                                    </td>

                                                    {/* Code */}
                                                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                                                        {sub.code}
                                                    </td>

                                                    {/* Credits */}
                                                    <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-300">
                                                        {credits}
                                                    </td>

                                                    {/* Attendance */}
                                                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                                                        {attPct !== null ? (
                                                            <span className={attPct < 85 ? 'text-amber-400 font-semibold' : 'text-slate-200'}>
                                                                {attPct}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">—</span>
                                                        )}
                                                    </td>

                                                    {/* CIE */}
                                                    <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-200">
                                                        {cieVal !== null ? `${cieVal} / ${cieMax}` : '—'}
                                                    </td>

                                                    {/* SEE */}
                                                    <td className="py-2.5 px-3 text-right font-mono text-xs text-slate-200">
                                                        {isNcmc ? (
                                                            <span className="text-slate-500 font-sans">N/A</span>
                                                        ) : seeVal !== null ? (
                                                            `${seeVal} / ${seeMax}`
                                                        ) : (
                                                            <span className="text-slate-500">Upcoming</span>
                                                        )}
                                                    </td>

                                                    {/* Eligibility */}
                                                    <td className="py-2.5 px-3 text-center font-mono text-xs">
                                                        {isEligible ? (
                                                            <span className="text-emerald-400 inline-flex items-center gap-1 font-medium text-[11px]">
                                                                ✓ Eligible
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-400 inline-flex items-center gap-1 font-medium text-[11px]">
                                                                ⚠ At Risk
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Grade */}
                                                    <td className="py-2.5 px-3 text-center font-mono text-xs font-bold text-slate-200">
                                                        {hasGrade ? (
                                                            <span>
                                                                {gradeLetter}
                                                                {gradePoint !== null && (
                                                                    <span className="text-[10px] text-slate-500 font-normal ml-1">
                                                                        · {gradePoint}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500 font-normal">—</span>
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
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 px-1 pt-1">
                        <div className="flex items-center gap-4">
                            <span>Total Credits: <strong className="text-white">{metrics.totalCredits}</strong></span>
                            <span>Earned Credits: <strong className="text-white">{metrics.earnedCredits}</strong></span>
                            <span>SGPA: <strong className="text-white">{metrics.sgpa}</strong></span>
                            {metrics.cgpa !== null && <span>CGPA: <strong className="text-white">{metrics.cgpa}</strong></span>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AcademicOverviewSection;
