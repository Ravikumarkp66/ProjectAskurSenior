import React, { useState, useMemo } from 'react';
import { 
    Clock, Calendar, ShieldCheck, Lock, 
    Building, BookOpen, AlertCircle, Coffee 
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';

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
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">
                        Semester {selectedSemester}
                    </h2>
                    <p className="text-xs text-purple-300 font-semibold mt-0.5">
                        {branchCode} • {batchName} • Section {sectionName}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-medium">
                        <ShieldCheck size={13} />
                        Official College Timetable
                    </span>
                    {isHistorical && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Lock size={11} /> Historical
                        </span>
                    )}
                </div>
            </div>

            {/* If no published timetable for this section */}
            {!hasPublishedTimetable ? (
                <div className="p-10 rounded-xl bg-[#0b061c] border border-purple-500/20 text-center flex flex-col items-center justify-center gap-3 shadow-lg">
                    <div className="w-14 h-14 rounded-full bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">
                            No timetable has been published yet
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-md">
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
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                                        isSelected
                                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                                            : 'bg-[#0b061c] text-slate-400 border border-purple-500/15 hover:text-white hover:border-purple-500/30'
                                    }`}
                                >
                                    {d.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Schedule List for Selected Day */}
                    <div className="flex flex-col gap-2.5 bg-[#0b061c]/90 p-4 rounded-xl border border-purple-500/20 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {DAYS.find(d => d.key === activeDay)?.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                                08:00 AM — 03:45 PM
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            {PERIOD_TIMES.map((p, idx) => {
                                if (p.isBreak) {
                                    return (
                                        <div
                                            key={`break-${idx}`}
                                            className="px-4 py-2 rounded-lg bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-between text-xs text-slate-400"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Coffee size={13} className="text-amber-400" />
                                                <span className="font-semibold text-slate-300">{p.label}</span>
                                            </div>
                                            <span className="font-mono text-[11px] text-slate-500">
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
                                                ? 'bg-purple-950/25 border-purple-500/30'
                                                : 'bg-black/20 border-white/5 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-start sm:items-center gap-3">
                                            <div className="font-mono text-xs font-bold text-purple-300 w-28 shrink-0">
                                                {p.start} - {p.end}
                                            </div>

                                            <div>
                                                {slot && subjectName ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-white">
                                                                {subjectName}
                                                            </span>
                                                            {subjectCode && (
                                                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">
                                                                    {subjectCode}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                                                {slot.lectureType || 'Lecture'}
                                                            </span>
                                                        </div>

                                                        {facultyName && (
                                                            <span className="text-[11px] text-slate-400 block mt-0.5">
                                                                {facultyName}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">
                                                        No class scheduled (Free Period)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {roomName && (
                                            <div className="self-start sm:self-auto px-2.5 py-1 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-slate-300 shrink-0">
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
            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-purple-400 shrink-0" />
                <span>
                    Official timetable is governed directly by department administrators. Attendance occurrences and lecture schedules are projected automatically.
                </span>
            </div>
        </div>
    );
};

export default TimetableSection;
