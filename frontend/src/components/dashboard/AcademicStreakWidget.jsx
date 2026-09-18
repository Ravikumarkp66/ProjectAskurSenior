import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, format, isAfter, startOfDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateStreaks, getAcademicActivityLog, getDayActivityMap, getMonthDays } from '../../utils/academicStreak';
import { useTheme } from '../../context/ThemeContext';

// Activity intensity → opacity level (0–1 mapped to cell fill strength)
const getIntensityLevel = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    return 3;
};

const AcademicStreakWidget = ({ user }) => {
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [activityVersion, setActivityVersion] = useState(0);
    const [hoveredDay, setHoveredDay] = useState(null);
    const [monthDirection, setMonthDirection] = useState(0);
    const { isDark } = useTheme();

    useEffect(() => {
        const handleUpdate = () => setActivityVersion((value) => value + 1);
        window.addEventListener('academic-streak:updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);
        return () => {
            window.removeEventListener('academic-streak:updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    const entries = useMemo(() => getAcademicActivityLog(), [activityVersion]);
    const activityMap = useMemo(() => getDayActivityMap(entries), [entries]);
    const streaks = useMemo(() => calculateStreaks(entries), [entries]);
    const monthDays = useMemo(() => getMonthDays(monthCursor), [monthCursor]);
    const monthLabel = format(monthCursor, 'MMMM yyyy');

    const navigateMonth = (direction) => {
        setMonthDirection(direction);
        setMonthCursor((current) => (direction > 0 ? addMonths(current, 1) : subMonths(current, 1)));
        setHoveredDay(null);
    };

    const todayDate = startOfDay(new Date());

    // ── Theme tokens ───────────────────────────────────────────────────
    const ACCENT = '#8B5CF6';   // AskUrSenior purple
    const bg       = isDark ? '#0D111C' : '#FFFFFF';
    const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)';
    const labelColor  = isDark ? '#64748B' : '#94A3B8';
    const headColor   = isDark ? '#94A3B8' : '#64748B';
    const titleColor  = isDark ? '#F1F5F9' : '#0F172A';
    const divider  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)';
    const cellEmpty   = isDark ? 'rgba(139,92,246,0.07)' : 'rgba(139,92,246,0.06)';
    const cellBorder  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
    const tooltipBg   = isDark ? '#0A0E18' : '#FFFFFF';

    // Cell colors by intensity
    const cellFills = [
        cellEmpty,                // 0 — no activity
        'rgba(139,92,246,0.30)', // 1 — one activity
        'rgba(139,92,246,0.55)', // 2 — 2-3 activities
        ACCENT,                   // 3 — 4+ activities
    ];

    const btnStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)'}`,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
    };

    return (
        <div style={{
            margin: '16px 14px',
            padding: '18px 16px 16px',
            borderRadius: 14,
            background: bg,
            border: `1px solid ${border}`,
            boxShadow: isDark
                ? '0 2px 8px rgba(0,0,0,0.35)'
                : '0 1px 4px rgba(15,23,42,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* ── SECTION LABEL ─────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: labelColor,
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    Your Activity
                </span>

                {/* Streak badge — motivational layer, outside calendar */}
                {streaks.currentStreak > 0 && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#F97316',
                        fontFamily: 'Outfit, sans-serif',
                        letterSpacing: '-0.01em',
                    }}>
                        🔥 {streaks.currentStreak} day streak
                    </span>
                )}
                {!streaks.currentStreak && (
                    <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: labelColor,
                        fontFamily: 'Outfit, sans-serif',
                    }}>
                        Start your streak
                    </span>
                )}
            </div>

            {/* ── MONTH NAVIGATION ───────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => navigateMonth(-1)} style={btnStyle} aria-label="Previous month">
                    <ChevronLeft size={13} color={headColor} />
                </button>
                <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: titleColor,
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '-0.01em',
                }}>
                    {format(monthCursor, 'MMMM yyyy')}
                </span>
                <button type="button" onClick={() => navigateMonth(1)} style={btnStyle} aria-label="Next month">
                    <ChevronRight size={13} color={headColor} />
                </button>
            </div>

            {/* ── DAY HEADERS ────────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                textAlign: 'center',
                fontSize: 10,
                fontWeight: 600,
                color: headColor,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '0.01em',
            }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i}>{d}</span>
                ))}
            </div>

            {/* ── CALENDAR GRID ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={monthLabel}
                    initial={{ opacity: 0, x: monthDirection > 0 ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: monthDirection > 0 ? -10 : 10 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        gap: 3,
                    }}
                >
                    {monthDays.map((day) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const activities = activityMap[dayKey] || [];
                        const count = activities.length;
                        const inMonth = day.getMonth() === monthCursor.getMonth();
                        const isToday = dayKey === format(todayDate, 'yyyy-MM-dd');
                        const isFuture = isAfter(startOfDay(day), todayDate);
                        const intensity = getIntensityLevel(count);

                        if (!inMonth) {
                            return <div key={dayKey} style={{ height: 26 }} />;
                        }

                        return (
                            <motion.button
                                key={dayKey}
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                onMouseEnter={() => {
                                    if (!isFuture) setHoveredDay({ day, activities });
                                }}
                                onMouseLeave={() => setHoveredDay(null)}
                                style={{
                                    height: 26,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: isToday
                                        ? `1.5px solid ${ACCENT}`
                                        : `1px solid ${cellBorder}`,
                                    borderRadius: 5,
                                    background: isFuture
                                        ? isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)'
                                        : cellFills[intensity],
                                    cursor: isFuture ? 'default' : 'pointer',
                                    fontSize: 9,
                                    fontWeight: isToday ? 700 : 500,
                                    color: intensity >= 2
                                        ? (isDark ? '#E2E8F0' : '#1E293B')
                                        : (isFuture ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.2)') : (isDark ? '#64748B' : '#94A3B8')),
                                    fontFamily: 'Outfit, monospace',
                                    transition: 'background 150ms ease',
                                    outline: 'none',
                                    padding: 0,
                                }}
                            >
                                {format(day, 'd')}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* ── LEGEND ─────────────────────────────────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                justifyContent: 'flex-end',
            }}>
                <span style={{ fontSize: 9, color: labelColor, fontFamily: 'Outfit, sans-serif' }}>Less</span>
                {[0, 1, 2, 3].map(lvl => (
                    <div key={lvl} style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: cellFills[lvl],
                        border: `1px solid ${cellBorder}`,
                    }} />
                ))}
                <span style={{ fontSize: 9, color: labelColor, fontFamily: 'Outfit, sans-serif' }}>More</span>
            </div>

            {/* ── DIVIDER ────────────────────────────────────────────── */}
            <div style={{ height: 1, background: divider, margin: '0 -16px' }} />

            {/* ── STREAK STATS ───────────────────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit, sans-serif' }}>Current</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: titleColor, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        {streaks.currentStreak || 0}
                        <span style={{ fontSize: 11, fontWeight: 500, color: labelColor, marginLeft: 4 }}>days</span>
                    </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit, sans-serif' }}>Best</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: titleColor, fontFamily: 'Outfit, sans-serif', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        {streaks.bestStreak || 0}
                        <span style={{ fontSize: 11, fontWeight: 500, color: labelColor, marginLeft: 4 }}>days</span>
                    </span>
                </div>
            </div>

            {/* ── DIVIDER ────────────────────────────────────────────── */}
            <div style={{ height: 1, background: divider, margin: '0 -16px' }} />

            {/* ── WEEKLY ACTIVITY / LEADERBOARD ──────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: labelColor,
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    Weekly Activity
                </span>

                {/* You row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: titleColor, fontFamily: 'Outfit, sans-serif' }}>
                        You
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            height: 4,
                            width: 60,
                            borderRadius: 2,
                            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, ((streaks.currentStreak || 0) / 30) * 100)}%`,
                                background: ACCENT,
                                borderRadius: 2,
                                transition: 'width 600ms ease',
                            }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontFamily: 'Outfit, monospace', minWidth: 20, textAlign: 'right' }}>
                            {streaks.currentStreak || 0}
                        </span>
                    </div>
                </div>

                {/* Rank 2 placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#475569' : '#94A3B8', fontFamily: 'Outfit, sans-serif' }}>
                        Rank 2
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: labelColor, fontFamily: 'Outfit, monospace' }}>—</span>
                </div>

                {/* Rank 3 placeholder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#475569' : '#94A3B8', fontFamily: 'Outfit, sans-serif' }}>
                        Rank 3
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: labelColor, fontFamily: 'Outfit, monospace' }}>—</span>
                </div>

                <button
                    type="button"
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        color: ACCENT,
                        fontFamily: 'Outfit, sans-serif',
                        textAlign: 'left',
                        marginTop: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        letterSpacing: '0.01em',
                    }}
                >
                    View leaderboard →
                </button>
            </div>

            {/* ── HOVER TOOLTIP ──────────────────────────────────────── */}
            <AnimatePresence>
                {hoveredDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        style={{
                            position: 'absolute',
                            left: 12,
                            right: 12,
                            bottom: 12,
                            zIndex: 10,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            borderRadius: 10,
                            padding: '8px 10px',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)'}`,
                            background: tooltipBg,
                            boxShadow: isDark
                                ? '0 12px 30px rgba(0,0,0,0.65)'
                                : '0 8px 20px rgba(15,23,42,0.12)',
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#F8FAFC' : '#0F172A', marginBottom: 2, fontFamily: 'Outfit, sans-serif' }}>
                                {format(hoveredDay.day, 'MMMM d, yyyy')}
                            </div>
                            <div style={{ fontSize: 10, color: headColor, marginBottom: hoveredDay.activities.length ? 4 : 0, fontFamily: 'Outfit, sans-serif' }}>
                                {hoveredDay.activities.length} {hoveredDay.activities.length === 1 ? 'activity' : 'activities'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {hoveredDay.activities.slice(0, 3).map((activity) => (
                                    <div key={activity.key} style={{ fontSize: 10, color: isDark ? '#CBD5E1' : '#475569', fontFamily: 'Outfit, sans-serif' }}>
                                        · {activity.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcademicStreakWidget;
