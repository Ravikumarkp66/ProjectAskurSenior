import React, { useState, useMemo } from 'react';
import { 
    Clock, Calendar, ShieldCheck, Lock, 
    Building, BookOpen, AlertCircle, Coffee 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { useTheme } from '../../../../context/ThemeContext';

const DAYS = [
    { key: 1, name: 'Monday', short: 'Mon' },
    { key: 2, name: 'Tuesday', short: 'Tue' },
    { key: 3, name: 'Wednesday', short: 'Wed' },
    { key: 4, name: 'Thursday', short: 'Thu' },
    { key: 5, name: 'Friday', short: 'Fri' },
    { key: 6, name: 'Saturday', short: 'Sat' },
];

const PERIOD_TIMES = [
    { slot: 1, label: 'Period 1', start: '08:00', end: '08:50', startMin: 480, endMin: 530 },
    { slot: 2, label: 'Period 2', start: '08:50', end: '09:40', startMin: 530, endMin: 580 },
    { slot: 3, label: 'Period 3', start: '09:40', end: '10:30', startMin: 580, endMin: 630 },
    { isBreak: true, label: 'Tea Break', start: '10:30', end: '10:45', startMin: 630, endMin: 645 },
    { slot: 4, label: 'Period 4', start: '10:45', end: '11:35', startMin: 645, endMin: 695 },
    { slot: 5, label: 'Period 5', start: '11:35', end: '12:25', startMin: 695, endMin: 745 },
    { isBreak: true, label: 'Lunch Break', start: '12:25', end: '01:15', startMin: 745, endMin: 795 },
    { slot: 6, label: 'Period 6', start: '01:15', end: '02:05', startMin: 795, endMin: 845 },
    { slot: 7, label: 'Period 7', start: '02:05', end: '02:55', startMin: 845, endMin: 895 },
    { slot: 8, label: 'Period 8', start: '02:55', end: '03:45', startMin: 895, endMin: 945 },
];

const TimetableSection = () => {
    const { isDark = true } = useTheme?.() || { isDark: true };
    const { 
        selectedSemester, 
        timetableData, 
        timetableSlots, 
        academicOverview,
        isHistorical 
    } = useStudentAcademics();

    // Day selector tab: default to today's day (1=Mon..6=Sat, Sunday defaults to Mon)
    const todayDay = new Date().getDay();
    const defaultDay = (todayDay >= 1 && todayDay <= 6) ? todayDay : 1;
    const [activeDay, setActiveDay] = useState(defaultDay);

    const sectionName = timetableData?.sectionName || academicOverview?.section?.name || 'Section A';
    const branchCode = academicOverview?.branch?.code || 'CSE';
    const batchName = academicOverview?.batch?.name || '2025-2029';
    const hasPublishedTimetable = timetableData?.hasPublishedTimetable !== false && (timetableSlots && timetableSlots.length > 0);

    // Matrix lookup [dayOfWeek][startMinute] -> slot
    const slotMatrix = useMemo(() => {
        const matrix = {};
        DAYS.forEach(d => { matrix[d.key] = {}; });

        if (timetableSlots && Array.isArray(timetableSlots)) {
            timetableSlots.forEach(s => {
                const day = s.dayOfWeek;
                if (matrix[day]) {
                    matrix[day][s.startMinute] = s;
                }
            });
        }
        return matrix;
    }, [timetableSlots]);

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            {/* Dead-Simple Header */}
            <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border ${
                isDark 
                    ? 'bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border-purple-500/20'
                    : 'bg-gradient-to-r from-purple-50 via-purple-50/50 to-white border-purple-200'
            }`}>
                <div>
                    <h2 className={`text-lg font-bold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Semester {selectedSemester}
                    </h2>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        {branchCode} • {batchName} • Section {sectionName}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-medium ${
                        isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                        <ShieldCheck size={13} />
                        Official College Timetable
                    </span>
                    {isHistorical && (
                        <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                            isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                            <Lock size={11} /> Historical
                        </span>
                    )}
                </div>
            </div>

            {/* If no published timetable for this section */}
            {!hasPublishedTimetable ? (
                <div className={`p-10 rounded-xl text-center flex flex-col items-center justify-center gap-3 shadow-sm border ${
                    isDark ? 'bg-[#0b061c] border-purple-500/20' : 'bg-white border-slate-200'
                }`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                        isDark ? 'bg-purple-600/15 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-700'
                    }`}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            No timetable has been published yet
                        </h3>
                        <p className={`text-xs mt-1 max-w-md ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            No official timetable has been published yet for {branchCode} Section {sectionName} (Semester {selectedSemester}). Department administrators will publish your schedule once finalized.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Day selector tabs (Mon - Sat) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {DAYS.map((d) => {
                            const isSelected = activeDay === d.key;
                            return (
                                <button
                                    key={d.key}
                                    onClick={() => setActiveDay(d.key)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                                        isSelected
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/40'
                                            : (isDark 
                                                ? 'bg-[#0b061c] text-slate-400 border-purple-500/15 hover:text-white hover:border-purple-500/30'
                                                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-purple-300 shadow-xs')
                                    }`}
                                >
                                    {d.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Schedule List for Selected Day */}
                    <div className={`flex flex-col gap-2.5 p-4 rounded-xl border shadow-sm ${
                        isDark ? 'bg-[#0b061c]/90 border-purple-500/20' : 'bg-white border-slate-200'
                    }`}>
                        <div className={`flex items-center justify-between pb-2 border-b ${
                            isDark ? 'border-purple-500/15' : 'border-slate-100'
                        }`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {DAYS.find(d => d.key === activeDay)?.name}
                            </span>
                            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                08:00 AM — 03:45 PM
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            {PERIOD_TIMES.map((p, idx) => {
                                if (p.isBreak) {
                                    return (
                                        <div
                                            key={`break-${idx}`}
                                            className={`px-4 py-2 rounded-lg border border-dashed flex items-center justify-between text-xs ${
                                                isDark 
                                                    ? 'bg-white/[0.02] border-white/10 text-slate-400' 
                                                    : 'bg-amber-50/60 border-amber-200 text-amber-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Coffee size={13} className="text-amber-500" />
                                                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{p.label}</span>
                                            </div>
                                            <span className={`font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                                                {p.start} - {p.end}
                                            </span>
                                        </div>
                                    );
                                }

                                const slot = slotMatrix[activeDay]?.[p.startMin];
                                const subjectObj = slot?.subject;
                                const subjectName = subjectObj?.name || (typeof subjectObj === 'string' ? subjectObj : '');
                                const subjectCode = subjectObj?.code || '';
                                const facultyName = slot?.faculty?.name || slot?.faculty || '';
                                const roomName = slot?.room || '';

                                return (
                                    <div
                                        key={`period-${p.slot}`}
                                        className={`p-3.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            slot && subjectName
                                                ? (isDark ? 'bg-purple-950/25 border-purple-500/30' : 'bg-purple-50/60 border-purple-200')
                                                : (isDark ? 'bg-black/20 border-white/5 opacity-60' : 'bg-slate-50 border-slate-200 opacity-80')
                                        }`}
                                    >
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className={`font-mono text-xs font-bold w-28 shrink-0 ${
                                                isDark ? 'text-purple-300' : 'text-purple-700'
                                            }`}>
                                                {p.start} - {p.end}
                                            </div>

                                            <div>
                                                {slot && subjectName ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                                {subjectName}
                                                            </span>
                                                            {subjectCode && (
                                                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                                                    isDark 
                                                                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/30' 
                                                                        : 'bg-purple-100 text-purple-800 border-purple-200'
                                                                }`}>
                                                                    {subjectCode}
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                                isDark 
                                                                    ? 'bg-white/5 text-slate-400 border-white/5' 
                                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}>
                                                                {slot.lectureType || 'Lecture'}
                                                            </span>
                                                        </div>

                                                        {facultyName && (
                                                            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                {facultyName}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                        No class scheduled (Free Period)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {roomName && (
                                            <div className={`self-start sm:self-auto px-2.5 py-1 rounded border text-[11px] font-mono shrink-0 ${
                                                isDark ? 'bg-black/40 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                            }`}>
                                                Room: {roomName}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Read-Only Notice Footer */}
            <div className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
                isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
                <ShieldCheck size={16} className={`${isDark ? 'text-purple-400' : 'text-purple-600'} shrink-0`} />
                <span>
                    Official timetable is governed directly by department administrators. Attendance occurrences and lecture schedules are projected automatically.
                </span>
            </div>
        </div>
    );
};

export default TimetableSection;
