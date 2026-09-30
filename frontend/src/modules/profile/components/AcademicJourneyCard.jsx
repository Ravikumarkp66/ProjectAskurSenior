import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HeatmapGrid from '../../../components/HeatmapGrid';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import {
    useProfileEntitlements,
    PROFILE_FEATURES
} from '../../../features/profile/utils/profileEntitlements';
import { ProfileLockBadge } from '../../../features/profile/components/ProfileLockedPreview';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function usn2year(usn) {
    if (!usn) return null;
    const m = usn.match(/[A-Za-z]{2,3}(\d{2})[A-Za-z]/);
    return m ? 2000 + parseInt(m[1], 10) : null;
}

const getSemestersForYear = (year, joiningYear) => {
    const sems = [];
    const diff = year - joiningYear;
    if (diff >= 0 && diff <= 3) {
        const evenSem = diff * 2;
        if (evenSem >= 1 && evenSem <= 8) sems.push(evenSem);
        const oddSem = diff * 2 + 1;
        if (oddSem >= 1 && oddSem <= 8) sems.push(oddSem);
    }
    return sems;
};

// ─── Nav Button ───────────────────────────────────────────────────────────────
const NavBtn = ({ onClick, disabled, isDark, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            background:     disabled ? 'transparent' : (isDark ? '#15181D' : '#F8FAFC'),
            border:         isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
            borderRadius:   '4px',
            color:          disabled ? (isDark ? '#52525B' : '#D1D5DB') : (isDark ? '#A1A1AA' : '#4B5563'),
            cursor:         disabled ? 'not-allowed' : 'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '24px',
            height:         '24px',
            padding:        0,
            outline:        'none',
            transition:     'background 0.15s, color 0.15s',
        }}
    >
        {children}
    </button>
);

