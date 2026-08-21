import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, format, isBefore, isAfter, isToday, startOfDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Share2, Trophy } from 'lucide-react';
import { calculateStreaks, getAcademicActivityLog, getDayActivityMap, getMonthDays } from '../../utils/academicStreak';

const circleIconButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    padding: 0,
};

const AcademicStreakWidget = ({ user }) => {
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [activityVersion, setActivityVersion] = useState(0);
    const [hoveredDay, setHoveredDay] = useState(null);
    const [monthDirection, setMonthDirection] = useState(0);

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

    return (
        <div style={{
            position: 'relative',
            margin: '16px 14px',
            padding: '20px 18px',
            borderRadius: '22px',
            background: '#121622',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderTop: '2px solid rgba(249, 115, 22, 0.8)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden',
        }}>
            {/* Top Radial Orange Ambient Glow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '240px',
                height: '70px',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.22), transparent 75%)',
                pointerEvents: 'none',
            }} />

            {/* TOP NAVIGATION BAR */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Far Left Info Button */}
                <button
                    type="button"
                    title="Academic streak details"
                    style={circleIconButtonStyle}
                >
                    <span style={{ fontSize: '11px', fontStyle: 'italic', fontFamily: 'serif', color: '#94A3B8' }}>i</span>
                </button>

                {/* Center Month Nav Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" onClick={() => navigateMonth(-1)} style={circleIconButtonStyle} aria-label="Previous month">
                        <ChevronLeft size={14} color="#94A3B8" />
                    </button>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '12px',
                        padding: '4px 16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#F8FAFC',
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
                    }}>
                        {format(monthCursor, 'MMMM')}
                    </div>

                    <button type="button" onClick={() => navigateMonth(1)} style={circleIconButtonStyle} aria-label="Next month">
                        <ChevronRight size={14} color="#94A3B8" />
                    </button>
                </div>

                {/* Far Right Share Button */}
                <button
                    type="button"
                    title="Share streak"
                    style={circleIconButtonStyle}
                >
                    <Share2 size={13} color="#94A3B8" />
                </button>
            </div>

            {/* DAY HEADERS: Mon Tue Wed Thu Fri Sat Sun */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94A3B8',
                position: 'relative',
                zIndex: 1,
            }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </div>

            {/* CALENDAR GRID */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={monthLabel}
                    initial={{ opacity: 0, x: monthDirection > 0 ? 12 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: monthDirection > 0 ? -12 : 12 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                        rowGap: '10px',
                        columnGap: '4px',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {monthDays.map((day) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const activities = activityMap[dayKey] || [];
                        const active = activities.length > 0;
                        const inMonth = day.getMonth() === monthCursor.getMonth();
                        const isPastDay = isBefore(day, todayDate);

                        // Trailing days outside month
                        if (!inMonth) {
                            return (
                                <div
                                    key={dayKey}
                                    style={{
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#475569',
                                    }}
                                >
                                    {format(day, 'd')}
                                </div>
                            );
                        }

                        // Days inside month
                        return (
                            <motion.button
                                key={dayKey}
                                type="button"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.95 }}
                                onMouseEnter={() => {
                                    if (!isAfter(startOfDay(day), todayDate)) {
                                        setHoveredDay({ day, activities });
                                    }
                                }}
                                onMouseLeave={() => setHoveredDay(null)}
                                style={{
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: '#F8FAFC',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                {active ? (
                                    <span style={{ fontSize: '16px', filter: 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' }}>🔥</span>
                                ) : isPastDay ? (
                                    <span style={{ fontSize: '15px' }}>😭</span>
                                ) : (
                                    <span>{format(day, 'd')}</span>
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* BOTTOM STATS & ACTION DOCK */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                paddingTop: '4px',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Current & Max Stats Pill */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                }}>
                    <span>Current 🔥 <strong style={{ color: '#F97316' }}>{streaks.currentStreak || 0}</strong></span>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span>Max 🏆 <strong style={{ color: '#F8FAFC' }}>{streaks.bestStreak || 0}</strong></span>
                </div>

                {/* Leaderboard Button */}
                <button
                    type="button"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#94A3B8',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                    }}
                >
                    <Trophy size={13} color="#94A3B8" />
                    <span>Leaderboard</span>
                </button>
            </div>

            {/* TOP STREAKS RANK ROW */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingTop: '12px',
                marginTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                position: 'relative',
                zIndex: 1,
            }}>
                {/* Rank 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: '2px solid #FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 10px rgba(245,158,11,0.4)' }}>
                        👤
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#F8FAFC' }}>Rank 1</span>
                </div>

                {/* Rank 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #94A3B8, #475569)', border: '2px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        👤
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1' }}>Rank 2</span>
                </div>

                {/* Rank 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #D97706, #78350F)', border: '2px solid #FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        👤
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1' }}>Rank 3</span>
                </div>

                <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.1)' }} />

                {/* User Rank */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#94A3B8' }}>
                        👤
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '6px' }}>****</span>
                </div>
            </div>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {hoveredDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.985 }}
                        transition={{ duration: 0.12 }}
                        style={{
                            position: 'absolute',
                            left: 16,
                            right: 16,
                            bottom: 60,
                            zIndex: 10,
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{ borderRadius: 14, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2433', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#F8FAFC', marginBottom: 3 }}>
                                {format(hoveredDay.day, 'MMMM d, yyyy')}
                            </div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 6 }}>
                                {hoveredDay.activities.length} activities completed
                            </div>
                            <div style={{ display: 'grid', gap: 3 }}>
                                {hoveredDay.activities.slice(0, 4).map((activity) => (
                                    <div key={activity.key} style={{ fontSize: 10, color: '#CBD5E1' }}>
                                        {activity.label}
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
