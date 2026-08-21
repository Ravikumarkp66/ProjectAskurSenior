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
import academicAPI from '../../../services/academicService';
import { apiV2 } from '../../../services/authService';

// ─── Academic palette (injected into HeatmapGrid) ────────────────────────────
const ACADEMIC_PALETTE = {
    'none':                 { bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' },
    'attendance-100':       { bg: 'rgba(22, 163, 74, 0.95)',  border: 'none' },
    'attendance-75':        { bg: 'rgba(34, 197, 94, 0.80)',  border: 'none' },
    'attendance-50':        { bg: 'rgba(74, 222, 128, 0.65)',  border: 'none' },
    'attendance-1':         { bg: 'rgba(134, 239, 172, 0.45)',  border: 'none' },
    'attendance-absent':    { bg: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' },
    'holiday':              { bg: 'rgba(234,179,8,0.75)',    border: 'none' },
    'exam':                 { bg: 'rgba(239,68,68,0.80)',    border: 'none' },
};

const LEGEND_CONFIG = [
    { label: 'Attendance',     bg: 'rgba(34, 197, 94, 0.80)',  border: 'none' },
    { label: 'Holiday',        bg: 'rgba(234, 179, 8, 0.75)',   border: 'none' },
    { label: 'Exam / CIE',     bg: 'rgba(239, 68, 68, 0.80)',   border: 'none' },
    { label: 'Semester Start', bg: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid #a855f7' },
    { label: 'Semester End',   bg: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid #ec4899' },
    { label: 'Today',          bg: 'rgba(255, 255, 255, 0.05)', border: '1.5px solid #06b6d4', shadow: '0 0 6px #06b6d4' }
];

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
const NavBtn = ({ onClick, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            background:     disabled ? 'transparent' : 'rgba(255,255,255,0.04)',
            border:         '1px solid rgba(255,255,255,0.08)',
            borderRadius:   '6px',
            color:          disabled ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.65)',
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
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
        {children}
    </button>
);

// ─── Main Card ────────────────────────────────────────────────────────────────
const AcademicJourneyCard = ({ onSelectDate }) => {
    const { user } = useAuth();

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
    // Calendar events, manual events, timetable config & attendance initialized with instant session cache
    const cacheKey = `aus_heatmap_${activeYear}_${user?.usn || 'user'}`;
    const cachedData = useMemo(() => {
        try {
            const raw = sessionStorage.getItem(cacheKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }, [cacheKey]);

    const [calendarEvents, setCalendarEvents] = useState(cachedData?.calendarEvents || []);
    const [manualEvents, setManualEvents] = useState(cachedData?.manualEvents || []);
    const [timetableConfig, setTimetableConfig] = useState(cachedData?.timetableConfig || null);
    const [attendanceTimeline, setAttendanceTimeline] = useState(cachedData?.attendanceTimeline || []);
    const [subjectsList, setSubjectsList] = useState(cachedData?.subjectsList || []);

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

                // Parallelize all static metadata, calendar events, AND attendance calls simultaneously
                const [calendarRes, manualRes, configRes, ...attendanceResList] = await Promise.all([
                    academicAPI.getCalendarEvents({ startDate: startStr, endDate: endStr }),
                    apiV2.getAcademicEvents(),
                    apiV2.getTimetableConfig(),
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
                    const newCalendar = calendarRes.data?.events || [];
                    const newManual = manualRes.data?.success && Array.isArray(manualRes.data.data) ? manualRes.data.data : [];
                    const newConfig = configRes.data?.success && configRes.data.data ? configRes.data.data : null;

                    // Process attendance responses
                    const mergedTimeline = [];
                    const mergedSubjects = [];
                    attendanceResList.forEach(data => {
                        if (data?.groupedTimeline) {
                            mergedTimeline.push(...data.groupedTimeline);
                        }
                        if (data?.subjects) {
                            mergedSubjects.push(...data.subjects);
                        }
                    });

                    setCalendarEvents(newCalendar);
                    setManualEvents(newManual);
                    setTimetableConfig(newConfig);
                    setAttendanceTimeline(mergedTimeline);
                    setSubjectsList(mergedSubjects);

                    // Cache results for instant rendering on subsequent refreshes
                    try {
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            calendarEvents: newCalendar,
                            manualEvents: newManual,
                            timetableConfig: newConfig,
                            attendanceTimeline: mergedTimeline,
                            subjectsList: mergedSubjects
                        }));
                    } catch (e) {
                        // Safe storage fallback
                    }
                }
            } catch (err) {
                console.error('Failed to fetch academic events:', err);
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
        const semStartKey = timetableConfig?.semesterStartDate ? isoKey(new Date(timetableConfig.semesterStartDate)) : null;
        const semEndKey = timetableConfig?.lastWorkingDate ? isoKey(new Date(timetableConfig.lastWorkingDate)) : null;

        while (cur <= endDate) {
            const dKey = isoKey(cur);

            let baseState = 'none';
            let attendanceValue = 0;
            let overlays = [];
            let metadata = {};

            // 1. Overlays (Optional)
            if (dKey === todayKey) {
                overlays.push('today');
            }
            if (semStartKey && dKey === semStartKey) {
                overlays.push('semesterStart');
                metadata.semesterStartLabel = `Semester ${timetableConfig.semester || 1} Started`;
            }
            if (semEndKey && dKey === semEndKey) {
                overlays.push('semesterEnd');
                metadata.semesterEndLabel = `Semester ${timetableConfig.semester || 1} Ended`;
            }

            // 2. Base States (Mutually Exclusive - Exam -> Holiday -> Attendance -> None)

            // A. Check Exam (Priority 1)
            const manualExam = manualEvents.find(e => {
                if (!e.startDate || !e.endDate) return false;
                const startKey = isoKey(new Date(e.startDate));
                const endKey = isoKey(new Date(e.endDate));
                return dKey >= startKey && dKey <= endKey && e.eventType === 'Exam';
            });

            const calExam = calendarEvents.find(
                e => e.date === dKey && e.category === 'exam'
            );

            if (manualExam) {
                baseState = 'exam';
                metadata.examTitle = manualExam.title || 'Exam';
                metadata.description = manualExam.description || '';
                
                // Match affectedSubjects IDs with subject names
                if (manualExam.affectedSubjects && manualExam.affectedSubjects.length > 0) {
                    metadata.examSubjects = manualExam.affectedSubjects.map(subId => {
                        const subIdStr = subId._id ? subId._id.toString() : subId.toString();
                        const subObj = subjectsList.find(s => {
                            const registeredIdStr = s.subjectId?._id 
                                ? s.subjectId._id.toString() 
                                : (s.subjectId ? s.subjectId.toString() : '');
                            return registeredIdStr === subIdStr;
                        });
                        return subObj ? subObj.name : null;
                    }).filter(Boolean);
                }
            } else if (calExam) {
                baseState = 'exam';
                metadata.examTitle = calExam.title || 'SEE Exam';
                metadata.description = calExam.metadata?.description || '';
            }

            // B. Check Holiday (Priority 2)
            if (baseState === 'none') {
                const manualHoliday = manualEvents.find(e => {
                    if (!e.startDate || !e.endDate) return false;
                    const startKey = isoKey(new Date(e.startDate));
                    const endKey = isoKey(new Date(e.endDate));
                    return dKey >= startKey && dKey <= endKey && (e.eventType === 'Government Holiday' || e.eventType === 'College Fest');
                });

                const calHoliday = calendarEvents.find(
                    e => e.date === dKey && e.category === 'holiday'
                );

                if (manualHoliday) {
                    baseState = 'holiday';
                    metadata.holidayName = manualHoliday.title || 'Holiday';
                    metadata.holidayType = manualHoliday.eventType === 'Government Holiday' ? 'Government Holiday' : 'College Fest';
                    metadata.description = manualHoliday.description || '';
                } else if (calHoliday) {
                    baseState = 'holiday';
                    metadata.holidayName = calHoliday.title || 'Holiday';
                    metadata.holidayType = calHoliday.scope === 'college' ? 'College Holiday' : 'Holiday';
                    metadata.description = calHoliday.metadata?.description || '';
                }
            }

            // C. Check Attendance (Priority 3)
            if (baseState === 'none' && dKey <= todayKey) {
                const attEntry = attendanceTimeline.find(entry => entry.date === dKey);
                if (attEntry && attEntry.expectedClasses > 0) {
                    baseState = 'attendance';
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

            // Map baseState + percentage to palette status string
            let status = baseState;
            if (baseState === 'attendance') {
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
    }, [startDate, endDate, calendarEvents, manualEvents, timetableConfig, attendanceTimeline, subjectsList]);

    // Upgraded multi-line future-ready tooltips
    const getCellTitle = useCallback((date, activity) => {
        const dateStr = date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        if (!activity) return dateStr;

        const lines = [dateStr];

        // 1. Process overlays in order
        if (activity.overlays && activity.overlays.includes('semesterStart')) {
            const semLabel = activity.metadata?.semesterStartLabel || 'Semester Started';
            lines.push(semLabel);
            lines.push(''); // blank separator line
        }
        if (activity.overlays && activity.overlays.includes('semesterEnd')) {
            const semLabel = activity.metadata?.semesterEndLabel || 'Semester Ended';
            lines.push(semLabel);
            lines.push(''); // blank separator line
        }

        // 2. Process baseState
        if (activity.baseState === 'exam') {
            lines.push(`Exam: ${activity.metadata?.examTitle || 'Examination'}`);
            if (activity.metadata?.examSubjects && activity.metadata.examSubjects.length > 0) {
                lines.push(`Subjects: ${activity.metadata.examSubjects.join(', ')}`);
            }
            if (activity.metadata?.description && activity.metadata.description !== activity.metadata.examTitle) {
                lines.push(activity.metadata.description);
            }
        } else if (activity.baseState === 'holiday') {
            lines.push(activity.metadata?.holidayName || 'Holiday');
            lines.push(activity.metadata?.holidayType || 'College Holiday');
            if (activity.metadata?.description && activity.metadata.description !== activity.metadata.holidayName) {
                lines.push(activity.metadata.description);
            }
        } else if (activity.baseState === 'attendance') {
            lines.push(`Attendance: ${activity.attendance}%`);
        } else {
            lines.push('No Academic Activity');
        }

        return lines.filter(line => line !== '').join('\n');
    }, []);

    const yearLabel = String(activeYear);

    return (
        <div style={{
            background:           'rgba(19, 18, 26, 0.55)',
            border:               '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius:         '20px',
            padding:              '10px 12px',
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
                    <BookOpen size={13} color="#a78bfa" />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                        Academic Journey
                    </span>
                </div>

                {/* Compact Year Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <NavBtn onClick={prev} disabled={activeYear <= minYear}>
                        <ChevronLeft size={12} />
                    </NavBtn>
                    <span style={{
                        fontSize:      '11px',
                        fontWeight:    700,
                        color:         '#c4b5fd',
                        minWidth:      '44px',
                        textAlign:     'center',
                        letterSpacing: '0.02em',
                    }}>
                        {yearLabel}
                    </span>
                    <NavBtn onClick={next} disabled={activeYear >= maxYear}>
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
                        palette={ACADEMIC_PALETTE}
                        defaultStatus="none"
                        cellGap={4}
                        monthGap={12}
                        getCellTitle={getCellTitle}
                        onCellClick={onSelectDate}
                    />
                </div>
            </div>

            {/* ── Micro Bottom Legend (Minimal Vertical Space) ───────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0, marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                {LEGEND_CONFIG.map(({ label, bg, border, shadow }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width:        '8px',
                            height:       '8px',
                            borderRadius: '2px',
                            background:   bg,
                            border:       border || 'none',
                            boxShadow:    shadow || 'none',
                            flexShrink:   0,
                        }} />
                        <span style={{ fontSize: '9.5px', fontWeight: 500, color: 'rgba(148, 163, 184, 0.65)' }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicJourneyCard;