// ─── Main Card ────────────────────────────────────────────────────────────────
const AcademicJourneyCard = ({ onSelectDate }) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isPlus, isFree, isAnonymous } = useProfileEntitlements();

    const academicPalette = useMemo(() => ({
        'none':                 { bg: isDark ? '#15181D' : '#F1F5F9', border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB' },
        'attendance-100':       { bg: isDark ? '#16A34A' : '#16A34A', border: 'none' },
        'attendance-75':        { bg: isDark ? '#22C55E' : '#22C55E', border: 'none' },
        'attendance-50':        { bg: isDark ? '#4ADE80' : '#4ADE80', border: 'none' },
        'attendance-1':         { bg: isDark ? '#86EFAC' : '#86EFAC', border: 'none' },
        'attendance-absent':    { bg: isDark ? '#15181D' : '#F1F5F9', border: isDark ? '1px solid #292E37' : '1px solid #E5E7EB' },
        'holiday':              { bg: isDark ? '#1B1F26' : '#FEF3C7', border: isDark ? '1.5px solid #F59E0B' : '1.5px solid #D97706' },
        'exam':                 { bg: isDark ? '#1B1F26' : '#FEE2E2', border: '1.5px solid #EF4444' },
    }), [isDark]);

    const legendConfig = useMemo(() => [
        { label: 'Attendance',     bg: isDark ? '#22C55E' : '#22C55E',  border: 'none' },
        { label: 'Holiday',        bg: isDark ? '#15181D' : '#FEF3C7',  border: isDark ? '1.5px solid #F59E0B' : '1.5px solid #D97706' },
        { label: 'Exam / CIE',     bg: isDark ? '#15181D' : '#FEE2E2',  border: '1.5px solid #EF4444' },
        { label: 'Event',          bg: isDark ? '#15181D' : '#F8FAFC',  border: isDark ? '1px solid #3F3F46' : '1px solid #D1D5DB', dot: true },
        { label: 'Semester Start', bg: isDark ? '#15181D' : '#F8FAFC',  border: '1.5px solid #8B5CF6' },
        { label: 'Semester End',   bg: isDark ? '#15181D' : '#F8FAFC',  border: '1.5px solid #EC4899' },
        { label: 'Today',          bg: isDark ? '#15181D' : '#F8FAFC',  border: '1.5px solid #06B6D4' }
    ], [isDark]);

    // Derive joining year
    const joiningYear = useMemo(() => (
        usn2year(user?.usn)
        ?? usn2year(user?.username)
        ?? user?.academicProfile?.joiningYear
        ?? 2023
    ), [user?.usn, user?.username, user?.academicProfile?.joiningYear]);

    const minYear = joiningYear;
    const maxYear = joiningYear + 3;

    const defaultYear = useMemo(() => {
        const current = new Date().getFullYear();
        return Math.max(minYear, Math.min(maxYear, current));
    }, [minYear, maxYear]);

    const [activeYear, setActiveYear] = useState(defaultYear);

    useEffect(() => {
        setActiveYear(defaultYear);
    }, [defaultYear]);

    const prev = useCallback(() => setActiveYear(y => Math.max(y - 1, minYear)), [minYear]);
    const next = useCallback(() => setActiveYear(y => Math.min(y + 1, maxYear)), [maxYear]);

    const startDate = useMemo(() => new Date(activeYear, 0, 1),  [activeYear]);
    const endDate   = useMemo(() => new Date(activeYear, 11, 31), [activeYear]);

    const [calendarEvents, setCalendarEvents] = useState([]);
    const [officialSemester, setOfficialSemester] = useState(null);
    const [attendanceTimeline, setAttendanceTimeline] = useState([]);

    useEffect(() => {
        let active = true;
        const fetchEvents = async () => {
            try {
                const startStr = isoKey(startDate);
                const endStr = isoKey(endDate);

                // For Plus users: fetch canonical calendar AND student attendance
                if (isPlus) {
                    const activeSemesters = getSemestersForYear(activeYear, joiningYear);
                    const currentSem = Number(user?.semester || 1);
                    if (currentSem && !activeSemesters.includes(currentSem)) {
                        activeSemesters.push(currentSem);
                    }

                    const [calendarRes, ...attendanceResList] = await Promise.all([
                        apiV2.getStudentAcademicsCalendar({ startDate: startStr, endDate: endStr })
                            .catch(() => null),
                        ...activeSemesters.map(sem =>
                            apiV2.getAttendanceDashboard(sem)
                                .then(res => res.data?.success ? res.data.data : null)
                                .catch(() => null)
                        )
                    ]);

                    if (active) {
                        const newCalendar = calendarRes?.data?.success && Array.isArray(calendarRes.data.data) 
                            ? calendarRes.data.data 
                            : [];
                        const newOfficialSem = calendarRes?.data?.officialSemester || null;

                        const mergedTimeline = [];
                        attendanceResList.forEach(data => {
                            if (data?.groupedTimeline) {
                                mergedTimeline.push(...data.groupedTimeline);
                            }
                        });

                        setCalendarEvents(newCalendar);
                        setOfficialSemester(newOfficialSem);
                        setAttendanceTimeline(mergedTimeline);
                    }
                } else {
                    // For Free & Anonymous users: ONLY fetch public calendar events
                    const calendarRes = await apiV2.getStudentAcademicsCalendar({ startDate: startStr, endDate: endStr })
                        .catch(() => null);

                    if (active) {
                        const newCalendar = calendarRes?.data?.success && Array.isArray(calendarRes.data.data) 
                            ? calendarRes.data.data 
                            : [];
                        const newOfficialSem = calendarRes?.data?.officialSemester || null;

                        setCalendarEvents(newCalendar);
                        setOfficialSemester(newOfficialSem);
                        setAttendanceTimeline([]);
                    }
                }
            } catch (err) {
                console.error('[AcademicJourneyCard] Failed to fetch calendar:', err);
            }
        };

        fetchEvents();
        return () => { active = false; };
    }, [startDate, endDate, activeYear, joiningYear, user?.semester, isPlus]);

    // Contribution Calendar Generator
    const activities = useMemo(() => {
        const map = {};
        const cur = new Date(startDate);
        const todayObj = new Date();
        const todayKey = isoKey(todayObj);

        const semStartKey = officialSemester?.startDate ? isoKey(new Date(officialSemester.startDate)) : null;
        const semEndKey = officialSemester?.endDate ? isoKey(new Date(officialSemester.endDate)) : null;

        while (cur <= endDate) {
            const dKey = isoKey(cur);

            let baseState = 'none';
            let attendanceValue = 0;
            let overlays = [];
            let metadata = {};

            if (dKey === todayKey) {
                overlays.push('today');
            }
            if (semStartKey && dKey === semStartKey) {
                overlays.push('semesterStart');
                metadata.semesterStartLabel = `Semester ${officialSemester.number || ''} Started`;
            }
            if (semEndKey && dKey === semEndKey) {
                overlays.push('semesterEnd');
                metadata.semesterEndLabel = `Semester ${officialSemester.number || ''} Ended`;
            }

            // Attendance Layer (Plus only)
            let hasAttendance = false;
            if (isPlus && dKey <= todayKey) {
                const attEntry = attendanceTimeline.find(entry => entry.date === dKey);
                if (attEntry && attEntry.expectedClasses > 0) {
                    hasAttendance = true;
                    const expected = attEntry.expectedClasses;
                    const present = attEntry.present;
                    const absent = attEntry.absent;

                    const pct = expected > 0 ? (present / expected) * 100 : 100;
                    attendanceValue = Math.round(pct);
                    metadata.attendancePercentage = attendanceValue;
                    metadata.expectedClasses = expected;
                    metadata.attendedClasses = present;
                    metadata.absentClasses = absent;
                }
            } else if (!isPlus && dKey <= todayKey && cur.getDay() !== 0 && cur.getDay() !== 6) {
                // Background subtle placeholder pattern for preview
                const dayNum = cur.getDate();
                if (dayNum % 7 !== 0) {
                    hasAttendance = true;
                    attendanceValue = (dayNum % 3 === 0) ? 75 : 100;
                }
            }

            // Canonical Events Layer
            const dayEvents = calendarEvents.filter(e => {
                if (!e.startDate) return false;
                const startKey = isoKey(new Date(e.startDate));
                const endKey = e.endDate ? isoKey(new Date(e.endDate)) : startKey;
                return dKey >= startKey && dKey <= endKey;
            });

            metadata.events = dayEvents.map(e => ({
                title: e.title,
                eventType: e.eventType,
                scope: e.scope,
                description: e.description || '',
                allDay: e.allDay,
                startTime: e.startTime,
                endTime: e.endTime,
                isCancelled: e.status === 'CANCELLED'
            }));

            const activeEvents = dayEvents.filter(e => e.status !== 'CANCELLED');
            const hasExam = activeEvents.some(e => e.eventType === 'Exam');
            const hasHoliday = activeEvents.some(e => e.eventType === 'Holiday / Closure');
            const hasNormalEvent = activeEvents.some(e => ['College Event', 'Academic Event', 'Other'].includes(e.eventType));

            if (hasExam) {
                overlays.push('exam');
                const examEv = activeEvents.find(e => e.eventType === 'Exam');
                metadata.examTitle = examEv?.title || 'Exam';
            }
            if (hasHoliday) {
                overlays.push('holiday');
                const holEv = activeEvents.find(e => e.eventType === 'Holiday / Closure');
                metadata.holidayName = holEv?.title || 'Holiday';
                metadata.holidayType = 'Holiday';
            }
            if (hasNormalEvent && !hasExam && !hasHoliday) {
                overlays.push('eventDot');
            }

            let status = 'none';
            if (hasAttendance) {
                baseState = 'attendance';
                if (attendanceValue === 100) {
                    status = 'attendance-100';
                } else if (attendanceValue >= 75) {
                    status = 'attendance-75';
                } else if (attendanceValue >= 50) {
                    status = 'attendance-50';
                } else {
                    status = 'attendance-1';
                }
            } else if (hasExam) {
                baseState = 'exam';
                status = 'exam';
            } else if (hasHoliday) {
                baseState = 'holiday';
                status = 'holiday';
            } else {
                baseState = 'none';
                status = 'none';
            }

            map[dKey] = {
                date: dKey,
                status,
                baseState,
                attendance: attendanceValue,
                overlays,
                metadata
            };

            cur.setDate(cur.getDate() + 1);
        }
        return map;
    }, [startDate, endDate, calendarEvents, officialSemester, attendanceTimeline, isPlus]);

    const getCellTitle = useCallback((date, activity) => {
        if (!isPlus) return '';

        const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        if (!activity) return dateStr;

        const lines = [dateStr];

        if (activity.overlays?.includes('semesterStart')) {
            lines.push(activity.metadata?.semesterStartLabel || 'Semester Started');
        }
        if (activity.overlays?.includes('semesterEnd')) {
            lines.push(activity.metadata?.semesterEndLabel || 'Semester Ended');
        }

        if (activity.metadata?.events?.length > 0) {
            activity.metadata.events.forEach(ev => {
                const timeStr = !ev.allDay && ev.startTime ? ` (${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ''})` : '';
                const cancelledStr = ev.isCancelled ? ' [Cancelled]' : '';
                lines.push(`${ev.eventType}: ${ev.title}${timeStr}${cancelledStr}`);
            });
        }

        if (activity.metadata?.attendancePercentage !== undefined) {
            lines.push(`Attendance: ${activity.metadata.attendancePercentage}% (${activity.metadata.attendedClasses}/${activity.metadata.expectedClasses} classes attended)`);
        }

        return lines.filter(line => line !== '').join('\n');
    }, [isPlus]);

    const handleAction = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile' } });
        } else {
            navigate('/pricing');
        }
    };

    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const titleColor = isDark ? '#F3F4F6' : '#111827';
    const labelColor = isDark ? '#A1A1AA' : '#6B7280';
    const yearLabel = String(activeYear);

    return (
        <div style={{
            background:           cardBg,
            border:               `1px solid ${cardBorder}`,
            borderRadius:         '8px',
            padding:              '14px 16px',
            width:                '100%',
            display:              'flex',
            flexDirection:        'column',
            boxSizing:            'border-box',
            fontFamily:           'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            position:             'relative'
        }}>

            {/* ── Compact Header ─────────────────────────────────────────── */}
            <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                marginBottom:   '6px',
                flexShrink:     0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={14} color={isDark ? '#93C5FD' : '#2563EB'} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: titleColor, letterSpacing: '-0.01em' }}>
                        Academic Journey
                    </span>
                    {!isPlus && <ProfileLockBadge isAnonymous={isAnonymous} />}
                </div>

                {/* Right: Year Navigator + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isPlus && (
                        <button
                            type="button"
                            onClick={handleAction}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                background: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(37, 99, 235, 0.2)',
                                color: isDark ? '#93C5FD' : '#2563EB',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <Lock size={10} />
                            <span>{isAnonymous ? 'Sign In' : 'Unlock with Plus'}</span>
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <NavBtn onClick={prev} disabled={activeYear <= minYear} isDark={isDark}>
                            <ChevronLeft size={12} />
                        </NavBtn>
                        <span style={{
                            fontSize:      '11px',
                            fontWeight:    600,
                            color:         isDark ? '#93C5FD' : '#2563EB',
                            minWidth:      '40px',
                            textAlign:     'center',
                            letterSpacing: '0.02em',
                        }}>
                            {yearLabel}
                        </span>
                        <NavBtn onClick={next} disabled={activeYear >= maxYear} isDark={isDark}>
                            <ChevronRight size={12} />
                        </NavBtn>
                    </div>
                </div>
            </div>

            {/* ── Heatmap Grid Container ──────────────────────────────────── */}
            <div 
                style={{ 
                    flex: '1 1 auto', 
                    width: '100%', 
                    overflowX: 'auto', 
                    WebkitOverflowScrolling: 'touch',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 0',
                    position: 'relative'
                }} 
                className="scrollbar-none touch-pan-x"
            >
                <div style={{
                    minWidth: '1180px',
                    width: '100%',
                    filter: !isPlus ? (isDark ? 'blur(2.5px) opacity(0.35)' : 'blur(2px) opacity(0.4)') : 'none',
                    pointerEvents: !isPlus ? 'none' : 'auto',
                    transition: 'filter 0.2s ease, opacity 0.2s ease'
                }}>
                    <HeatmapGrid
                        startDate={startDate}
                        endDate={endDate}
                        activities={activities}
                        palette={academicPalette}
                        defaultStatus="none"
                        cellGap={3}
                        monthGap={10}
                        getCellTitle={getCellTitle}
                        onCellClick={isPlus ? onSelectDate : undefined}
                    />
                </div>

                {/* ── Prominent Lock Overlay for Non-Logged & Non-Plus Users ── */}
                {!isPlus && (
                    <div
                        onClick={handleAction}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '6px',
                            background: isDark
                                ? 'rgba(15, 17, 21, 0.65)'
                                : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            zIndex: 10,
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        {/* Lock SVG Icon Circle */}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #BFDBFE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDark ? '#93C5FD' : '#2563EB',
                            boxShadow: isDark ? '0 0 16px rgba(59, 130, 246, 0.2)' : '0 2px 8px rgba(37, 99, 235, 0.1)'
                        }}>
                            <Lock size={18} strokeWidth={2.2} />
                        </div>

                        <div style={{ textAlign: 'center', maxWidth: '320px', padding: '0 12px' }}>
                            <p style={{
                                margin: 0,
                                fontSize: '13px',
                                fontWeight: 700,
                                color: titleColor,
                                letterSpacing: '-0.01em'
                            }}>
                                Academic Journey Heatmap
                            </p>
                            <p style={{
                                margin: '3px 0 0',
                                fontSize: '11.5px',
                                color: labelColor,
                                lineHeight: 1.35
                            }}>
                                {isAnonymous
                                    ? 'Sign in with your institutional account to track your daily academic streaks'
                                    : 'Unlock your personal 365-day attendance heatmap & streaks with AskUrSenior Plus'}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction();
                            }}
                            style={{
                                marginTop: '2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: '#2563EB',
                                border: '1px solid #1D4ED8',
                                color: '#FFFFFF',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)'
                            }}
                        >
                            <span>{isAnonymous ? 'Sign in to Personalize' : 'Unlock with Plus'}</span>
                            <ArrowRight size={12} strokeWidth={2.2} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Bottom Legend ──────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                flexShrink: 0,
                marginTop: '4px',
                paddingTop: '6px',
                borderTop: isDark ? '1px solid #292E37' : '1px solid #E5E7EB'
            }}>
                {legendConfig.map(({ label, bg, border, shadow, dot }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width:        '8px',
                            height:       '8px',
                            borderRadius: '2px',
                            background:   bg,
                            border:       border || 'none',
                            boxShadow:    shadow || 'none',
                            flexShrink:   0,
                            position:     'relative',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'center',
                        }}>
                            {dot && (
                                <span style={{
                                    width:        '2px',
                                    height:       '2px',
                                    borderRadius: '50%',
                                    background:   isDark ? '#FFFFFF' : '#0F172A',
                                }} />
                            )}
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 500, color: labelColor }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicJourneyCard;
