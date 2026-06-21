import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP (for utility buttons)
═══════════════════════════════════════════════════════════════════ */
const Tooltip = ({ lines, visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full mt-2.5 right-0 z-50 min-w-[130px]"
            >
                <div
                    className="rounded-xl px-3.5 py-2.5 text-center"
                    style={{
                        background: 'rgba(13,10,30,0.97)',
                        border: '1px solid rgba(139,92,246,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {lines.map((line, i) => (
                        <p key={i}
                            className={i === 0 ? 'text-[11px] font-bold text-white whitespace-nowrap' : 'text-[10px] mt-0.5 whitespace-nowrap font-medium'}
                            style={i > 0 ? { color: 'rgba(139,92,246,0.7)' } : {}}
                        >{line}</p>
                    ))}
                </div>
                <div className="absolute -top-[5px] right-4 w-2.5 h-2.5 rotate-45 rounded-sm"
                    style={{ background: 'rgba(13,10,30,0.97)', border: '1px solid rgba(139,92,246,0.2)', borderBottom: 'none', borderRight: 'none' }} />
            </motion.div>
        )}
    </AnimatePresence>
);

/* ═══════════════════════════════════════════════════════════════════
   ICON BUTTON WITH TOOLTIP
═══════════════════════════════════════════════════════════════════ */
const UtilityBtn = ({ icon, tooltip, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                onClick={onClick}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{
                    background: hovered ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)',
                    border: `1px solid ${hovered ? 'rgba(139,92,246,0.28)' : 'rgba(139,92,246,0.12)'}`,
                    color: hovered ? '#a78bfa' : 'rgba(100,116,139,0.8)',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                }}
            >{icon}</motion.button>
            <Tooltip lines={tooltip} visible={hovered} />
        </div>
    );
};

const TimerIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="8" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4l2.5 2.5M12 5V3M10 3h4" />
    </svg>
);

const AskPlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   NAV TIMELINE — minimal roadmap
═══════════════════════════════════════════════════════════════════ */
const NavTimeline = ({ timeline, isLightMode }) => {
    const [hoveredKey, setHoveredKey] = useState(null);

    const isValid = (d) => d && !isNaN(new Date(d).getTime());
    const isConfigured = isValid(timeline?.collegeStart) && isValid(timeline?.lastWorkingDay);

    if (!isConfigured) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span style={{ fontSize: 10, color: 'rgba(100,116,139,0.3)', letterSpacing: '0.06em' }}>
                    Setup your semester timeline from the dashboard →
                </span>
            </div>
        );
    }

    const nowMs = Date.now();

    const milestones = [
        { key: 'collegeStart',   label: 'Start',    date: timeline.collegeStart },
        { key: 'cie1',           label: 'CIE 1',    date: timeline.cie1 },
        { key: 'cie2',           label: 'CIE 2',    date: timeline.cie2 },
        { key: 'lastWorkingDay', label: 'Last Day', date: timeline.lastWorkingDay },
        { key: 'seeStart',       label: 'SEE',      date: timeline.seeStart },
        { key: 'nextSem',        label: 'Next Sem', date: timeline.nextSem },
    ]
        .filter(m => isValid(m.date))
        .map(m => ({ ...m, ms: new Date(m.date).getTime() }))
        .sort((a, b) => a.ms - b.ms);

    if (milestones.length < 2) return null;

    const startMs = milestones[0].ms;
    const endMs   = milestones[milestones.length - 1].ms;
    const span    = Math.max(1, endMs - startMs);

    const pct = nowMs >= endMs ? 100 : nowMs > startMs ? ((nowMs - startMs) / span) * 100 : 0;

    const daysDiff   = (ms) => Math.ceil((ms - nowMs) / 86400000);
    const formatDate = (ms) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const lastWorkDay  = milestones.find(m => m.key === 'lastWorkingDay');
    const daysLeft     = lastWorkDay ? Math.max(0, daysDiff(lastWorkDay.ms)) : null;
    const nextM        = milestones.find(m => m.ms > nowMs);

    // Only show labels at the first and last milestone
    const startLabel = milestones[0].label;
    const endLabel   = lastWorkDay?.label ?? milestones[milestones.length - 1].label;

    // Middle dots — everything except index 0
    const middleDots = milestones.slice(1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', userSelect: 'none', gap: 4 }}>

            {/* Track row */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>

                {/* Start label */}
                <span style={{
                    fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                    color: isLightMode ? '#7c3aed' : 'rgba(167,139,250,0.75)',
                }}>
                    {startLabel}
                </span>

                {/* Track */}
                <div style={{ position: 'relative', flex: 1, height: 32, display: 'flex', alignItems: 'center' }}>

                    {/* Rail */}
                    <div style={{
                        position: 'absolute', left: 0, right: 0, top: '50%',
                        height: 2.5, borderRadius: 99, transform: 'translateY(-50%)',
                        background: isLightMode ? 'rgba(15,23,42,0.08)' : 'rgba(148,163,184,0.09)',
                    }} />

                    {/* Progress fill */}
                    <motion.div style={{
                        position: 'absolute', left: 0, top: '50%',
                        height: 2.5, borderRadius: 99, transform: 'translateY(-50%)',
                        background: 'linear-gradient(90deg, #5b21b6, #a78bfa)',
                        boxShadow: '0 0 12px rgba(139,92,246,0.65)',
                    }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                    />

                    {/* Middle milestone dots */}
                    {middleDots.map((m) => {
                        const pos    = ((m.ms - startMs) / span) * 100;
                        const passed = nowMs >= m.ms;
                        const isNext = nextM?.key === m.key;
                        const diff   = daysDiff(m.ms);
                        // Don't render the end-cap as an intermediate dot
                        if (m.key === milestones[milestones.length - 1].key) return null;

                        return (
                            <div key={m.key}
                                style={{ position: 'absolute', left: `${pos}%`, top: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredKey(m.key)}
                                onMouseLeave={() => setHoveredKey(null)}
                            >
                                <motion.div whileHover={{ scale: 1.7 }} style={{
                                    width: 13, height: 13, borderRadius: '50%',
                                    background: passed ? 'linear-gradient(135deg,#5b21b6,#a78bfa)' : isNext ? '#818cf8' : (isLightMode ? 'rgba(15,23,42,0.08)' : 'rgba(148,163,184,0.15)'),
                                    border: passed ? '2px solid rgba(167,139,250,0.4)' : isNext ? '2px solid rgba(129,140,248,0.45)' : (isLightMode ? '2px solid rgba(15,23,42,0.06)' : '2px solid rgba(148,163,184,0.08)'),
                                    boxShadow: passed ? '0 0 10px rgba(139,92,246,0.85)' : isNext ? '0 0 12px rgba(129,140,248,0.8)' : 'none',
                                }} />

                                <AnimatePresence>
                                    {hoveredKey === m.key && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.92 }}
                                            transition={{ duration: 0.13 }}
                                            style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', minWidth: 130, zIndex: 9999, pointerEvents: 'none' }}
                                        >
                                            <div style={{
                                                background: isLightMode ? '#ffffff' : 'rgba(9,7,22,0.97)',
                                                border: isLightMode ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(139,92,246,0.2)',
                                                borderRadius: 10, padding: '8px 12px',
                                                boxShadow: isLightMode ? '0 10px 25px rgba(15,23,42,0.05)' : '0 16px 40px rgba(0,0,0,0.7)',
                                                backdropFilter: 'blur(20px)',
                                            }}>
                                                <p style={{ fontSize: 12, fontWeight: 700, color: isLightMode ? '#0f172a' : '#fff', marginBottom: 3 }}>{m.label}</p>
                                                <p style={{ fontSize: 10, color: isLightMode ? '#4f46e5' : 'rgba(167,139,250,0.85)' }}>{formatDate(m.ms)}</p>
                                                <p style={{ fontSize: 10, color: isLightMode ? 'rgba(15,23,42,0.5)' : 'rgba(148,163,184,0.5)', marginTop: 2 }}>
                                                    {diff > 0 ? `${diff} Days Away` : diff < 0 ? `${Math.abs(diff)} Days Ago` : 'Today'}
                                                </p>
                                                <p style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: passed ? '#34d399' : isNext ? '#818cf8' : 'rgba(100,116,139,0.5)' }}>
                                                    {passed ? '✓ Completed' : isNext ? '⏳ Upcoming' : '○ Pending'}
                                                </p>
                                            </div>
                                            <div style={{
                                                position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                                                width: 8, height: 8,
                                                background: isLightMode ? '#ffffff' : 'rgba(9,7,22,0.97)',
                                                border: isLightMode ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(139,92,246,0.2)',
                                                borderBottom: 'none', borderRight: 'none',
                                            }} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Current position — glowing orb */}
                    {pct > 0 && pct < 100 && (
                        <motion.div
                            style={{ position: 'absolute', top: '50%', zIndex: 20, transform: 'translateY(-50%) translateX(-50%)' }}
                            initial={{ left: '0%' }}
                            animate={{ left: `${pct}%` }}
                            transition={{ duration: 1.8, ease: 'easeOut' }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.45, 1], opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: 'radial-gradient(circle, #ffffff 10%, #a78bfa 65%)',
                                    boxShadow: '0 0 0 4px rgba(139,92,246,0.2), 0 0 20px rgba(139,92,246,1)',
                                }}
                            />
                        </motion.div>
                    )}
                </div>

                 {/* End label */}
                <span style={{
                    fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                    color: isLightMode ? 'rgba(15,23,42,0.45)' : 'rgba(100,116,139,0.4)',
                }}>
                    {endLabel}
                </span>
            </div>

            {/* Single centered status line */}
            {daysLeft !== null && (
                <span style={{ fontSize: 10, fontWeight: 500, color: isLightMode ? 'rgba(15,23,42,0.55)' : 'rgba(100,116,139,0.38)', letterSpacing: '0.04em' }}>
                    {daysLeft} Days Left
                </span>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════════════════════ */
const TopBar = ({ sidebarCollapsed = false }) => {
    const { user } = React.useContext(AuthContext);
    const { isDark } = useTheme();
    const isLightMode = !isDark;
    const sidebarW = sidebarCollapsed ? 104 : 280;

    return (
        <div className="fixed top-0 right-0 z-30 transition-all duration-300" style={{ left: sidebarW }}>
            <div
                className="flex items-center px-6"
                style={{
                    height: '64px',
                    background: isLightMode ? 'rgba(255,255,255,0.92)' : 'rgba(8,4,22,0.90)',
                    borderBottom: isLightMode ? '1px solid rgba(15,23,42,0.06)' : '1px solid rgba(139,92,246,0.08)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: isLightMode 
                        ? '0 1px 0 rgba(15,23,42,0.03), 0 4px 20px rgba(15,23,42,0.04)' 
                        : '0 1px 0 rgba(139,92,246,0.05), 0 4px 24px rgba(0,0,0,0.4)',
                }}
            >
                {/* Timeline takes all space */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <NavTimeline timeline={user?.semesterTimeline} />
                </div>

                {/* Utility buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <UtilityBtn icon={<TimerIcon />} tooltip={['Study Timer', 'Coming Soon']} onClick={() => {}} />
                    <UtilityBtn icon={<AskPlusIcon />} tooltip={['Ask+ AI', 'Coming Soon']} onClick={() => {}} />
                </div>
            </div>
        </div>
    );
};

export default TopBar;
