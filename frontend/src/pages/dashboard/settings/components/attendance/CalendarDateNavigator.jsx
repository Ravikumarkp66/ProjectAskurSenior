import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';

const CalendarDateNavigator = ({
    selectedDate,
    onSelectDate,
    timetableConfig,
    groupedTimeline = [],
    selectedDayClasses = [],
    events = []
}) => {
    const { isDark } = useTheme();

    const t = useMemo(() => ({
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
        surfaceElevated: isDark ? '#13151D' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        gridGap: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        accent: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.25)',
        cellBg: isDark ? '#12141D' : '#FFFFFF',
        cellBgOtherMonth: isDark ? '#0E1017' : '#F8FAFC',
        cellBgToday: isDark ? '#181B26' : '#F5F3FF',
        cellBgMarked: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ECFDF5',
        cellTextMarked: isDark ? '#6ee7b7' : '#047857',
        cellBgHoliday: isDark ? 'rgba(225, 29, 72, 0.15)' : '#FFF1F2',
        cellTextHoliday: isDark ? '#fda4af' : '#BE123C',
        cellBgExam: isDark ? 'rgba(124, 58, 237, 0.15)' : '#FAF5FF',
        cellTextExam: isDark ? '#d8b4fe' : '#6D28D9',
    }), [isDark]);
    // Current viewed month date state
    const [viewDate, setViewDate] = useState(() => {
        const d = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
        return isNaN(d.getTime()) ? new Date() : d;
    });

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth(); // 0-indexed

    // Format Date to YYYY-MM-DD
    const formatDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayStr = formatDateStr(new Date());

    // Timeline boundaries (prioritize canonical commencementDate / lastWorkingDayDate)
    const rawStart = timetableConfig?.commencementDate || timetableConfig?.semesterStartDate;
    const rawEnd = timetableConfig?.lastWorkingDayDate || timetableConfig?.lastWorkingDate;
    const startDateStr = rawStart ? formatDateStr(new Date(rawStart)) : null;
    const endDateStr = rawEnd ? formatDateStr(new Date(rawEnd)) : null;

    // Month Navigation
    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Pre-index events by date (YYYY-MM-DD)
    const eventsByDate = useMemo(() => {
        const map = new Map();
        for (const ev of events) {
            if (!ev.startDate) continue;
            const s = new Date(ev.startDate);
            const e = new Date(ev.endDate || ev.startDate);
            let cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
            const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
            while (cur <= last) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, '0');
                const d = String(cur.getDate()).padStart(2, '0');
                const key = `${y}-${m}-${d}`;
                if (!map.has(key)) {
                    map.set(key, []);
                }
                map.get(key).push(ev);
                cur.setDate(cur.getDate() + 1);
            }
        }
        return map;
    }, [events]);

    // Build days matrix for the month (Mon - Sun)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get starting day index (0 for Monday, 6 for Sunday)
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const calendarDays = [];

    const isMarkedStatus = (status) => {
        if (!status) return false;
        const s = String(status).trim().toUpperCase();
        return s !== 'YET TO BE TAKEN' && s !== 'NOT_MARKED' && s !== 'PENDING' && s !== '' && s !== 'NULL' && s !== 'UNDEFINED';
    };

    // Map of date status: { hasClasses, allMarked }
    const dateStatusMap = new Map();
    for (const g of groupedTimeline) {
        if (!g.date) continue;
        const dateKey = String(g.date).split('T')[0];
        const slots = g.slots || g.classes || [];
        const hasClasses = slots.length > 0;
        const allMarked = hasClasses && slots.every(s => isMarkedStatus(s.status));
        dateStatusMap.set(dateKey, { hasClasses, allMarked });
    }

    // Overlay live state for selectedDate
    if (selectedDate && selectedDayClasses && selectedDayClasses.length > 0) {
        const dateKey = String(selectedDate).split('T')[0];
        const hasClasses = selectedDayClasses.length > 0;
        const allMarked = hasClasses && selectedDayClasses.every(s => isMarkedStatus(s.status));
        dateStatusMap.set(dateKey, { hasClasses, allMarked });
    }

    for (let i = startDayIdx - 1; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(currentYear, currentMonth, day);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: true });
    }

    // Remaining slots to fill 35 or 42 grid slots
    const totalSlots = calendarDays.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - calendarDays.length;
    for (let day = 1; day <= remainingSlots; day++) {
        const d = new Date(currentYear, currentMonth + 1, day);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Selected date events
    const selectedEvents = eventsByDate.get(selectedDate) || [];

    return (
        <div 
            className="w-full flex flex-col gap-3 p-3.5 sm:p-4 rounded-xl border select-none font-mono"
            style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}
        >
            {/* Header: Month / Year & Compact Nav */}
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: t.text }}>
                    {monthNames[currentMonth]} {currentYear}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        title="Previous Month"
                        className="p-1 rounded transition-colors border hover:opacity-80"
                        style={{ borderColor: t.border, color: t.textMuted }}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        title="Next Month"
                        className="p-1 rounded transition-colors border hover:opacity-80"
                        style={{ borderColor: t.border, color: t.textMuted }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* CSES Sheet Matrix Grid */}
            <div 
                className="w-full border rounded-lg overflow-hidden"
                style={{ borderColor: t.border, backgroundColor: t.surfaceElevated }}
            >
                {/* Weekday Header Row */}
                <div 
                    className="grid grid-cols-7 border-b text-center"
                    style={{ borderBottomColor: t.border, backgroundColor: t.surfaceSubtle }}
                >
                    {weekDayLabels.map(day => (
                        <div key={day} className="py-2 text-[11px] font-semibold tracking-wider" style={{ color: t.textMuted }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid (Matrix Cells) */}
                <div className="grid grid-cols-7 gap-[1px]" style={{ backgroundColor: t.gridGap }}>
                    {calendarDays.map((item, idx) => {
                        const isSelected = item.dateStr === selectedDate;
                        const isToday = item.dateStr === todayStr;
                        const dateStatus = dateStatusMap.get(item.dateStr) || { hasClasses: false, allMarked: false };
                        const hasClasses = dateStatus.hasClasses;
                        const allMarked = dateStatus.allMarked;

                        // Check semester bounds
                        const isOutOfTimeline = (startDateStr && item.dateStr < startDateStr) || (endDateStr && item.dateStr > endDateStr);

                        // Event detection for this date
                        const dayEvs = eventsByDate.get(item.dateStr) || [];
                        const isHoliday = dayEvs.some(e => 
                            e.eventType === 'Holiday / Closure' || 
                            e.type === 'HOLIDAY' || 
                            e.suspensionType === 'full_day' || 
                            (e.classesSuspended && (!e.suspensionType || e.suspensionType === 'none' || e.suspensionType === 'full_day')) || 
                            /holiday|vacation/i.test(e.title)
                        );
                        const isTimeRangeSuspended = !isHoliday && dayEvs.some(e => e.suspensionType === 'time_range');
                        const isExam = !isHoliday && dayEvs.some(e => e.eventType === 'Exam' || e.type === 'EXAM');
                        const isOtherEvent = !isHoliday && !isExam && dayEvs.length > 0;

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => onSelectDate(item.dateStr)}
                                className={`h-10 sm:h-11 flex flex-col items-center justify-center relative transition-all text-xs font-mono ${
                                    isSelected
                                        ? 'bg-violet-600 text-white font-bold z-10 shadow-sm'
                                        : 'hover:opacity-90'
                                } ${isOutOfTimeline && !isHoliday && !isOtherEvent ? 'opacity-40' : ''} cursor-pointer`}
                                style={!isSelected ? (
                                    isHoliday
                                        ? { backgroundColor: t.cellBgHoliday, color: t.cellTextHoliday, fontWeight: 600 }
                                        : isExam
                                            ? { backgroundColor: t.cellBgExam, color: t.cellTextExam, fontWeight: 600 }
                                            : allMarked
                                                ? { backgroundColor: t.cellBgMarked, color: t.cellTextMarked, fontWeight: 600 }
                                                : item.isCurrentMonth
                                                    ? isToday
                                                        ? { backgroundColor: t.cellBgToday, color: t.accent, fontWeight: 700 }
                                                        : { backgroundColor: t.cellBg, color: t.text }
                                                    : { backgroundColor: t.cellBgOtherMonth, color: t.textFaint }
                                ) : undefined}
                            >
                                <span className={`leading-none ${isToday && !isSelected ? 'underline decoration-violet-500 decoration-2 underline-offset-2 font-bold' : ''}`}>
                                    {item.date.getDate()}
                                </span>

                                {/* Micro Indicator Dots Row */}
                                <div className="flex items-center gap-1 mt-1">
                                    {isHoliday ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Holiday / Classes Suspended" />
                                    ) : isTimeRangeSuspended ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Partial Suspension (Time Range)" />
                                    ) : isExam ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" title="Exam / Test" />
                                    ) : isOtherEvent ? (
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="College Event" />
                                    ) : null}

                                    {hasClasses && !isSelected && !isHoliday && (
                                        <span 
                                            className={`w-1 h-1 rounded-full ${
                                                allMarked ? 'bg-emerald-500' : 'bg-sky-500'
                                            }`}
                                        />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Events Strip */}
            {selectedEvents.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-0.5">
                    {selectedEvents.map((ev, idx) => {
                        const isFullDay = ev.eventType === 'Holiday / Closure' || 
                            ev.suspensionType === 'full_day' || 
                            (ev.classesSuspended && (!ev.suspensionType || ev.suspensionType === 'none' || ev.suspensionType === 'full_day')) || 
                            /holiday|vacation/i.test(ev.title);
                        const isTimeRange = !isFullDay && ev.suspensionType === 'time_range' && ev.suspensionStartTime && ev.suspensionEndTime;

                        return (
                            <div 
                                key={idx} 
                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                                    isFullDay 
                                        ? (isDark ? 'bg-rose-950/20 border-rose-500/25 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900')
                                        : isTimeRange
                                            ? (isDark ? 'bg-amber-950/20 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900')
                                            : ''
                                }`}
                                style={!isFullDay && !isTimeRange ? {
                                    backgroundColor: t.surfaceSubtle,
                                    borderColor: t.border,
                                    color: t.text
                                } : undefined}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                        isFullDay 
                                            ? 'bg-rose-500' 
                                            : isTimeRange
                                                ? 'bg-amber-500'
                                                : ev.eventType === 'Exam' 
                                                    ? 'bg-violet-500' 
                                                    : 'bg-sky-500'
                                    }`} />
                                    <span className="font-semibold" style={{ color: t.text }}>{ev.title}</span>
                                    <span 
                                        className="text-[10px] px-1.5 py-0.5 rounded border"
                                        style={{ backgroundColor: t.surface, borderColor: t.border, color: t.textMuted }}
                                    >
                                        {ev.eventType || ev.type || 'Event'}
                                    </span>
                                </div>
                                {isFullDay ? (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                        isDark ? 'text-rose-400 bg-rose-500/15 border-rose-500/30' : 'text-rose-700 bg-rose-100 border-rose-200'
                                    }`}>
                                        Classes Suspended
                                    </span>
                                ) : isTimeRange ? (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                        isDark ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-amber-700 bg-amber-100 border-amber-200'
                                    }`}>
                                        Suspended {ev.suspensionStartTime}–{ev.suspensionEndTime}
                                    </span>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Micro Legend Bar */}
            <div className="flex flex-wrap items-center justify-between px-1 text-[11px] pt-0.5 gap-2" style={{ color: t.textMuted }}>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
                        <span>Today</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Marked</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                        <span>Holiday</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        <span>Partial</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                        <span>Event</span>
                    </span>
                </div>
                <span style={{ color: t.textFaint }}>
                    {timetableConfig?.commencementDate ? `Term: ${timetableConfig.commencementDate.slice(5)} to ${timetableConfig.lastWorkingDayDate?.slice(5) || 'End'}` : ''}
                </span>
            </div>
        </div>
    );
};

export default CalendarDateNavigator;
