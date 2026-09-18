/**
 * AcademicJourneyCard — Profile page widget.
 *
 * Domain-specific consumer of the shared <HeatmapGrid /> engine.
 * Responsible only for:
 *   · Deriving the student's academic years from their USN
 *   · Providing academic palette, activity map, and tooltip logic
 *   · Rendering the card chrome (header, nav, legend, dividers)
 *
 * In future phases, replace the activities map with real data from:
 *   - Attendance module  → status: 'academic' | 'absent'
 *   - Exam module        → status: 'exam'
 *   - Holiday module     → status: 'holiday'
 * The HeatmapGrid itself needs zero changes.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import HeatmapGrid from '../../../components/HeatmapGrid';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isoKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Extract joining year from VTU USN, e.g. "1SI23IS080" → 2023 */
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
            background:     disabled ? 'transparent' : (isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9'),
            border:         isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius:   '6px',
            color:          disabled ? (isDark ? 'rgba(148,163,184,0.2)' : '#CBD5E1') : (isDark ? 'rgba(148,163,184,0.65)' : '#475569'),
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
        onMouseEnter={e => {
            if (!disabled) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
        }}
        onMouseLeave={e => {
            if (!disabled) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9';
        }}
    >
        {children}
    </button>
);

// ─── Main Card ────────────────────────────────────────────────────────────────
const AcademicJourneyCard = ({ onSelectDate }) => {
    const { isDark } = useTheme();
    const { user } = useAuth();

    const academicPalette = useMemo(() => ({
        'none':                 { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)', border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(15, 23, 42, 0.08)' },
        'attendance-100':       { bg: isDark ? 'rgba(22, 163, 74, 0.95)' : '#16a34a',  border: 'none' },
        'attendance-75':        { bg: isDark ? 'rgba(34, 197, 94, 0.80)' : '#22c55e',  border: 'none' },
        'attendance-50':        { bg: isDark ? 'rgba(74, 222, 128, 0.65)' : '#4ade80',  border: 'none' },
        'attendance-1':         { bg: isDark ? 'rgba(134, 239, 172, 0.45)' : '#86efac',  border: 'none' },
        'attendance-absent':    { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.05)', border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(15, 23, 42, 0.08)' },
        'holiday':              { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(234, 179, 8, 0.08)',  border: isDark ? '1.5px solid #eab308' : '1.5px solid #d97706' },
        'exam':                 { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.08)',  border: '1.5px solid #ef4444' },
    }), [isDark]);

    const legendConfig = useMemo(() => [
        { label: 'Attendance',     bg: isDark ? 'rgba(34, 197, 94, 0.80)' : '#22c55e',  border: 'none' },
        { label: 'Holiday',        bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: isDark ? '1.5px solid #eab308' : '1.5px solid #d97706' },
        { label: 'Exam / CIE',     bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: '1.5px solid #ef4444' },
        { label: 'Event',          bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(15, 23, 42, 0.15)', dot: true },
        { label: 'Semester Start', bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: '1.5px solid #a855f7' },
        { label: 'Semester End',   bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: '1.5px solid #ec4899' },
        { label: 'Today',          bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)', border: '1.5px solid #06b6d4', shadow: '0 0 6px #06b6d4' }
    ], [isDark]);

    // Derive joining year from USN (e.g. 1SI23IS080 → 2023)
    const joiningYear = useMemo(() => (
        usn2year(user?.usn)
        ?? usn2year(user?.username)
        ?? user?.academicProfile?.joiningYear
        ?? new Date().getFullYear() - 1
    ), [user?.usn, user?.username, user?.academicProfile?.joiningYear]);

    // 4-year BE programme bounds
    const minYear = joiningYear;
    const maxYear = joiningYear + 3;

    // Default to current calendar year, clamped within student's 4-year programme bounds
    const defaultYear = useMemo(() => {
        const current = new Date().getFullYear();
        return Math.max(minYear, Math.min(maxYear, current));
    }, [minYear, maxYear]);

    const [activeYear, setActiveYear] = useState(defaultYear);

    // Sync activeYear if defaultYear updates dynamically
    useEffect(() => {
        setActiveYear(defaultYear);
    }, [defaultYear]);
    const prev = useCallback(() => setActiveYear(y => Math.max(y - 1, minYear)), [minYear]);
    const next = useCallback(() => setActiveYear(y => Math.min(y + 1, maxYear)), [maxYear]);

    // Calendar year date range fed into HeatmapGrid (Jan 1 to Dec 31)
    const startDate = useMemo(() => new Date(activeYear, 0, 1),  [activeYear]);
    const endDate   = useMemo(() => new Date(activeYear, 11, 31), [activeYear]);

    // Calendar events loaded from the DB single source of truth
    // Calendar events loaded from canonical CollegeEvent API
    const cacheKey = `aus_heatmap_v2_${activeYear}_${user?.usn || user?.username || 'user'}`;
    const cachedData = useMemo(() => {
        try {
            const raw = sessionStorage.getItem(cacheKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }, [cacheKey]);

    const [calendarEvents, setCalendarEvents] = useState(cachedData?.calendarEvents || []);
    const [officialSemester, setOfficialSemester] = useState(cachedData?.officialSemester || null);
    const [attendanceTimeline, setAttendanceTimeline] = useState(cachedData?.attendanceTimeline || []);

    useEffect(() => {
        let active = true;
        const fetchEvents = async () => {
            try {
                const startStr = isoKey(startDate);
                const endStr = isoKey(endDate);

                // Determine active semesters in this calendar year
                const activeSemesters = getSemestersForYear(activeYear, joiningYear);
                const currentSem = Number(user?.semester || 1);
                if (currentSem && !activeSemesters.includes(currentSem)) {
                    activeSemesters.push(currentSem);
                }

                // Canonical: Single unified calendar query + student attendance
                const [calendarRes, ...attendanceResList] = await Promise.all([
                    apiV2.getStudentAcademicsCalendar({ startDate: startStr, endDate: endStr })
                        .catch(err => {
                            console.error('Failed to fetch canonical calendar:', err);
                            return null;
                        }),
                    ...activeSemesters.map(sem =>
                        apiV2.getAttendanceDashboard(sem)
                            .then(res => res.data?.success ? res.data.data : null)
                            .catch(err => {
                                console.error(`Failed to fetch attendance for semester ${sem}:`, err);
                                return null;
                            })
                    )
                ]);

                if (active) {
                    const newCalendar = calendarRes?.data?.success && Array.isArray(calendarRes.data.data) 
                        ? calendarRes.data.data 
                        : [];
                    const newOfficialSem = calendarRes?.data?.officialSemester || null;

                    // Process attendance responses
                    const mergedTimeline = [];
                    attendanceResList.forEach(data => {
                        if (data?.groupedTimeline) {
                            mergedTimeline.push(...data.groupedTimeline);
                        }
                    });

                    setCalendarEvents(newCalendar);
                    setOfficialSemester(newOfficialSem);
                    setAttendanceTimeline(mergedTimeline);

                    // Cache results for instant rendering on subsequent refreshes
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            calendarEvents: newCalendar,
                            officialSemester: newOfficialSem,
                            attendanceTimeline: mergedTimeline
                        }));
                    } catch (e) {
                        // Safe storage fallback
                    }
                }
            } catch (err) {
                console.error('Failed to fetch academic journey data:', err);
            }
        };
        fetchEvents();
        return () => { active = false; };
    }, [startDate, endDate, activeYear, joiningYear, user?.semester, cacheKey]);

    // ─── Processed Contribution Calendar Generator ───────────────────────────
    const activities = useMemo(() => {
        const map = {};
        const cur = new Date(startDate);
        const todayObj = new Date();
        const todayKey = isoKey(todayObj);

        // Authoritative semester start & end from OfficialSemester
        const semStartKey = officialSemester?.startDate ? isoKey(new Date(officialSemester.startDate)) : null;
        const semEndKey = officialSemester?.endDate ? isoKey(new Date(officialSemester.endDate)) : null;

        while (cur <= endDate) {
            const dKey = isoKey(cur);

            let baseState = 'none';
            let attendanceValue = 0;
            let overlays = [];
            let metadata = {};

            // 1. Overlays: Today, Semester Start, Semester End
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

            // 2. Attendance Layer (Never overwritten by events)
            let hasAttendance = false;
            if (dKey <= todayKey) {
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
            }

            // 3. Canonical Events Layer (CollegeEvent)
            const dayEvents = calendarEvents.filter(e => {
                if (!e.startDate) return false;
                const startKey = isoKey(new Date(e.startDate));
                const endKey = e.endDate ? isoKey(new Date(e.endDate)) : startKey;
                return dKey >= startKey && dKey <= endKey;
            });

            // Store all events (including cancelled) in metadata for rich tooltips
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

            // Active events (non-cancelled) drive visual indicators
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

            // 4. Determine Cell Fill Status:
            // Attendance percentage dictates the green intensity.
            // Events NEVER overwrite the attendance color fill!
            let status = 'none';
            if (hasAttendance) {
                baseState = 'attendance';
                if (metadata.attendedClasses === 0 && metadata.expectedClasses > 0) {
                    status = 'attendance-absent';
                } else if (attendanceValue === 100) {
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
    }, [startDate, endDate, calendarEvents, officialSemester, attendanceTimeline]);

    // Layered Tooltip Builder
    const getCellTitle = useCallback((date, activity) => {
        const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        if (!activity) return dateStr;

        const lines = [dateStr];

        // 1. Semester Milestones
        if (activity.overlays?.includes('semesterStart')) {
            lines.push(activity.metadata?.semesterStartLabel || 'Semester Started');
            lines.push('');
        }
        if (activity.overlays?.includes('semesterEnd')) {
            lines.push(activity.metadata?.semesterEndLabel || 'Semester Ended');
            lines.push('');
        }

        // 2. Canonical Events Layer (CollegeEvent)
        if (activity.metadata?.events?.length > 0) {
            activity.metadata.events.forEach(ev => {
                const timeStr = !ev.allDay && ev.startTime ? ` (${ev.startTime}${ev.endTime ? ` - ${ev.endTime}` : ''})` : '';
                const cancelledStr = ev.isCancelled ? ' [Cancelled]' : '';
                lines.push(`${ev.eventType}: ${ev.title}${timeStr}${cancelledStr}`);
                if (ev.description && ev.description !== ev.title) {
                    lines.push(`  ${ev.description}`);
                }
            });
        }

        // 3. Attendance Layer
        if (activity.metadata?.attendancePercentage !== undefined) {
            lines.push(`Attendance: ${activity.metadata.attendancePercentage}% (${activity.metadata.attendedClasses}/${activity.metadata.expectedClasses} classes attended)`);
        }

        // Empty tile indicator
        if ((!activity.metadata?.events || activity.metadata.events.length === 0) && activity.metadata?.attendancePercentage === undefined) {
            lines.push('No Academic Activity');
        }

        return lines.filter(line => line !== '').join('\n');
    }, []);

    const yearLabel = String(activeYear);

    return (
        <div style={{
            background:           isDark ? 'rgba(13, 17, 28, 0.85)' : '#FFFFFF',
            border:               isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius:         '16px',
            padding:              '12px 14px',
            boxShadow:            isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            width:                '100%',
            display:              'flex',
            flexDirection:        'column',
            boxSizing:            'border-box',
            fontFamily:           "'Outfit', 'Plus Jakarta Sans', sans-serif",
        }}>

            {/* ── Compact Header (Minimal Vertical Space) ─────────────────── */}
            <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                marginBottom:   '4px',
                flexShrink:     0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={13} color={isDark ? '#a78bfa' : '#7c3aed'} />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-0.01em' }}>
                        Academic Journey
                    </span>
                </div>

                {/* Compact Year Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <NavBtn onClick={prev} disabled={activeYear <= minYear} isDark={isDark}>
                        <ChevronLeft size={12} />
                    </NavBtn>
                    <span style={{
                        fontSize:      '11px',
                        fontWeight:    700,
                        color:         isDark ? '#c4b5fd' : '#7c3aed',
                        minWidth:      '44px',
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

            {/* ── Heatmap Grid (Primary Focus ~85-90% of Card) ──────────── */}
            <div 
                style={{ 
                    flex: '1 1 auto', 
                    width: '100%', 
                    overflowX: 'auto', 
                    WebkitOverflowScrolling: 'touch',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 0'
                }} 
                className="scrollbar-none touch-pan-x"
            >
                <div style={{ minWidth: '1180px', width: '100%' }}>
                    <HeatmapGrid
                        startDate={startDate}
                        endDate={endDate}
                        activities={activities}
                        palette={academicPalette}
                        defaultStatus="none"
                        cellGap={4}
                        monthGap={12}
                        getCellTitle={getCellTitle}
                        onCellClick={onSelectDate}
                    />
                </div>
            </div>

            {/* ── Micro Bottom Legend (Minimal Vertical Space) ───────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0, marginTop: '4px', paddingTop: '6px', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(15, 23, 42, 0.06)' }}>
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
                                    width:        '2.5px',
                                    height:       '2.5px',
                                    borderRadius: '50%',
                                    background:   isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.8)',
                                    boxShadow:    isDark ? '0 0 2px rgba(255, 255, 255, 0.6)' : 'none',
                                }} />
                            )}
                        </div>
                        <span style={{ fontSize: '9.5px', fontWeight: 500, color: isDark ? 'rgba(148, 163, 184, 0.65)' : '#64748b' }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicJourneyCard;
