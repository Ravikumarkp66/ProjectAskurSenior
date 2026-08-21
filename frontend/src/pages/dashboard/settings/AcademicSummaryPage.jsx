import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import {
    Award,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    Clock,
    BookOpen,
    BarChart3,
    ExternalLink,
    GraduationCap,
    ChevronDown,
    Loader2
} from 'lucide-react';

const AcademicSummaryPage = () => {
    const navigate = useNavigate();

    const [selectedSemester, setSelectedSemester] = useState(1);
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSummary = async (sem) => {
        setIsLoading(true);
        try {
            const res = await apiV2.getAcademicSummary(sem);
            if (res.data?.success && res.data.data) {
                setSummaryData(res.data.data);
                if (res.data.data.requestedSemester) {
                    setSelectedSemester(res.data.data.requestedSemester);
                }
            }
        } catch (err) {
            console.error('[AcademicSummary] Error fetching summary:', err);
            toast.error('Failed to load academic summary.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary(selectedSemester);
    }, [selectedSemester]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 380,
                color: '#94a3b8',
                gap: 12
            }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Loading Academic Summary...</span>
            </div>
        );
    }

    const {
        studentInfo = {},
        heroStats = {},
        semesterTrend = {},
        selectedSemesterResult = null,
        semesterHistory = [],
        academicHealth = {},
        degreeProgress = {},
        academicRisks = [],
        availableSemesters = []
    } = summaryData || {};

    const subjects = selectedSemesterResult?.subjects || [];

    const formatNum = (val, digits = 2) => {
        return (val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) ? val.toFixed(digits) : '—';
    };

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 48 }} className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                        <GraduationCap size={16} />
                        <span>My Academics Destination</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
                        Academic Summary
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Your complete academic performance, progress and academic health at a glance.
                    </p>

                    {/* Student Context Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200">
                            {studentInfo.name || 'Student'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-300 font-mono">
                            {studentInfo.usn || 'N/A'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            {studentInfo.branch || 'Information Science'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300">
                            Class of {studentInfo.graduationYear || 2027}
                        </span>
                    </div>
                </div>

                {/* Top Right: Semester Selector */}
                <div className="relative self-stretch md:self-auto">
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(Number(e.target.value))}
                        className="w-full md:w-auto appearance-none bg-slate-900 border border-purple-500/30 text-slate-100 text-sm font-bold py-2.5 px-4 pr-10 rounded-xl outline-none cursor-pointer shadow-lg"
                    >
                        {availableSemesters.map((sem) => (
                            <option key={sem.semester} value={sem.semester} className="bg-slate-900 text-slate-100">
                                Semester {sem.semester} {sem.isCurrent ? '• Current' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* HERO PERFORMANCE SECTION */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* CGPA */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/40 border border-purple-500/30 shadow-xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Current CGPA</div>
                    <div className="text-3xl md:text-4xl font-black text-cyan-400 my-2">
                        {formatNum(heroStats.cgpa, 2)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Cumulative Grade Point</div>
                </div>

                {/* Current SGPA */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-indigo-500/30 shadow-xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Semester {selectedSemester} SGPA</div>
                    <div className="text-3xl md:text-4xl font-black text-purple-300 my-2">
                        {heroStats.sgpa !== undefined && heroStats.sgpa !== null ? formatNum(heroStats.sgpa, 2) : 'Pending'}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Selected Semester Result</div>
                </div>

                {/* Credits Earned */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits Earned</div>
                    <div className="text-3xl md:text-4xl font-black text-slate-100 my-2">
                        {heroStats.creditsEarned || 0} <span className="text-lg font-normal text-slate-500">/ {heroStats.totalDegreeCredits || 160}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Degree Credit Progress</div>
                </div>

                {/* Semester Status */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Semester</div>
                    <div className="text-2xl md:text-3xl font-black text-emerald-400 my-2">
                        Semester {heroStats.currentSemester || selectedSemester}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Active Academic Period</div>
                </div>
            </div>

            {/* MAIN TWO-COLUMN DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN (8 Cols on Desktop) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* SEMESTER PERFORMANCE TREND */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                <TrendingUp size={18} className="text-purple-400" />
                                <span>Semester Performance Trend</span>
                            </h3>
                        </div>

                        {semesterTrend.history && semesterTrend.history.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {/* Visual Trend Bars */}
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                                    {semesterTrend.history.map((sem) => {
                                        const heightPct = Math.min(100, ((sem.sgpa || 0) / 10) * 100);
                                        return (
                                            <div key={sem.semester} className="flex flex-col items-center gap-2">
                                                <div className="text-xs font-bold text-slate-200">{formatNum(sem.sgpa, 2)}</div>
                                                <div className="w-full h-32 bg-slate-950 rounded-xl p-1 flex items-end">
                                                    <div
                                                        className="w-full rounded-lg bg-gradient-to-t from-indigo-600 to-purple-500 transition-all"
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                </div>
                                                <div className="text-xs font-semibold text-slate-400">Sem {sem.semester}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Summary */}
                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center text-xs font-semibold">
                                    <div>
                                        <span className="text-slate-400">Highest SGPA:</span>{' '}
                                        <strong className="text-emerald-400">{formatNum(semesterTrend.highestSgpa, 2)}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Lowest SGPA:</span>{' '}
                                        <strong className="text-amber-400">{formatNum(semesterTrend.lowestSgpa, 2)}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Current CGPA:</span>{' '}
                                        <strong className="text-cyan-400">{formatNum(semesterTrend.currentCgpa, 2)}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm font-medium">
                                No historical semester results recorded yet. Complete semester SGPA results to view trend.
                            </div>
                        )}
                    </div>

                    {/* SEMESTER SUBJECT DETAILS TABLE */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                <BookOpen size={18} className="text-purple-400" />
                                <span>Semester {selectedSemester} Subject Performance</span>
                            </h3>
                            <button
                                onClick={() => navigate('/home/sgpa')}
                                className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1"
                            >
                                <span>View SGPA Workspace</span>
                                <ExternalLink size={12} />
                            </button>
                        </div>

                        {subjects.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 font-bold text-slate-400 uppercase">
                                            <th className="py-3 px-3">#</th>
                                            <th className="py-3 px-3">Subject</th>
                                            <th className="py-3 px-3 text-center">Credits</th>
                                            <th className="py-3 px-3 text-center">CIE</th>
                                            <th className="py-3 px-3 text-center">SEE Raw</th>
                                            <th className="py-3 px-3 text-center">SEE Scaled</th>
                                            <th className="py-3 px-3 text-center">Total</th>
                                            <th className="py-3 px-3 text-center">Grade</th>
                                            <th className="py-3 px-3 text-center">GP</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-medium">
                                        {subjects.map((sub, idx) => (
                                            <tr key={sub.registeredSubject || idx} className="hover:bg-slate-800/30">
                                                <td className="py-3 px-3 font-mono text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="py-3 px-3">
                                                    <div className="font-bold text-slate-200">{sub.subjectName}</div>
                                                    <div className="text-[11px] text-slate-400">{sub.subjectCode}</div>
                                                </td>
                                                <td className="py-3 px-3 text-center font-bold text-slate-300">{sub.credits}</td>
                                                <td className="py-3 px-3 text-center font-bold text-cyan-400">{sub.cieMarks !== null ? `${sub.cieMarks}/50` : '—'}</td>
                                                <td className="py-3 px-3 text-center text-slate-300">{sub.seeRawMarks !== null ? `${sub.seeRawMarks}/${sub.seeRawMaximum || 100}` : '—'}</td>
                                                <td className="py-3 px-3 text-center font-bold text-indigo-400">{sub.seeScaledMarks !== null ? `${sub.seeScaledMarks}/50` : '—'}</td>
                                                <td className="py-3 px-3 text-center font-black text-slate-100">{sub.totalMarks !== null ? sub.totalMarks : '—'}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        sub.grade === 'NE' || sub.grade === 'F' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        sub.grade === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    }`}>
                                                        {sub.grade}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center font-extrabold text-slate-200">{sub.gradePoint}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm font-medium">
                                No subject records found for Semester {selectedSemester}. Complete Subject Registration first.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN (4 Cols on Desktop) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* DEGREE PROGRESS */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
                            <span>Degree Progress</span>
                            <span className="text-xs text-purple-400 font-extrabold">{degreeProgress.percentage || 0}%</span>
                        </h3>

                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-emerald-400 rounded-full transition-all"
                                style={{ width: `${degreeProgress.percentage || 0}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                                <div className="text-[10px] text-slate-400">Earned</div>
                                <div className="text-base font-bold text-slate-100">{degreeProgress.creditsEarned || 0}</div>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                                <div className="text-[10px] text-slate-400">Remaining</div>
                                <div className="text-base font-bold text-purple-300">{degreeProgress.remainingCredits || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* ACADEMIC HEALTH */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-100">Academic Health</h3>

                        {/* CIE Health */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-200">CIE Performance</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    Avg: <strong className="text-cyan-400">{academicHealth.cieAverage !== null ? `${academicHealth.cieAverage}/50` : 'Pending'}</strong>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/home/cie')}
                                className="text-xs font-bold text-indigo-400 hover:underline"
                            >
                                View CIE →
                            </button>
                        </div>

                        {/* Attendance Health */}
                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-200">Attendance Tracker</div>
                                <div className="text-xs text-emerald-400 font-semibold mt-0.5">Safe & Active</div>
                            </div>
                            <button
                                onClick={() => navigate('/home/attendance')}
                                className="text-xs font-bold text-indigo-400 hover:underline"
                            >
                                View Attendance →
                            </button>
                        </div>
                    </div>

                    {/* NEEDS ATTENTION / RISKS */}
                    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-400" />
                            <span>Needs Attention</span>
                        </h3>

                        {academicRisks.length > 0 ? (
                            academicRisks.map((risk, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 flex flex-col gap-1.5 text-xs">
                                    <div className="font-bold text-red-400">{risk.title}</div>
                                    <div className="text-slate-300">{risk.message}</div>
                                    <button
                                        onClick={() => navigate(risk.actionUrl)}
                                        className="text-indigo-400 font-bold text-[11px] self-start hover:underline mt-1"
                                    >
                                        {risk.actionText} →
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-semibold">
                                <CheckCircle2 size={16} />
                                <span>✓ Everything looks good. No academic risks detected.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicSummaryPage;
