import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { addMonths, format, isAfter, startOfDay, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { calculateStreaks, getAcademicActivityLog, getDayActivityMap, getMonthDays } from '../../utils/academicStreak';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Activity intensity → opacity level (0–3 mapped to cell fill strength)
const getIntensityLevel = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    return 3;
};

const STATIC_STREAKS = { currentStreak: 5, bestStreak: 12 };

const AcademicStreakWidget = ({ user, isStatic }) => {
    const { hasPlusAccess, isAuthenticated } = useContext(AuthContext);
    const isFreeOrUnauthenticated = isStatic !== undefined ? isStatic : (!isAuthenticated || !hasPlusAccess);
    const [monthCursor, setMonthCursor] = useState(() => new Date());
    const [activityVersion, setActivityVersion] = useState(0);
    const [hoveredDay, setHoveredDay] = useState(null);
    const [monthDirection, setMonthDirection] = useState(0);
    const { isDark } = useTheme();

    useEffect(() => {
        if (isFreeOrUnauthenticated) return;
        const handleUpdate = () => setActivityVersion((value) => value + 1);
        window.addEventListener('academic-streak:updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);
        return () => {
            window.removeEventListener('academic-streak:updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [isFreeOrUnauthenticated]);

    const entries = useMemo(() => (
        isFreeOrUnauthenticated ? [] : getAcademicActivityLog()
    ), [activityVersion, isFreeOrUnauthenticated]);

    const activityMap = useMemo(() => (
        isFreeOrUnauthenticated ? {} : getDayActivityMap(entries)
    ), [entries, isFreeOrUnauthenticated]);

    const streaks = useMemo(() => (
        isFreeOrUnauthenticated ? STATIC_STREAKS : calculateStreaks(entries)
    ), [entries, isFreeOrUnauthenticated]);
    const monthDays = useMemo(() => getMonthDays(monthCursor), [monthCursor]);
    const monthLabel = format(monthCursor, 'MMMM yyyy');

    const navigateMonth = (direction) => {
        setMonthDirection(direction);
        setMonthCursor((current) => (direction > 0 ? addMonths(current, 1) : subMonths(current, 1)));
        setHoveredDay(null);
    };

    const todayDate = startOfDay(new Date());

    // ── CSES Heatmap Cell Fills ─────────────────────────────────────────
    const cellFills = [
        isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.04)', // 0 - no activity
        'rgba(139, 92, 246, 0.28)',                                         // 1 - 1 activity
        'rgba(139, 92, 246, 0.58)',                                         // 2 - 2-3 activities
        '#8B5CF6',                                                          // 3 - 4+ activities (AskUrSenior Purple)
    ];

    return (
        <div className="mx-3.5 my-3 p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0D111C] shadow-xs flex flex-col gap-3.5 text-slate-900 dark:text-white relative">
            {/* ── 1. CSES SECTION HEADER ─────────────────────────────── */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ACTIVITY CALENDAR
                </span>

                {streaks.currentStreak > 0 ? (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Flame size={11} className="text-amber-500" />
                        {streaks.currentStreak} DAYS STREAK
                    </span>
                ) : (
                    <span className="font-mono text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        [ 0-DAY STREAK ]
                    </span>
                )}
            </div>

            {/* ── 2. CSES MONTH NAVIGATION ───────────────────────────── */}
            <div className="flex items-center justify-between py-0.5">
                <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    aria-label="Previous month"
                    className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                    <ChevronLeft size={13} />
                </button>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {format(monthCursor, 'MMMM yyyy')}
                </span>
                <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    aria-label="Next month"
                    className="w-6 h-6 rounded-md flex items-center justify-center border border-slate-200/80 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                    <ChevronRight size={13} />
                </button>
            </div>

            {/* ── 3. DAY OF WEEK HEADERS (CSES Monospace Strip) ─────── */}
            <div className="grid grid-cols-7 text-center font-mono text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-white/[0.06]">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <span key={i}>{d}</span>
                ))}
            </div>

            {/* ── 4. CSES CALENDAR MATRIX GRID ──────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={monthLabel}
                    initial={{ opacity: 0, x: monthDirection > 0 ? 8 : -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: monthDirection > 0 ? -8 : 8 }}
                    transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                    className="grid grid-cols-7 gap-1"
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
                            return <div key={dayKey} className="h-6" />;
                        }

                        return (
                            <motion.button
                                key={dayKey}
                                type="button"
                                whileHover={!isFuture ? { scale: 1.08 } : {}}
                                onMouseEnter={() => {
                                    if (!isFuture) setHoveredDay({ day, activities });
                                }}
                                onMouseLeave={() => setHoveredDay(null)}
                                className={`h-6 flex items-center justify-center rounded-md font-mono text-[10px] transition-all ${
                                    isFuture
                                        ? 'opacity-35 cursor-default'
                                        : 'cursor-pointer hover:border-purple-400'
                                } ${
                                    isToday
                                        ? 'ring-1.5 ring-purple-500 font-bold shadow-xs'
                                        : 'border border-slate-200/60 dark:border-white/[0.06]'
                                }`}
                                style={{
                                    backgroundColor: isFuture
                                        ? (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(15,23,42,0.015)')
                                        : cellFills[intensity],
                                    color: intensity >= 2
                                        ? (isDark ? '#FFFFFF' : '#0F172A')
                                        : (isFuture ? (isDark ? '#475569' : '#CBD5E1') : (isDark ? '#94A3B8' : '#64748B'))
                                }}
                            >
                                {format(day, 'd')}
                            </motion.button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>

            {/* ── 5. CSES INTENSITY LEGEND ───────────────────────────── */}
            <div className="flex items-center gap-1.5 justify-end font-mono text-[9px] uppercase text-slate-400 dark:text-slate-500">
                <span>LESS</span>
                {[0, 1, 2, 3].map((lvl) => (
                    <div
                        key={lvl}
                        className="w-2.5 h-2.5 rounded-xs border border-slate-200/80 dark:border-white/10"
                        style={{ backgroundColor: cellFills[lvl] }}
                    />
                ))}
                <span>MORE</span>
            </div>

            {/* ── 6. CSES SUMMARY STRIP ──────────────────────────────── */}
            <div className="grid grid-cols-2 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] divide-x divide-slate-200/80 dark:divide-white/[0.08] py-2 px-3">
                <div className="flex flex-col pr-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        CURRENT STREAK
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                            {streaks.currentStreak || 0}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                            DAYS
                        </span>
                    </div>
                </div>
                <div className="flex flex-col pl-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        BEST STREAK
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                            {streaks.bestStreak || 0}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                            DAYS
                        </span>
                    </div>
                </div>
            </div>

            {/* ── 7. CSES BENCHMARK PROGRESS ─────────────────────────── */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ACTIVITY BENCHMARK
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                        WEEKLY
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        [01] YOU
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(5, ((streaks.currentStreak || 0) / 30) * 100))}%` }}
                            />
                        </div>
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 min-w-[24px] text-right">
                            {streaks.currentStreak || 0}d
                        </span>
                    </div>
                </div>
            </div>

            {/* ── 8. HOVER TOOLTIP (CSES Floating Card) ──────────────── */}
            <AnimatePresence>
                {hoveredDay && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute left-3 right-3 bottom-3 z-20 pointer-events-none rounded-lg p-2.5 border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#07090E]/95 shadow-xl backdrop-blur-xs text-xs font-mono"
                    >
                        <div className="font-bold text-slate-900 dark:text-white">
                            {format(hoveredDay.day, 'yyyy-MM-dd')} · {format(hoveredDay.day, 'EEE')}
                        </div>
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
                            {hoveredDay.activities.length} {hoveredDay.activities.length === 1 ? 'activity logged' : 'activities logged'}
                        </div>
                        {hoveredDay.activities.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/[0.06]">
                                {hoveredDay.activities.slice(0, 3).map((act) => (
                                    <div key={act.key} className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                                        • {act.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AcademicStreakWidget;
