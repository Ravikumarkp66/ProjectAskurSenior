import React from 'react';
import { motion } from 'framer-motion';
import { 
    Lock, CheckCircle2, Calendar, 
    ArrowRight, BookOpen, Layers, ShieldCheck, Clock
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';

const SemestersSection = ({ onNavigateTab }) => {
    const { 
        semestersData, 
        currentSemester, 
        selectedSemester, 
        selectSemester,
        academicOverview
    } = useStudentAcademics();

    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    // Format display date safely (returns "—" if not set)
    const formatDisplayDate = (dateVal) => {
        if (!dateVal) return '—';
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return '—';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '—';
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Header info banner */}
            <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border ${
                isDark 
                    ? 'bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border-purple-500/20'
                    : 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-white border-purple-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isDark ? 'bg-purple-600/20 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-200 text-purple-700'
                    }`}>
                        <Layers size={20} />
                    </div>
                    <div>
                        <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Academic Semesters
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                                Authoritative Baseline
                            </span>
                        </h2>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Academic structure configured by {academicOverview?.college?.name || 'SIT'}. Showing official active & historical terms.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current Standing:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                        isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                        Semester {currentSemester}
                    </span>
                </div>
            </div>

            {/* Semesters Read-Only List */}
            <div className="flex flex-col gap-3">
                {(!semestersData || semestersData.length === 0) ? (
                    <div className={`p-8 text-center rounded-xl border ${
                        isDark ? 'bg-purple-950/20 border-purple-500/20 text-slate-400' : 'bg-purple-50/50 border-purple-200 text-slate-600'
                    }`}>
                        <p className="text-sm">No official academic semesters found for your enrolled batch.</p>
                    </div>
                ) : (
                    semestersData.map((sem) => {
                        const semNumber = Number(sem.number || sem.semester);
                        const isCurrent = semNumber === currentSemester;
                        const isSelected = semNumber === selectedSemester;
                        const isPast = semNumber < currentSemester;

                        let statusBadge = (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                                isDark ? 'bg-slate-800/80 text-slate-400 border-white/5' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                Historical
                            </span>
                        );

                        if (isCurrent) {
                            statusBadge = (
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 shadow-sm ${
                                    isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-emerald-950/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Term
                                </span>
                            );
                        } else if (isPast) {
                            statusBadge = (
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                                    isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                    <Lock size={10} /> Completed
                                </span>
                            );
                        }

                        return (
                            <div
                                key={semNumber}
                                onClick={() => selectSemester(semNumber)}
                                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm cursor-pointer ${
                                    isSelected
                                        ? (isDark ? 'bg-purple-950/40 border-purple-500/60 ring-2 ring-purple-500/30' : 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-300/50')
                                        : (isDark ? 'bg-[#0b061c]/80 border-purple-500/15 hover:border-purple-500/40 hover:bg-white/[0.02]' : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/30')
                                }`}
                            >
                                {/* Left: Semester Number & Program */}
                                <div className="flex items-center gap-3.5 min-w-[220px]">
                                    <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-bold text-base shadow-inner border ${
                                        isCurrent 
                                            ? (isDark ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-200')
                                            : isSelected 
                                                ? (isDark ? 'bg-purple-600/30 text-purple-200 border-purple-500/50' : 'bg-purple-100 text-purple-800 border-purple-300')
                                                : (isDark ? 'bg-white/[0.04] text-slate-400 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200')
                                    }`}>
                                        S{semNumber}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                Semester {semNumber}
                                            </h3>
                                            {statusBadge}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                                                {sem.name || `Semester ${semNumber}`}
                                            </span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {sem.type || (semNumber % 2 === 1 ? 'Odd Semester' : 'Even Semester')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Center: Official Academic Dates */}
                                <div className={`flex items-center gap-6 px-3 py-2 rounded-lg border text-xs ${
                                    isDark ? 'bg-black/25 border-white/5' : 'bg-slate-50 border-slate-200'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={13} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-medium uppercase">Start Date</span>
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatDisplayDate(sem.startDate)}</span>
                                        </div>
                                    </div>

                                    <div className={`h-6 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

                                    <div className="flex items-center gap-2">
                                        <Clock size={13} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-medium uppercase">Last Working Day</span>
                                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{formatDisplayDate(sem.endDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Section info & Select indicator */}
                                <div className="flex items-center justify-between md:justify-end gap-3 min-w-[160px]">
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 uppercase block font-medium">Assigned Section</span>
                                        <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                            {academicOverview?.section?.name || 'Section A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isSelected && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onNavigateTab) onNavigateTab('results');
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                                            >
                                                <span>View Results</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}
                                        <div className={`p-2 rounded-lg transition-colors ${
                                            isSelected 
                                                ? (isDark ? 'bg-purple-600/30 text-purple-300' : 'bg-purple-100 text-purple-700')
                                                : (isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')
                                        }`}>
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Read-Only Notice Footer */}
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
                <ShieldCheck size={16} className={`${isDark ? 'text-purple-400' : 'text-purple-600'} shrink-0`} />
                <span>
                    Academic semesters and terms are governed directly by institutional admin policies. Future semesters unlock automatically upon term advancement.
                </span>
            </div>
        </div>
    );
};

export default SemestersSection;
