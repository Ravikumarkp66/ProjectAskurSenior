import React, { useMemo, useState } from 'react';
import { 
    CalendarRange, 
    ArrowRight, 
    Info, 
    Coffee, 
    Utensils, 
    CalendarOff, 
    BookOpen, 
    FlaskConical, 
    GraduationCap, 
    Presentation,
    Edit3,
    Clock,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';

const WeeklyTimetableGrid = ({ 
    slots = [], 
    config, 
    subjects = [], 
    onCellClick, 
    user, 
    registeredSubjects = [], 
    allottedTimetable = null,
    officialSlots = [],
    isCustomizing = false,
    isReadOnly = false
}) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const t = useMemo(() => ({
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
        surfaceElevated: isDark ? '#13151D' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.06)',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        accent: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.25)',
        dayHeaderBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
        dayHeaderBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        tableRowBorder: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
        breakBg: isDark ? '#0b090f' : '#FFFBEB',
        breakText: isDark ? 'rgba(251, 191, 36, 0.7)' : '#B45309',
        breakBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FDE68A',
        labCardBg: isDark ? 'rgba(99, 102, 241, 0.08)' : '#EEF2FF',
        labCardBorder: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
        labCardText: isDark ? '#c7d2fe' : '#4338CA',
        theoryCardBg: isDark ? 'rgba(124, 58, 237, 0.04)' : '#FAF5FF',
        theoryCardBorder: isDark ? 'rgba(124, 58, 237, 0.2)' : '#E9D5FF',
        slotEmptyDash: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
    }), [isDark]);

    const daysMap = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday'
    };

    const shortDays = [
        { num: 1, label: 'Mon' },
        { num: 2, label: 'Tue' },
        { num: 3, label: 'Wed' },
        { num: 4, label: 'Thu' },
        { num: 5, label: 'Fri' },
        { num: 6, label: 'Sat' }
    ];

    // Default mobile active day to today (if Mon-Sat) or Monday
    const [activeMobileDay, setActiveMobileDay] = useState(() => {
        const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
        return today >= 1 && today <= 6 ? today : 1;
    });

    // Format minutes from midnight to 12-hour format: 480 -> 08:00 AM
    const formatTime = (mins) => {
        if (mins === undefined || mins === null) return '';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Helper to detect if a slot is a personal change from the official baseline
    const checkIsPersonalChange = (slot) => {
        if (slot.isPersonalChange) return true;
        if (!officialSlots || officialSlots.length === 0) return false;

        const offSlot = officialSlots.find(os => 
            os.dayOfWeek === slot.dayOfWeek && 
            Number(os.startMinute) === Number(slot.startMinute)
        );

        if (!offSlot) return false;

        const offSubjId = String(offSlot.subject?._id || offSlot.subject || '');
        const curSubjId = String(slot.subject?._id || slot.subject || '');
        const offType = offSlot.lectureType || 'Lecture';
        const curType = slot.lectureType || 'Lecture';

        return (offSubjId !== curSubjId) || (offType !== curType);
    };

    // Calculate live progress for each registered subject
    const planningProgress = useMemo(() => {
        return registeredSubjects.map(reg => {
            const subjId = reg.subject?._id?.toString() || reg.subject?.toString();
            const customName = reg.customName || reg.subject?.name || 'Unknown';
            const customCode = reg.customCode || reg.subject?.code || '';
            
            // Count Theory slots assigned to this subject
            const theorySlotsCount = slots.filter(s => {
                const slotSubjId = s.subject?._id?.toString() || s.subject?.toString();
                return slotSubjId === subjId && s.lectureType !== 'Lab' && s.lectureType !== 'Break';
            }).length;

            // Count Lab slots assigned to this subject
            const labSlotsCount = slots.filter(s => {
                const slotSubjId = s.subject?._id?.toString() || s.subject?.toString();
                return slotSubjId === subjId && s.lectureType === 'Lab';
            }).length;

            const labSessionsCount = Math.floor(labSlotsCount / 2);

            return {
                _id: reg._id,
                name: customName,
                code: customCode,
                category: reg.category,
                theoryRequired: reg.weeklyPlan?.theory?.required ?? 0,
                theoryAssigned: theorySlotsCount,
                labRequired: reg.weeklyPlan?.lab?.required ?? 0,
                labAssigned: labSessionsCount
            };
        });
    }, [registeredSubjects, slots]);

    // Filter out subjects that are fully complete
    const incompleteProgress = useMemo(() => {
        return planningProgress.filter(prog => {
            const hasTheory = prog.theoryRequired > 0;
            const hasLab = prog.labRequired > 0;
            
            const isTheoryComplete = !hasTheory || prog.theoryAssigned >= prog.theoryRequired;
            const isLabComplete = !hasLab || prog.labAssigned >= prog.labRequired;
            
            return !(isTheoryComplete && isLabComplete);
        });
    }, [planningProgress]);

    // Day number to string key map for safe lookup
    const dayNumToKey = useMemo(() => ({
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun'
    }), []);

    const getDayStatus = (workingDaysMap, day) => {
        if (!workingDaysMap) return day <= 5 ? 'Full Day' : day === 6 ? 'Half Day' : 'Holiday';
        return workingDaysMap[day.toString()] || 
               workingDaysMap[day] || 
               workingDaysMap[dayNumToKey[day]] || 
               (day <= 5 ? 'Full Day' : day === 6 ? 'Half Day' : 'Holiday');
    };

    // 1. Resolve unique time intervals across all slots AND config breaks
    const uniqueIntervals = useMemo(() => {
        const list = [];
        const configBreaks = (config?.breaks || []).map(b => ({
            startMinute: Number(b.startMinute),
            endMinute: Number(b.startMinute) + Number(b.duration || 15),
            lectureType: 'Break',
            breakName: b.name
        }));

        if (slots && slots.length > 0) {
            slots.forEach(s => {
                const sStart = Number(s.startMinute);
                const sEnd = Number(s.endMinute);
                const isBreak = s.lectureType === 'Break' || configBreaks.some(b => b.startMinute === sStart && b.endMinute === sEnd);
                
                const exists = list.some(u => u.startMinute === sStart && u.endMinute === sEnd);
                if (!exists) {
                    list.push({
                        startMinute: sStart,
                        endMinute: sEnd,
                        lectureType: isBreak ? 'Break' : (s.lectureType || 'Lecture'),
                        breakName: s.breakName || s.room
                    });
                }
            });

            // Ensure all config breaks are present in uniqueIntervals
            configBreaks.forEach(b => {
                const exists = list.some(u => u.startMinute === b.startMinute && u.endMinute === b.endMinute);
                if (!exists) {
                    list.push(b);
                }
            });

            list.sort((a, b) => a.startMinute - b.startMinute);
            if (list.length > 0) return list;
        }

        // Fallback: Generate time intervals from config
        const start = Number(config?.collegeStartMinute ?? 480);
        const end = Number(config?.collegeEndMinute ?? 1020);
        const duration = Number(config?.classDuration ?? 50);
        const breaks = (config?.breaks || []).map(b => ({
            startMinute: Number(b.startMinute),
            duration: Number(b.duration || 15),
            name: b.name
        }));

        let current = start;
        while (current < end) {
            const breakItem = breaks.find(b => b.startMinute === current);
            if (breakItem) {
                const bEnd = Math.min(current + breakItem.duration, end);
                list.push({
                    startMinute: current,
                    endMinute: bEnd,
                    lectureType: 'Break',
                    breakName: breakItem.name
                });
                current = bEnd;
            } else {
                let next = current + duration;
                const upcomingBreak = breaks.find(b => b.startMinute > current && b.startMinute < next);
                if (upcomingBreak) {
                    next = upcomingBreak.startMinute;
                }
                next = Math.min(next, end);
                if (next > current) {
                    list.push({
                        startMinute: current,
                        endMinute: next,
                        lectureType: 'Lecture'
                    });
                }
                current = next;
            }
        }
        return list;
    }, [slots, config]);

    // 2. Resolve rowSpans for break columns to render them as single merged vertical columns
    const breakRowSpans = useMemo(() => {
        const spans = {};
        
        uniqueIntervals.forEach(interval => {
            if (interval.lectureType === 'Break') {
                let count = 0;
                let firstDay = null;
                
                for (let day = 1; day <= 7; day++) {
                    const dayType = getDayStatus(config?.workingDays, day);
                    
                    if (dayType !== 'Holiday') {
                        count++;
                        if (firstDay === null) {
                            firstDay = day;
                        }
                    }
                }
                
                spans[`${interval.startMinute}_${interval.endMinute}`] = { firstDay, count };
            }
        });
        
        return spans;
    }, [uniqueIntervals, config, dayNumToKey]);

    // Resolve lecture badge icon
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Lecture':
                return <BookOpen size={10} style={{ marginRight: '3px' }} />;
            case 'Lab':
                return <FlaskConical size={10} style={{ marginRight: '3px' }} />;
            case 'Tutorial':
                return <GraduationCap size={10} style={{ marginRight: '3px' }} />;
            case 'Seminar':
                return <Presentation size={10} style={{ marginRight: '3px' }} />;
            default:
                return null;
        }
    };

    // Resolve break icon
    const getBreakIcon = (name = '') => {
        const isLunch = name.toLowerCase().includes('lunch');
        if (isLunch) {
            return <Utensils size={13} style={{ marginBottom: '3px' }} />;
        }
        return <Coffee size={13} style={{ marginBottom: '3px' }} />;
    };

    const isBasicSetupComplete = useMemo(() => {
        if (allottedTimetable?.isOfficial || (slots && slots.length > 0)) {
            return true;
        }
        return Boolean(
            config?.semesterStartDate && 
            config?.lastWorkingDate && 
            config?.collegeStartMinute !== undefined && 
            config?.collegeEndMinute !== undefined
        );
    }, [config, allottedTimetable, slots]);

    // Mobile day's sorted slots
    // Mobile day's resolved sessions (merging multi-period labs into single logical cards)
    const mobileDaySessions = useMemo(() => {
        const dSlots = slots.filter(s => s.dayOfWeek === activeMobileDay);
        dSlots.sort((a, b) => a.startMinute - b.startMinute);

        const sessions = [];
        const skippedIndices = new Set();

        for (let i = 0; i < dSlots.length; i++) {
            if (skippedIndices.has(i)) continue;
            const slot = dSlots[i];

            if (slot.lectureType === 'Lab') {
                const nextSlot = dSlots[i + 1];
                const slotSubjId = String(slot.subject?._id || slot.subject || '');
                const nextSlotSubjId = String(nextSlot?.subject?._id || nextSlot?.subject || '');
                const sameSession = slot.sessionGroupId && nextSlot?.sessionGroupId && slot.sessionGroupId === nextSlot.sessionGroupId;

                if (nextSlot && nextSlot.lectureType === 'Lab' && (sameSession || (slotSubjId && slotSubjId === nextSlotSubjId))) {
                    skippedIndices.add(i + 1);
                    sessions.push({
                        ...slot,
                        linkedSlot: nextSlot,
                        isMultiPeriod: true,
                        totalPeriods: 2,
                        blockStartMinute: slot.startMinute,
                        blockEndMinute: nextSlot.endMinute,
                        endMinute: nextSlot.endMinute,
                        daySlots: dSlots
                    });
                    continue;
                }
            }

            sessions.push({
                ...slot,
                isMultiPeriod: false,
                totalPeriods: 1,
                blockStartMinute: slot.startMinute,
                blockEndMinute: slot.endMinute,
                daySlots: dSlots
            });
        }

        return sessions;
    }, [slots, activeMobileDay]);

    const mobileDayStatus = getDayStatus(config?.workingDays, activeMobileDay);

    return (
        <div style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: '12px',
            padding: '16px sm:18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%'
        }}>
            {/* Header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: t.text, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarRange size={16} style={{ color: t.accent }} />
                    <span>Weekly Timetable Schedule</span>
                </h3>
                {isCustomizing && !isReadOnly && (
                    <span 
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold border animate-pulse"
                        style={{ backgroundColor: t.accentBg, color: t.accent, borderColor: t.accentBorder }}
                    >
                        ✎ Customization Active — Click any slot to edit
                    </span>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                MOBILE VIEW: Day-based list (< md breakpoint)
            ══════════════════════════════════════════════════════════ */}
            <div className="block md:hidden space-y-3">
                {/* Day selector tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {shortDays.map(d => {
                        const isActive = activeMobileDay === d.num;
                        return (
                            <button
                                key={d.num}
                                type="button"
                                onClick={() => setActiveMobileDay(d.num)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border ${
                                    isActive
                                        ? 'bg-violet-600 text-white shadow-sm border-violet-600'
                                        : 'hover:opacity-80'
                                }`}
                                style={!isActive ? {
                                    backgroundColor: t.surfaceSubtle,
                                    color: t.textMuted,
                                    borderColor: t.border
                                } : undefined}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>

                {/* Day status / Holiday notice */}
                {mobileDayStatus === 'Holiday' ? (
                    <div 
                        className="p-8 text-center rounded-xl border text-xs flex flex-col items-center justify-center gap-2"
                        style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border, color: t.textMuted }}
                    >
                        <CalendarOff size={20} style={{ color: t.textFaint }} />
                        <span>Holiday · No scheduled classes</span>
                    </div>
                ) : mobileDaySessions.length === 0 ? (
                    <div 
                        className="p-8 text-center rounded-xl border text-xs"
                        style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border, color: t.textMuted }}
                    >
                        No classes scheduled for {daysMap[activeMobileDay]}.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {mobileDaySessions.map((session, sIdx) => {
                            const isBreak = session.lectureType === 'Break';
                            const isPersonal = checkIsPersonalChange(session) || (session.linkedSlot && checkIsPersonalChange(session.linkedSlot));
                            const slotSubjId = session.subject?._id || session.subject;
                            const inlineSubjectObj = (session.subject && typeof session.subject === 'object' && session.subject.name)
                                ? session.subject : null;
                            const subjectObj = inlineSubjectObj
                                || subjects.find(subj => String(subj._id) === String(slotSubjId))
                                || (slotSubjId ? { _id: slotSubjId, name: String(slotSubjId), code: '' } : null);

                            if (isBreak) {
                                return (
                                    <div 
                                        key={sIdx}
                                        className={`py-2 px-3.5 rounded-lg border flex items-center justify-between text-xs cursor-not-allowed select-none ${
                                            isDark 
                                                ? 'bg-amber-500/[0.04] border-amber-500/15 text-amber-300/80' 
                                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}
                                        title="Official Break (Locked)"
                                    >
                                        <div className="flex items-center gap-2">
                                            {getBreakIcon(session.room || session.breakName || 'Break')}
                                            <span className="font-semibold">{session.room || session.breakName || 'Break'}</span>
                                            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-semibold ${
                                                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                Locked
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono opacity-80">
                                            {formatTime(session.startMinute)} – {formatTime(session.endMinute)}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={sIdx}
                                    onClick={() => {
                                        if (isCustomizing && !isReadOnly && onCellClick) {
                                            onCellClick(session);
                                        }
                                    }}
                                    className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                                        isCustomizing && !isReadOnly ? 'cursor-pointer shadow-sm' : ''
                                    }`}
                                    style={
                                        isCustomizing && !isReadOnly
                                            ? { backgroundColor: t.accentBg, borderColor: t.accentBorder }
                                            : session.isMultiPeriod
                                                ? { backgroundColor: t.labCardBg, borderColor: t.labCardBorder }
                                                : { backgroundColor: t.surfaceSubtle, borderColor: t.border }
                                    }
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium" style={{ color: t.textMuted }}>
                                            <Clock size={12} style={{ color: t.accent }} />
                                            <span>{formatTime(session.startMinute)} – {formatTime(session.endMinute)}</span>
                                        </div>
                                        {session.isMultiPeriod ? (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                                isDark 
                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                            }`}>
                                                <FlaskConical size={11} />
                                                <span>2-Period Lab</span>
                                            </span>
                                        ) : (
                                            <span 
                                                className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                                                style={{ backgroundColor: t.surface, color: t.textMuted, borderColor: t.border }}
                                            >
                                                {session.lectureType || 'Theory'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-baseline justify-between gap-2">
                                        <div>
                                            <h4 className="text-sm font-semibold tracking-tight" style={{ color: t.text }}>
                                                {subjectObj?.name || 'Unassigned Period'}
                                            </h4>
                                            {subjectObj?.code && (
                                                <span className="text-[11px] font-mono" style={{ color: t.textMuted }}>
                                                    [{subjectObj.code}]
                                                </span>
                                            )}
                                        </div>
                                        {isPersonal && (
                                            <span className="text-[10.5px] font-mono shrink-0" style={{ color: t.accent }}>
                                                ↳ Personal change
                                            </span>
                                        )}
                                    </div>

                                    {(session.room || session.faculty) && (
                                        <div className="flex items-center gap-2 text-[11px]" style={{ color: t.textFaint }}>
                                            {session.room && <span>Room: {session.room}</span>}
                                            {session.room && session.faculty && <span>·</span>}
                                            {session.faculty && <span>{session.faculty}</span>}
                                        </div>
                                    )}

                                    {isCustomizing && !isReadOnly && (
                                        <div 
                                            className="pt-2 mt-1 border-t flex items-center justify-between text-[11.5px] font-medium"
                                            style={{ borderTopColor: t.borderSubtle, color: t.accent }}
                                        >
                                            <span>Tap to customize {session.isMultiPeriod ? '2-period lab' : 'class'}</span>
                                            <Edit3 size={12} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                DESKTOP VIEW: Full CSES Table Grid (>= md breakpoint)
            ══════════════════════════════════════════════════════════ */}
            <div className="hidden md:block w-full overflow-x-auto">
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'center',
                    fontSize: '11.5px',
                    color: t.text,
                    minWidth: '760px'
                }}>
                    <thead>
                        <tr style={{ background: t.dayHeaderBg, borderBottom: `1px solid ${t.dayHeaderBorder}` }}>
                            <th style={{
                                padding: '10px 12px',
                                fontWeight: 700,
                                color: t.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderRight: `1px solid ${t.dayHeaderBorder}`,
                                width: '80px',
                                minWidth: '80px',
                                maxWidth: '80px',
                                boxSizing: 'border-box'
                            }}>
                                Day
                            </th>
                            {uniqueIntervals.map((interval, idx) => {
                                const isBreak = interval.lectureType === 'Break';
                                return (
                                    <th 
                                        key={idx} 
                                        style={{
                                            padding: '12px 10px',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            color: isBreak ? (isDark ? '#f59e0b' : '#b45309') : t.text,
                                            whiteSpace: 'nowrap',
                                            borderRight: idx < uniqueIntervals.length - 1 ? `1px solid ${t.dayHeaderBorder}` : 'none',
                                            width: '150px',
                                            minWidth: '150px',
                                            textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {formatTime(interval.startMinute)} – {formatTime(interval.endMinute)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                            const workingDaysMap = config?.workingDays || {};
                            const defaultDay = dayNum <= 5 ? 'Full Day' : dayNum === 6 ? 'Half Day' : 'Holiday';
                            const dayType = workingDaysMap[dayNum.toString()] || workingDaysMap[dayNum] || defaultDay;
                            
                            // 1. Holiday Row
                            if (dayType === 'Holiday') {
                                return (
                                    <tr key={dayNum} style={{ borderBottom: `1px solid ${t.tableRowBorder}` }}>
                                        <td style={{
                                            padding: '14px 12px',
                                            fontWeight: 700,
                                            color: t.textFaint,
                                            background: t.surfaceSubtle,
                                            borderRight: `1px solid ${t.border}`,
                                            textAlign: 'left',
                                            width: '80px',
                                            minWidth: '80px',
                                            maxWidth: '80px'
                                        }}>
                                            {daysMap[dayNum]}
                                        </td>
                                        <td 
                                            colSpan={uniqueIntervals.length}
                                            style={{
                                                padding: '14px 12px',
                                                color: t.textFaint,
                                                fontWeight: 600,
                                                letterSpacing: '0.05em',
                                                fontStyle: 'italic',
                                                background: isDark ? 'rgba(239, 68, 68, 0.01)' : 'rgba(239, 68, 68, 0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <CalendarOff size={14} style={{ color: t.textFaint }} />
                                                <span>Holiday</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }

                            // 2. Active Day Row
                            const daySlots = slots.filter(s => s.dayOfWeek === dayNum);
                            const skippedHorizontalIndices = new Set();

                            return (
                                <tr key={dayNum} style={{ borderBottom: `1px solid ${t.tableRowBorder}` }}>
                                    <td style={{
                                        padding: '14px 12px',
                                        fontWeight: 700,
                                        color: t.accent,
                                        background: t.surfaceSubtle,
                                        borderRight: `1px solid ${t.border}`,
                                        textAlign: 'left',
                                        width: '80px',
                                        minWidth: '80px',
                                        maxWidth: '80px'
                                    }}>
                                        {daysMap[dayNum]}
                                    </td>
                                    {uniqueIntervals.map((interval, iIdx) => {
                                        if (skippedHorizontalIndices.has(iIdx)) {
                                            return null;
                                        }

                                        // Find matching slot for this day and time interval
                                        const slot = daySlots.find(s => s.startMinute === interval.startMinute && s.endMinute === interval.endMinute);

                                        if (!slot) {
                                            if (interval.lectureType === 'Break') {
                                                const spanKey = `${interval.startMinute}_${interval.endMinute}`;
                                                const spanInfo = breakRowSpans[spanKey];
                                                
                                                if (spanInfo) {
                                                    if (dayNum === spanInfo.firstDay) {
                                                        return (
                                                            <td
                                                                key={iIdx}
                                                                rowSpan={spanInfo.count}
                                                                style={{
                                                                    background: t.breakBg,
                                                                    color: t.breakText,
                                                                    fontWeight: 600,
                                                                    borderRight: iIdx < uniqueIntervals.length - 1 ? `1px solid ${t.border}` : 'none',
                                                                    borderLeft: `1px solid ${t.border}`,
                                                                    verticalAlign: 'middle',
                                                                    cursor: 'not-allowed',
                                                                    width: '150px',
                                                                    minWidth: '150px',
                                                                    padding: '12px 4px',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '6px'
                                                                }}>
                                                                    {getBreakIcon(interval.breakName || 'Break')}
                                                                    <span style={{ 
                                                                        writingMode: 'vertical-rl', 
                                                                        textTransform: 'uppercase', 
                                                                        letterSpacing: '0.08em', 
                                                                        fontSize: '9.5px',
                                                                        transform: 'rotate(180deg)',
                                                                        fontWeight: 700
                                                                    }}>
                                                                        {interval.breakName || 'Break'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    } else {
                                                        return null;
                                                    }
                                                }
                                            }

                                            return (
                                                <td 
                                                    key={iIdx}
                                                    onClick={() => {
                                                        if (isCustomizing && !isReadOnly && onCellClick) {
                                                            onCellClick({
                                                                dayOfWeek: dayNum,
                                                                startMinute: interval.startMinute,
                                                                endMinute: interval.endMinute,
                                                                lectureType: 'Lecture'
                                                            });
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '14px 12px',
                                                        textAlign: 'center',
                                                        background: 'transparent',
                                                        borderRight: iIdx < uniqueIntervals.length - 1 ? `1px solid ${t.borderSubtle}` : 'none',
                                                        cursor: isCustomizing && !isReadOnly ? 'pointer' : 'default'
                                                    }}
                                                    className={isCustomizing && !isReadOnly ? "hover:opacity-80 transition-all" : ""}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {isCustomizing && !isReadOnly ? (
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                background: t.accentBg,
                                                                border: `1px solid ${t.accentBorder}`,
                                                                color: t.accent,
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '2px'
                                                            }}>
                                                                + Add
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '11px', color: t.textFaint }}>
                                                                –
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }

                                        // Break column
                                        if (slot.lectureType === 'Break') {
                                            const spanKey = `${interval.startMinute}_${interval.endMinute}`;
                                            const spanInfo = breakRowSpans[spanKey];
                                            
                                            if (spanInfo) {
                                                if (dayNum === spanInfo.firstDay) {
                                                    return (
                                                        <td
                                                            key={iIdx}
                                                            rowSpan={spanInfo.count}
                                                            style={{
                                                                background: t.breakBg,
                                                                color: t.breakText,
                                                                fontWeight: 600,
                                                                borderRight: iIdx < uniqueIntervals.length - 1 ? `1px solid ${t.border}` : 'none',
                                                                borderLeft: `1px solid ${t.border}`,
                                                                verticalAlign: 'middle',
                                                                cursor: 'not-allowed',
                                                                width: '150px',
                                                                minWidth: '150px',
                                                                padding: '12px 4px',
                                                                boxSizing: 'border-box'
                                                            }}
                                                            className="break-merged-column"
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                {getBreakIcon(slot.room)}
                                                                <span style={{ 
                                                                    writingMode: 'vertical-rl', 
                                                                    textTransform: 'uppercase', 
                                                                    letterSpacing: '0.08em', 
                                                                    fontSize: '9.5px',
                                                                    transform: 'rotate(180deg)'
                                                                }}>
                                                                    {slot.room || 'Break'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                } else {
                                                    return null;
                                                }
                                            }
                                        }

                                        // Lab merging check (Horizontal colSpan)
                                        let colSpan = 1;
                                        let linkedLabSlot = null;
                                        const isLab = slot.lectureType === 'Lab';
                                        
                                        if (isLab) {
                                            const nextInterval = uniqueIntervals[iIdx + 1];
                                            if (nextInterval) {
                                                const nextSlot = daySlots.find(s => s.startMinute === nextInterval.startMinute && s.endMinute === nextInterval.endMinute);
                                                
                                                const slotSubjId = String(slot.subject?._id || slot.subject || '');
                                                const nextSlotSubjId = String(nextSlot?.subject?._id || nextSlot?.subject || '');
                                                const sameSession = slot.sessionGroupId && nextSlot?.sessionGroupId && slot.sessionGroupId === nextSlot.sessionGroupId;

                                                if (nextSlot && nextSlot.lectureType === 'Lab' && (sameSession || (slotSubjId && slotSubjId === nextSlotSubjId))) {
                                                    colSpan = 2;
                                                    linkedLabSlot = nextSlot;
                                                    skippedHorizontalIndices.add(iIdx + 1);
                                                }
                                            }
                                        }

                                        const slotSubjectId = slot.subject?._id || slot.subject;
                                        const inlineSubjectObj = (slot.subject && typeof slot.subject === 'object' && slot.subject.name)
                                            ? slot.subject
                                            : null;
                                        const subjectObj = inlineSubjectObj
                                            || subjects.find(subj => String(subj._id) === String(slotSubjectId))
                                            || (slotSubjectId ? { _id: slotSubjectId, name: String(slotSubjectId), code: '' } : null);
                                        const isAssigned = !!subjectObj;
                                        const isPersonalChange = checkIsPersonalChange(slot);

                                        return (
                                            <td
                                                key={iIdx}
                                                colSpan={colSpan}
                                                style={{
                                                    padding: colSpan === 2 ? '10px 8px' : '12px 10px',
                                                    background: isAssigned 
                                                        ? (isLab ? t.labCardBg : t.theoryCardBg)
                                                        : 'transparent',
                                                    border: isAssigned 
                                                        ? (isCustomizing && !isReadOnly ? `1px dashed ${t.accent}` : (isLab ? `1px solid ${t.labCardBorder}` : `1px solid ${t.theoryCardBorder}`))
                                                        : `1px dashed ${t.borderSubtle}`,
                                                    borderRadius: isAssigned ? '6px' : '0px',
                                                    transition: 'all 0.15s',
                                                    borderRight: iIdx < uniqueIntervals.length - 1 && colSpan === 1 ? `1px solid ${t.borderSubtle}` : undefined,
                                                    verticalAlign: 'middle',
                                                    cursor: (isCustomizing && !isReadOnly) ? 'pointer' : 'default'
                                                }}
                                                className={isCustomizing && !isReadOnly ? "hover:opacity-90" : ""}
                                                onClick={() => {
                                                    if (isCustomizing && !isReadOnly && onCellClick) {
                                                        onCellClick({
                                                            ...slot,
                                                            linkedSlot: colSpan === 2 ? linkedLabSlot : null,
                                                            isMultiPeriod: colSpan === 2,
                                                            totalPeriods: colSpan,
                                                            blockStartMinute: slot.startMinute,
                                                            blockEndMinute: colSpan === 2 ? linkedLabSlot.endMinute : slot.endMinute,
                                                            daySlots
                                                        });
                                                    }
                                                }}
                                            >
                                                {isAssigned ? (
                                                    colSpan === 2 ? (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '3px',
                                                            width: '100%',
                                                            padding: '4px 2px'
                                                        }}>
                                                            <span style={{ fontSize: '12px', color: t.text, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                                                                {subjectObj.name}
                                                            </span>
                                                            {subjectObj.code && (
                                                                <span style={{ fontSize: '10px', color: t.textMuted, fontFamily: 'monospace' }}>
                                                                    [{subjectObj.code}]
                                                                </span>
                                                            )}
                                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider border ${
                                                                isDark 
                                                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35' 
                                                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                            }`}>
                                                                <FlaskConical size={10} />
                                                                <span>LAB</span>
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: isDark ? 'rgba(224, 231, 255, 0.9)' : '#4338CA', fontFamily: 'monospace', fontWeight: 600 }}>
                                                                {formatTime(slot.startMinute)} – {formatTime(linkedLabSlot.endMinute)}
                                                            </div>
                                                            <span style={{ fontSize: '9px', color: t.textMuted, fontWeight: 500 }}>
                                                                2-period session
                                                            </span>
                                                            {(isPersonalChange || (linkedLabSlot && checkIsPersonalChange(linkedLabSlot))) && (
                                                                <span style={{ fontSize: '9px', color: t.accent, fontFamily: 'monospace', marginTop: '1px' }}>
                                                                    ↳ Personal change
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            style={{ 
                                                                display: 'flex', 
                                                                flexDirection: 'column', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                gap: '3px', 
                                                                width: '100%', 
                                                                height: '100%' 
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '12px', color: t.text, fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>
                                                                {subjectObj.name}
                                                            </span>
                                                            
                                                            {/* Badge showing type */}
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                background: isLab ? t.labCardBg : t.accentBg,
                                                                color: isLab ? t.labCardText : t.accent,
                                                                borderRadius: '4px',
                                                                padding: '2px 6px',
                                                                fontSize: '9.5px',
                                                                fontWeight: 600
                                                            }}>
                                                                {getTypeIcon(slot.lectureType)}
                                                                <span>{slot.lectureType}</span>
                                                            </div>

                                                            {/* Subtle Personal change indicator */}
                                                            {isPersonalChange && (
                                                                <span style={{ 
                                                                    fontSize: '9.5px', 
                                                                    color: t.accent, 
                                                                    fontFamily: 'monospace', 
                                                                    marginTop: '2px' 
                                                                }}>
                                                                    ↳ Personal change
                                                                </span>
                                                            )}
                                                        </div>
                                                    )
                                                ) : (
                                                    <span style={{ fontSize: '11px', color: t.textFaint }}>
                                                        –
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Quick Helper Note */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', color: t.textMuted, fontSize: '11px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} />
                    <span>
                        {isCustomizing 
                            ? 'Select any class slot above to change its subject or effective date.' 
                            : 'Official college baseline is preserved. Use "Customize Timetable" to update your schedule.'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyTimetableGrid;
