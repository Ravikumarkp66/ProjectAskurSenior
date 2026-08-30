import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Lock, CheckCircle2, Calendar, Edit3, 
    ArrowRight, AlertTriangle, ShieldAlert, Sparkles, BookOpen, Layers, X, Check, Save 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';

const SemestersSection = ({ onNavigateTab }) => {
    const { 
        semestersData, 
        currentSemester, 
        selectedSemester, 
        selectSemester, 
        semesterCreditsMap, 
        timetableConfig,
        finalizeSemester, 
        updateSemester,
        saving 
    } = useStudentAcademics();

    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    const [finalizingSem, setFinalizingSem] = useState(null);
    
    // Inline editing state: stores the ID of the semester currently being edited
    const [editingSemId, setEditingSemId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        startDate: '',
        endDate: '',
        sgpa: '',
        academicYear: ''
    });

    const handleConfirmFinalize = async () => {
        if (!finalizingSem) return;
        await finalizeSemester(finalizingSem);
        setFinalizingSem(null);
    };

    // Start inline editing for a specific semester
    const handleStartInlineEdit = (sem, e) => {
        e.stopPropagation();
        
        let startVal = sem.startDate || '';
        let endVal = sem.endDate || '';

        // If active semester and dates exist in timetableConfig, use those
        if (sem.semester === currentSemester && !startVal && timetableConfig?.semesterStartDate) {
            startVal = timetableConfig.semesterStartDate;
        }
        if (sem.semester === currentSemester && !endVal && timetableConfig?.lastWorkingDate) {
            endVal = timetableConfig.lastWorkingDate;
        }

        // Clean to YYYY-MM-DD for date input value
        if (startVal && startVal.includes('T')) startVal = startVal.split('T')[0];
        if (endVal && endVal.includes('T')) endVal = endVal.split('T')[0];

        setEditFormData({
            startDate: startVal,
            endDate: endVal,
            sgpa: sem.sgpa !== null && sem.sgpa !== undefined ? String(sem.sgpa) : '',
            academicYear: sem.academicYear || ''
        });
        setEditingSemId(sem.semester);
    };

    // Cancel inline editing
    const handleCancelInlineEdit = (e) => {
        if (e) e.stopPropagation();
        setEditingSemId(null);
    };

    // Save inline edited semester
    const handleSaveInlineEdit = async (semNumber, e) => {
        if (e) e.stopPropagation();

        const payload = {
            startDate: editFormData.startDate || null,
            endDate: editFormData.endDate || null,
            academicYear: editFormData.academicYear || null,
            sgpa: editFormData.sgpa ? parseFloat(editFormData.sgpa) : null
        };

        const success = await updateSemester(semNumber, payload);
        if (success) {
            setEditingSemId(null);
        }
    };

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

    const getSemesterDates = (sem) => {
        let sDate = sem.startDate;
        let eDate = sem.endDate;

        if (sem.semester === currentSemester) {
            if (!sDate && timetableConfig?.semesterStartDate) sDate = timetableConfig.semesterStartDate;
            if (!eDate && timetableConfig?.lastWorkingDate) eDate = timetableConfig.lastWorkingDate;
        }

        return {
            start: formatDisplayDate(sDate),
            end: formatDisplayDate(eDate),
            rawStart: sDate,
            rawEnd: eDate
        };
    };

    return (
        <div className="flex flex-col gap-2.5 w-full">

            {/* Semesters Clean Vertical List */}
            <div className="flex flex-col gap-2.5">
                {semestersData.map((sem) => {
                    const isCurrent = sem.semester === currentSemester;
                    const isSelected = sem.semester === selectedSemester;
                    const isPast = sem.semester < currentSemester;
                    const isFrozen = sem.status === 'completed' || isPast;
                    const credits = semesterCreditsMap[sem.semester] ?? sem.credits ?? 20;
                    const dates = getSemesterDates(sem);
                    const isInlineEditing = editingSemId === sem.semester;

                    // Active or not status badge
                    let statusBadge = (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-400 border border-white/5 flex items-center gap-1">
                            Inactive ○
                        </span>
                    );

                    if (isCurrent) {
                        statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-sm shadow-emerald-950/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active ●
                            </span>
                        );
                    } else if (isFrozen) {
                        statusBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                                <Lock size={9} /> Finalized 🔒
                            </span>
                        );
                    }

                    return (
                        <div
                            key={sem.semester}
                            onClick={() => !isInlineEditing && selectSemester(sem.semester)}
                            className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-md ${
                                isInlineEditing
                                    ? 'bg-[#12082b] border-purple-500/70 ring-2 ring-purple-500/40'
                                    : isSelected
                                        ? 'bg-purple-950/30 border-purple-500/50 ring-1 ring-purple-500/30 cursor-pointer'
                                        : 'bg-[#090518]/70 border-purple-500/15 hover:border-purple-500/30 hover:bg-white/[0.02] cursor-pointer'
                            }`}
                        >
                            {/* Left Column: Semester ID & Active Status */}
                            <div className="flex items-center gap-3.5 min-w-[200px]">
                                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-bold text-sm ${
                                    isCurrent 
                                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                                        : isSelected 
                                            ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40' 
                                            : 'bg-white/[0.03] text-slate-400 border border-white/5'
                                }`}>
                                    S{sem.semester}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-white">
                                            Semester {sem.semester}
                                        </h3>
                                        {statusBadge}
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {sem.academicYear ? `Academic Year ${sem.academicYear}` : `Term ${sem.semester % 2 === 1 ? 'Odd' : 'Even'}`}
                                    </span>
                                </div>
                            </div>

                            {/* Middle Column: Start Date & End Date (View vs Inline Edit) */}
                            {isInlineEditing ? (
                                <div 
                                    className="flex flex-wrap items-center gap-3 bg-[#190f36] p-2.5 rounded-lg border border-purple-500/30"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Start Date Input */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-purple-200 whitespace-nowrap">Start:</span>
                                        <input
                                            type="date"
                                            value={editFormData.startDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                            style={{
                                                colorScheme: isDark ? 'dark' : 'light'
                                            }}
                                            className="px-2.5 py-1 text-xs rounded-md bg-[#0a0518] text-white border border-purple-500/40 focus:outline-none focus:border-purple-400 font-mono shadow-inner cursor-pointer"
                                        />
                                    </div>

                                    <span className="text-purple-400 font-bold hidden sm:inline">→</span>

                                    {/* End Date Input */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-purple-200 whitespace-nowrap">End:</span>
                                        <input
                                            type="date"
                                            value={editFormData.endDate}
                                            onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                            style={{
                                                colorScheme: isDark ? 'dark' : 'light'
                                            }}
                                            className="px-2.5 py-1 text-xs rounded-md bg-[#0a0518] text-white border border-purple-500/40 focus:outline-none focus:border-purple-400 font-mono shadow-inner cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-[#120c24]/50 px-3 py-2 rounded-lg border border-purple-500/10">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar size={13} className="text-purple-400 shrink-0" />
                                        <span className="text-slate-400 text-[11px]">Start Date:</span>
                                        <span className={`font-mono text-xs font-semibold ${dates.start !== '—' ? 'text-purple-200' : 'text-slate-400'}`}>
                                            {dates.start}
                                        </span>
                                    </div>

                                    <div className="hidden sm:block text-slate-600">→</div>

                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar size={13} className="text-purple-400 shrink-0" />
                                        <span className="text-slate-400 text-[11px]">End Date:</span>
                                        <span className={`font-mono text-xs font-semibold ${dates.end !== '—' ? 'text-purple-200' : 'text-slate-400'}`}>
                                            {dates.end}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Right Column: Actions (Edit / Save / Cancel / Conditional Finalize) */}
                            <div className="flex items-center justify-between lg:justify-end gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {isInlineEditing ? (
                                        <>
                                            {/* Inline Save Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleSaveInlineEdit(sem.semester, e)}
                                                disabled={saving}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-950/40 disabled:opacity-50"
                                                title="Save semester dates"
                                            >
                                                <Check size={13} />
                                                <span>{saving ? 'Saving...' : 'Save'}</span>
                                            </button>

                                            {/* Inline Cancel Button */}
                                            <button
                                                type="button"
                                                onClick={handleCancelInlineEdit}
                                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                                                title="Cancel editing"
                                            >
                                                <X size={13} />
                                                <span>Cancel</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Edit Button */}
                                            <button
                                                type="button"
                                                onClick={(e) => handleStartInlineEdit(sem, e)}
                                                className="px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                                title="Edit semester dates"
                                            >
                                                <Edit3 size={12} className="text-purple-300" />
                                                <span>Edit</span>
                                            </button>

                                            {/* Finalize button shown only in last week or after end date */}
                                            {(() => {
                                                if (!isCurrent || isFrozen || !dates.rawEnd) return null;
                                                const endDateObj = new Date(dates.rawEnd);
                                                if (isNaN(endDateObj.getTime())) return null;
                                                const sevenDaysBeforeEnd = new Date(endDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
                                                const now = new Date();
                                                const canFinalize = now >= sevenDaysBeforeEnd;

                                                if (!canFinalize) return null;

                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFinalizingSem(sem.semester);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition-colors cursor-pointer"
                                                        title="Finalize completed semester"
                                                    >
                                                        Finalize
                                                    </button>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Finalization Confirmation Modal */}
            <AnimatePresence>
                {finalizingSem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md p-5 rounded-xl bg-[#0e0826] border border-purple-500/30 shadow-2xl space-y-3.5"
                        >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                                <ShieldAlert size={20} />
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-white">Finalize Semester {finalizingSem}?</h3>
                                <p className="text-xs text-slate-300 mt-1">
                                    Finalizing freezes subjects, timetable, and attendance history as an immutable permanent record.
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                                <p className="font-semibold text-[11px]">What will happen:</p>
                                <ul className="list-disc list-inside text-[11px] text-slate-300">
                                    <li>Subjects and timetable for Semester {finalizingSem} will become read-only.</li>
                                    <li>All historical attendance entries are permanently preserved.</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setFinalizingSem(null)}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmFinalize}
                                    disabled={saving}
                                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? 'Freezing...' : 'Confirm & Finalize'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SemestersSection;
