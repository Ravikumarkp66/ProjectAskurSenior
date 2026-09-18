import React, { useState, useMemo } from 'react';
import { 
    Check, X, RotateCcw, ChevronLeft, ChevronRight, CalendarDays, AlertCircle, Clock,
    MoreVertical, Pause, Play, Edit3, Undo2
} from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';
import CalendarDateNavigator from './CalendarDateNavigator';
import EditClassOccurrenceModal from './EditClassOccurrenceModal';
import SuspendClassModal from './SuspendClassModal';

const DailyAttendanceWorkspace = ({
    selectedDate,
    onSelectDate,
    onPrevDay,
    onNextDay,
    onTodayClick,
    dayClasses = [],
    isLoading,
    onMarkAttendance,
    onMarkAllPresent,
    onResetDayAttendance,
    unconfirmedPastCount = 0,
    onQuickMarkPast,
    readOnly,
    timetableConfig,
    groupedTimeline = [],
    events = [],
    dayEventInfo = {},
    canEditAnytime = false,
    registeredSubjects = [],
    onConfirmSubjectSwap,
    onRestoreOriginalClass
}) => {
    const { isDark } = useTheme();

    const t = useMemo(() => ({
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
        surfaceElevated: isDark ? '#13151D' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)',
        divider: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        accent: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.25)',
        rowHover: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
        nowBg: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.05)',
    }), [isDark]);

    // State to toggle inline quick-change controls for marked cards
    const [activeChangeSlotId, setActiveChangeSlotId] = useState(null);
    const [activeMenuSlotId, setActiveMenuSlotId] = useState(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [editingClassItem, setEditingClassItem] = useState(null);
    const [suspendingClassItem, setSuspendingClassItem] = useState(null);

    const getLocalDateString = (d = new Date()) => {
        const date = new Date(d);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDateHeading = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const todayStr = getLocalDateString(new Date());
    const isPastDate = selectedDate < todayStr;
    const isTodayDate = selectedDate === todayStr;
    const isFutureDate = selectedDate > todayStr;

    // Filter official events applicable to selectedDate
    const dayEvents = useMemo(() => {
        if (dayEventInfo?.dayEvents && dayEventInfo.dayEvents.length > 0) {
            return dayEventInfo.dayEvents;
        }
        if (!events || events.length === 0 || !selectedDate) return [];
        return events.filter(ev => {
            if (!ev.startDate) return false;
            const s = new Date(ev.startDate).toISOString().slice(0, 10);
            const e = new Date(ev.endDate || ev.startDate).toISOString().slice(0, 10);
            return s <= selectedDate && selectedDate <= e;
        });
    }, [dayEventInfo, events, selectedDate]);

    // Check full-day suspension vs time-range suspension
    const fullDayEvent = dayEvents.find(e => 
        e.suspensionType === 'full_day' || 
        e.eventType === 'Holiday / Closure' || 
        (e.classesSuspended && (!e.suspensionType || e.suspensionType === 'none' || e.suspensionType === 'full_day')) ||
        /holiday|closure|vacation|preparation.*holiday/i.test(e.title || '')
    );

    const isClassesSuspended = Boolean(dayEventInfo?.classesSuspended && dayEventInfo?.suspensionType !== 'time_range') || 
        Boolean(fullDayEvent);

    const activeDayEvent = isClassesSuspended 
        ? (dayEventInfo?.activeEvent || fullDayEvent || dayEvents[0] || null)
        : (dayEventInfo?.activeEvent || dayEvents[0] || null);

    const timeRangeEvent = !isClassesSuspended && (
        dayEvents.find(e => e.suspensionType === 'time_range' && e.suspensionStartTime && e.suspensionEndTime) ||
        (dayEventInfo?.suspensionType === 'time_range' && dayEventInfo?.timeRangeSuspension ? {
            title: dayEventInfo.timeRangeSuspension.title || dayEventInfo.activeEvent?.title || 'Special Event',
            suspensionStartTime: dayEventInfo.timeRangeSuspension.startTime,
            suspensionEndTime: dayEventInfo.timeRangeSuspension.endTime
        } : null)
    );

    // Live NOW class detection
    const checkIsNow = (timeSlot) => {
        if (!isTodayDate || !timeSlot) return false;
        try {
            const parts = timeSlot.split('-').map(s => s.trim());
            if (parts.length < 2) return false;
            const parseMinutes = (timeStr) => {
                const [hStr, mStr] = timeStr.split(':');
                return parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10);
            };
            const startMins = parseMinutes(parts[0]);
            const endMins = parseMinutes(parts[1]);
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            return nowMins >= startMins && nowMins <= endMins;
        } catch {
            return false;
        }
    };

    const normStatus = (s) => (s ? String(s).trim().toUpperCase() : '');
    const isPresentStatus = (s) => ['PRESENT', 'ON DUTY', 'ON_DUTY'].includes(normStatus(s));
    const isAbsentStatus = (s) => ['ABSENT', 'MEDICAL LEAVE', 'MEDICAL_LEAVE'].includes(normStatus(s));
    const isSuspendedStatus = (s) => ['SUSPENDED', 'SUSPEND'].includes(normStatus(s));
    const isMarkedStatus = (s) => {
        const sn = normStatus(s);
        return sn !== '' && sn !== 'YET TO BE TAKEN' && sn !== 'NOT_MARKED' && sn !== 'PENDING' && sn !== 'NULL' && sn !== 'UNDEFINED';
    };
    const isUnmarkedStatus = (s) => {
        const sn = normStatus(s);
        return !sn || sn === 'YET TO BE TAKEN' || sn === 'NOT_MARKED' || sn === 'PENDING';
    };

    const totalClasses = isClassesSuspended ? 0 : dayClasses.length;
    const markedCount = isClassesSuspended ? 0 : dayClasses.filter(c => isMarkedStatus(c.status)).length;
    const progressPct = totalClasses > 0 ? (markedCount / totalClasses) * 100 : 0;
    const allMarked = totalClasses > 0 && markedCount === totalClasses;

    const handleConfirmOverride = async ({ classItem, scheduledSubjectId, newSubjectId, status }) => {
        if (onConfirmSubjectSwap) {
            await onConfirmSubjectSwap({ classItem, scheduledSubjectId, newSubjectId, status });
        } else {
            await onMarkAttendance({ ...classItem, scheduledSubjectId, subjectId: newSubjectId }, status);
        }
    };

    const handleRestoreOriginal = async (classItem) => {
        if (onRestoreOriginalClass) {
            await onRestoreOriginalClass(classItem);
        } else if (onConfirmSubjectSwap && classItem.scheduledSubjectId) {
            await onConfirmSubjectSwap({
                classItem,
                scheduledSubjectId: classItem.scheduledSubjectId,
                newSubjectId: classItem.scheduledSubjectId,
                status: classItem.status || 'Present'
            });
        }
    };

    const handleConfirmSuspend = async (classItem) => {
        await onMarkAttendance(classItem, 'Suspended');
    };

    return (
        <section className="w-full flex flex-col gap-5 font-sans" style={{ color: t.text }}>
            {/* ════════════════════════════════════════════════════════════════
                1. HEADER & DATE SWITCHER (CSES Sheet Style)
            ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b" style={{ borderBottomColor: t.divider }}>
                <div>
                    <h1 className="text-xl font-bold tracking-tight" style={{ color: t.text }}>
                        Today's Classes
                    </h1>
                    <div className="flex items-center gap-2 pt-0.5 text-xs font-mono" style={{ color: t.textMuted }}>
                        <span>{formatDateHeading(selectedDate)}</span>
                        {isTodayDate && (
                            <span 
                                className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border"
                                style={{ backgroundColor: t.accentBg, color: t.accent, borderColor: t.accentBorder }}
                            >
                                Today
                            </span>
                        )}
                        {isClassesSuspended ? (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${
                                isDark 
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                                Suspended
                            </span>
                        ) : timeRangeEvent ? (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${
                                isDark 
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                Suspended {timeRangeEvent.suspensionStartTime}–{timeRangeEvent.suspensionEndTime}
                            </span>
                        ) : null}
                        {canEditAnytime && (isFutureDate || readOnly) && (
                            <span 
                                className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border"
                                style={{ backgroundColor: t.accentBg, color: t.accent, borderColor: t.accentBorder }}
                            >
                                Admin Editable
                            </span>
                        )}
                    </div>
                </div>

                {/* Day Navigation Controls + Full Calendar Toggle */}
                <div className="flex items-center gap-2">
                    <div 
                        className="flex items-center rounded-lg p-0.5 border"
                        style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border }}
                    >
                        <button
                            type="button"
                            onClick={onPrevDay}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: t.textMuted }}
                            title="Previous Day"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={onTodayClick}
                            className="px-3 py-1 text-xs font-mono font-medium rounded transition-colors border"
                            style={isTodayDate ? {
                                backgroundColor: t.accentBg,
                                color: t.accent,
                                borderColor: t.accentBorder,
                                fontWeight: 700
                            } : {
                                color: t.textMuted,
                                borderColor: 'transparent'
                            }}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={onNextDay}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: t.textMuted }}
                            title="Next Day"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsCalendarOpen(prev => !prev)}
                        className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-colors border"
                        style={isCalendarOpen ? {
                            backgroundColor: t.accentBg,
                            color: t.accent,
                            borderColor: t.accentBorder
                        } : {
                            backgroundColor: t.surfaceSubtle,
                            borderColor: t.border,
                            color: t.textMuted
                        }}
                    >
                        <CalendarDays size={13} style={{ color: isCalendarOpen ? t.accent : t.textMuted }} />
                        <span className="hidden sm:inline">{isCalendarOpen ? 'Hide' : 'Full Calendar'}</span>
                    </button>
                </div>
            </div>

            {/* Collapsible Month Calendar */}
            {isCalendarOpen && (
                <div className="rounded-xl overflow-hidden">
                    <CalendarDateNavigator
                        selectedDate={selectedDate}
                        onSelectDate={(d) => {
                            if (onSelectDate) onSelectDate(d);
                            // Do NOT close calendar on date click so the user can easily browse dates
                        }}
                        timetableConfig={timetableConfig}
                        groupedTimeline={groupedTimeline}
                        selectedDayClasses={dayClasses}
                        events={events}
                    />
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                2. COMPACT SUMMARY BOX
            ════════════════════════════════════════════════════════════════ */}
            {isClassesSuspended ? (
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-mono ${
                    isDark ? 'bg-[#14101A] border-rose-500/25' : 'bg-rose-50/70 border-rose-200'
                }`}>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-semibold" style={{ color: t.text }}>
                            {activeDayEvent?.title || 'Holiday / Closure'}
                        </span>
                        <span className="hidden sm:inline" style={{ color: t.textFaint }}>·</span>
                        <span className="font-medium hidden sm:inline text-rose-500">
                            Classes Suspended
                        </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                        isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                        0 classes today
                    </span>
                </div>
            ) : (
                <div 
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg border text-xs font-mono"
                    style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border }}
                >
                    <span className="font-medium" style={{ color: t.text }}>
                        {totalClasses} {totalClasses === 1 ? 'class' : 'classes'} today
                    </span>
                    
                    <div className="flex items-center gap-3">
                        <span className="font-semibold" style={{ color: t.text }}>
                            {markedCount} / {totalClasses} marked
                        </span>
                        {totalClasses > 0 && (
                            <div 
                                className="w-20 h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: isDark ? '#27272a' : '#E2E8F0' }}
                            >
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                        )}
                        {totalClasses > 0 && (!readOnly || canEditAnytime) && (!isFutureDate || canEditAnytime) && (
                            <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
                                {!allMarked && (
                                    <button
                                        type="button"
                                        onClick={onMarkAllPresent}
                                        className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-all ${
                                            isDark 
                                                ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30' 
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                        }`}
                                        title="Mark all unrecorded classes as Present"
                                    >
                                        ✓ All Present
                                    </button>
                                )}
                                {markedCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onResetDayAttendance(selectedDate)}
                                        className="p-1 rounded transition-all hover:opacity-80"
                                        style={{ color: t.textMuted }}
                                        title="Reset all marked classes to unmarked"
                                    >
                                        <RotateCcw size={13} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Time-Range Suspension Notice */}
            {timeRangeEvent && !isClassesSuspended && (
                <div className={`px-4 py-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs font-mono ${
                    isDark ? 'bg-amber-500/10 border-amber-500/25' : 'bg-amber-50 border-amber-200'
                }`}>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-500 flex-shrink-0" />
                        <span className={`font-semibold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                            {timeRangeEvent.title || 'Official Event'}
                        </span>
                        <span className="text-zinc-500 hidden sm:inline">·</span>
                        <span className={`hidden sm:inline ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                            Classes suspended <strong>{timeRangeEvent.suspensionStartTime} – {timeRangeEvent.suspensionEndTime}</strong>
                        </span>
                        <span className={`sm:hidden ${isDark ? 'text-amber-300/90' : 'text-amber-800'}`}>
                            Suspended {timeRangeEvent.suspensionStartTime}–{timeRangeEvent.suspensionEndTime}
                        </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                        Partial
                    </span>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                3. UNCONFIRMED PAST CLASSES NOTICE (Subtle banner)
            ════════════════════════════════════════════════════════════════ */}
            {!isClassesSuspended && unconfirmedPastCount > 0 && !readOnly && (
                <div className={`p-3 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                    isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/80 border-amber-200'
                }`}>
                    <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-amber-300' : 'text-amber-850'}`}>
                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                        <span>You have <strong>{unconfirmedPastCount}</strong> past unmarked {unconfirmedPastCount === 1 ? 'class' : 'classes'}.</span>
                    </div>
                    {onQuickMarkPast && (
                        <button
                            type="button"
                            onClick={onQuickMarkPast}
                            className={`px-2.5 py-0.5 rounded text-xs font-mono font-medium border transition-all flex-shrink-0 ${
                                isDark 
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30' 
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                            }`}
                        >
                            Confirm all as Present
                        </button>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                4. MASTER GRID CLASS ROWS (Strict 3-Column Alignment)
                Columns: TIME (170px) | CLASS (1fr) | STATUS & ACTIONS (auto)
            ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col">
                {isLoading ? (
                    <div className="py-12 text-center text-xs font-mono animate-pulse" style={{ color: t.textMuted }}>
                        Loading scheduled classes...
                    </div>
                ) : isClassesSuspended ? (
                    <div className={`py-14 text-center border border-dashed rounded-xl flex flex-col items-center justify-center gap-2.5 mt-2 font-mono ${
                        isDark ? 'border-rose-500/30 bg-[#14101A]/60' : 'border-rose-200 bg-rose-50/40'
                    }`}>
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg ${
                            isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-100 border-rose-200 text-rose-600'
                        }`}>
                            {activeDayEvent?.eventType === 'Exam' ? '📝' : activeDayEvent?.eventType === 'College Event' ? '🎯' : '🌴'}
                        </div>
                        <div className="text-base font-bold" style={{ color: t.text }}>
                            {activeDayEvent?.title || 'Classes Suspended'}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span 
                                className="px-2 py-0.5 rounded text-[11px] border"
                                style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border, color: t.textMuted }}
                            >
                                {activeDayEvent?.eventType || 'Holiday / Closure'}
                            </span>
                            <span className="text-rose-500 font-semibold text-[11px]">
                                ● Regular classes suspended
                            </span>
                        </div>
                        <p className="text-xs max-w-sm mt-1" style={{ color: t.textMuted }}>
                            {activeDayEvent?.description || 'No classes scheduled on this day in accordance with the official academic calendar.'}
                        </p>
                    </div>
                ) : totalClasses === 0 ? (
                    <div 
                        className="py-14 text-center border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 mt-2 font-mono"
                        style={{ backgroundColor: t.surfaceSubtle, borderColor: t.border }}
                    >
                        <Clock size={24} style={{ color: t.textFaint }} className="stroke-[1.5]" />
                        <div className="text-sm font-semibold" style={{ color: t.text }}>
                            No classes scheduled for this date.
                        </div>
                        <p className="text-xs max-w-sm" style={{ color: t.textMuted }}>
                            {isFutureDate 
                                ? 'No teaching slots scheduled.' 
                                : 'Enjoy your day off or review your semester attendance.'}
                        </p>
                    </div>
                ) : (
                    dayClasses.map((item, idx) => {
                        const slotId = item._id || `${item.subjectId || idx}_${item.timeSlot}`;
                        const isMarked = isMarkedStatus(item.status);
                        const isPresent = isPresentStatus(item.status);
                        const isAbsent = isAbsentStatus(item.status);
                        const isSuspended = isSuspendedStatus(item.status);
                        const isUpcoming = isFutureDate && !canEditAnytime;
                        const isNow = checkIsNow(item.timeSlot);
                        const isEditingThis = activeChangeSlotId === slotId;
                        const isMenuOpen = activeMenuSlotId === slotId;
                        const isLab = String(item.lectureType || '').toLowerCase() === 'lab';
                        const isSubstituted = Boolean(item.isSubjectChanged || (item.scheduledSubjectId && item.scheduledSubjectId !== item.subjectId));

                        return (
                            <div 
                                key={slotId}
                                className={`grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)_auto] md:grid-cols-[160px_minmax(0,1fr)_260px] items-center gap-3 sm:gap-6 py-4 border-b transition-colors relative ${
                                    isNow 
                                        ? '-mx-3 px-3 rounded-lg border' 
                                        : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.01]'
                                }`}
                                style={isNow ? {
                                    backgroundColor: t.nowBg,
                                    borderColor: t.accentBorder,
                                    borderBottomColor: t.accentBorder
                                } : {
                                    borderBottomColor: t.divider
                                }}
                            >
                                {/* ── COLUMN 1: TIME ANCHOR (160px Monospace, Violet Accent) ── */}
                                <div 
                                    className="flex items-center gap-2 font-mono text-[16px] sm:text-[17px] font-bold tracking-tight flex-shrink-0"
                                    style={{ color: t.accent }}
                                >
                                    <span>{item.timeSlot}</span>
                                    {isNow && (
                                        <span 
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ml-1 border"
                                            style={{ backgroundColor: t.accentBg, color: t.accent, borderColor: t.accentBorder }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                                            NOW
                                        </span>
                                    )}
                                </div>

                                {/* ── COLUMN 2: CLASS INFORMATION (Strong Title, Muted Compact Metadata) ── */}
                                <div className="flex flex-col min-w-0 pr-2">
                                    <div className="flex items-baseline flex-wrap gap-2">
                                        <span className="text-[15px] sm:text-[16px] font-semibold leading-snug break-words" style={{ color: t.text }}>
                                            {item.subjectName || item.subject?.name || 'Class'}
                                        </span>
                                        {isSubstituted && (
                                            <span 
                                                className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border whitespace-nowrap" 
                                                style={{ backgroundColor: t.accentBg, color: t.accent, borderColor: t.accentBorder }}
                                                title={`Originally: ${item.scheduledSubjectName || 'Original Class'}`}
                                            >
                                                Substituted
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1" style={{ color: t.textMuted }}>
                                        {item.subjectCode && (
                                            <span className="font-semibold" style={{ color: t.text }}>{item.subjectCode}</span>
                                        )}
                                        {item.subjectCode && <span>·</span>}
                                        {isLab ? (
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                                isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'
                                            }`}>
                                                LAB{item.batchGroup && item.batchGroup !== 'ALL' ? ` (${item.batchGroup})` : ''}
                                            </span>
                                        ) : (
                                            <span style={{ color: t.textMuted }}>Theory</span>
                                        )}
                                        {item.credits > 0 && (
                                            <>
                                                <span>·</span>
                                                <span style={{ color: t.textFaint }}>{item.credits} Cr</span>
                                            </>
                                        )}
                                        {item.room && (
                                            <>
                                                <span>·</span>
                                                <span style={{ color: t.textFaint }}>Rm {item.room}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── COLUMN 3: STATUS / ACTIONS (Symmetrical 260px Right Alignment) ── */}
                                <div className="flex items-center justify-start sm:justify-end gap-2 flex-shrink-0 relative">
                                    {/* 1. UPCOMING STATE */}
                                    {isUpcoming ? (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wide border ${
                                                isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                            }`}>
                                                UPCOMING
                                            </span>
                                        </div>
                                    ) : isEditingThis ? (
                                        /* Inline Quick Change Mode */
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onMarkAttendance(item, 'Present');
                                                    setActiveChangeSlotId(null);
                                                }}
                                                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all flex items-center gap-1 ${
                                                    isPresent
                                                        ? 'bg-emerald-600 text-white font-bold'
                                                        : isDark 
                                                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35'
                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}
                                            >
                                                <Check size={12} strokeWidth={2.5} />
                                                <span>Present</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onMarkAttendance(item, 'Absent');
                                                    setActiveChangeSlotId(null);
                                                }}
                                                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all flex items-center gap-1 ${
                                                    isAbsent
                                                        ? 'bg-rose-600 text-white font-bold'
                                                        : isDark 
                                                            ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35'
                                                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                                }`}
                                            >
                                                <X size={12} strokeWidth={2.5} />
                                                <span>Absent</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onMarkAttendance(item, 'RESET');
                                                    setActiveChangeSlotId(null);
                                                }}
                                                className="px-2 py-1 text-xs font-mono rounded-md border transition-all hover:opacity-80"
                                                style={{ color: t.textMuted, borderColor: t.border }}
                                                title="Reset to unmarked"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    ) : isPresent ? (
                                        /* 2. PRESENT STATE */
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => (!readOnly || canEditAnytime) && setActiveChangeSlotId(slotId)}
                                                className={`px-3 py-1 rounded-md text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                                                    isDark 
                                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/25' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                }`}
                                                title="Click to change attendance"
                                            >
                                                <Check size={13} strokeWidth={2.5} />
                                                <span>PRESENT</span>
                                            </button>
                                        </div>
                                    ) : isAbsent ? (
                                        /* 3. ABSENT STATE */
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => (!readOnly || canEditAnytime) && setActiveChangeSlotId(slotId)}
                                                className={`px-3 py-1 rounded-md text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                                                    isDark 
                                                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/35 hover:bg-rose-500/25' 
                                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                }`}
                                                title="Click to change attendance"
                                            >
                                                <X size={13} strokeWidth={2.5} />
                                                <span>ABSENT</span>
                                            </button>
                                        </div>
                                    ) : isSuspended ? (
                                        /* 4. SUSPENDED STATE */
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-md text-xs font-mono font-semibold border flex items-center gap-1.5 ${
                                                isDark 
                                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                <Pause size={12} strokeWidth={2.5} />
                                                <span>SUSPENDED</span>
                                            </span>
                                        </div>
                                    ) : (
                                        /* 5. UNMARKED STATE */
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => onMarkAttendance(item, 'Present')}
                                                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-all flex items-center gap-1 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300"
                                                style={{ borderColor: t.border, color: t.text }}
                                            >
                                                <Check size={12} strokeWidth={2} />
                                                <span>Present</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onMarkAttendance(item, 'Absent')}
                                                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md border transition-all flex items-center gap-1 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300"
                                                style={{ borderColor: t.border, color: t.text }}
                                            >
                                                <X size={12} strokeWidth={2} />
                                                <span>Absent</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* ── THREE-DOT ACTION MENU [ ⋮ ] ── */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuSlotId(isMenuOpen ? null : slotId);
                                            }}
                                            className="p-1.5 rounded-md transition-colors"
                                            style={isMenuOpen ? {
                                                backgroundColor: t.accentBg,
                                                color: t.accent
                                            } : {
                                                color: t.textMuted
                                            }}
                                            title="Class options"
                                        >
                                            <MoreVertical size={15} />
                                        </button>

                                        {/* Context Menu Dropdown */}
                                        {isMenuOpen && (
                                            <>
                                                <div 
                                                    className="fixed inset-0 z-40" 
                                                    onClick={() => setActiveMenuSlotId(null)}
                                                />
                                                <div 
                                                    className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-lg border py-1 text-xs font-mono flex flex-col"
                                                    style={{
                                                        backgroundColor: t.surface,
                                                        borderColor: t.border,
                                                        color: t.text,
                                                        boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingClassItem(item);
                                                            setActiveMenuSlotId(null);
                                                        }}
                                                        className="px-3 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                                                        style={{ color: t.text }}
                                                    >
                                                        <Edit3 size={13} style={{ color: t.accent }} />
                                                        <span>Edit class</span>
                                                    </button>

                                                    {isMarked && !isSuspended && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setActiveChangeSlotId(slotId);
                                                                setActiveMenuSlotId(null);
                                                            }}
                                                            className="px-3 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors"
                                                            style={{ color: t.text }}
                                                        >
                                                            <RotateCcw size={13} className="text-cyan-500" />
                                                            <span>Edit attendance</span>
                                                        </button>
                                                    )}

                                                    {!isSuspended ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSuspendingClassItem(item);
                                                                setActiveMenuSlotId(null);
                                                            }}
                                                            className={`px-3 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors ${
                                                                isDark ? 'text-amber-300/90 hover:text-amber-200' : 'text-amber-700 hover:text-amber-800'
                                                            }`}
                                                        >
                                                            <Pause size={13} className="text-amber-500" />
                                                            <span>Suspend class</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onMarkAttendance(item, 'RESET');
                                                                setActiveMenuSlotId(null);
                                                            }}
                                                            className={`px-3 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 transition-colors ${
                                                                isDark ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-700 hover:text-emerald-800'
                                                            }`}
                                                        >
                                                            <Play size={13} className="text-emerald-500" />
                                                            <span>Resume class</span>
                                                        </button>
                                                    )}

                                                    {isSubstituted && (
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                await handleRestoreOriginal(item);
                                                                setActiveMenuSlotId(null);
                                                            }}
                                                            className="px-3 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-2 border-t transition-colors"
                                                            style={{ borderTopColor: t.divider, color: t.accent }}
                                                        >
                                                            <Undo2 size={13} style={{ color: t.accent }} />
                                                            <span>Restore original</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Class Modal (Single-Day / Slot Override) */}
            <EditClassOccurrenceModal
                isOpen={Boolean(editingClassItem)}
                onClose={() => setEditingClassItem(null)}
                classItem={editingClassItem}
                selectedDate={selectedDate}
                registeredSubjects={registeredSubjects}
                onConfirmOverride={handleConfirmOverride}
                onRestoreOriginal={handleRestoreOriginal}
            />

            {/* Suspend Class Confirmation Modal */}
            <SuspendClassModal
                isOpen={Boolean(suspendingClassItem)}
                onClose={() => setSuspendingClassItem(null)}
                classItem={suspendingClassItem}
                selectedDate={selectedDate}
                onConfirmSuspend={handleConfirmSuspend}
            />
        </section>
    );
};

export default DailyAttendanceWorkspace;
