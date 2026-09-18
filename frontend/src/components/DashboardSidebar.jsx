import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ASLogo } from './Logo';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRound, CheckSquare, GraduationCap, Compass } from 'lucide-react';
import BottomProfileMenu from './BottomProfileMenu';

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR WIDTH — 80px fixed, CSES Sheet + Modern SaaS Rail
═══════════════════════════════════════════════════════════════════ */
export const SIDEBAR_WIDTH = 80;

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP — CSES Sheet / Modern SaaS floating label
═══════════════════════════════════════════════════════════════════ */
const SideTooltip = ({ label, badge, visible }) => {
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -4, scale: 0.96 }}
                    transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'absolute',
                        left: 'calc(100% + 10px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: isDark ? 'rgba(10, 14, 23, 0.97)' : 'rgba(255, 255, 255, 0.98)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(226, 232, 240, 0.9)',
                        boxShadow: isDark
                            ? '0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
                            : '0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}>
                        <span style={{
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", monospace',
                            fontSize: 11,
                            fontWeight: 600,
                            color: isDark ? '#F1F5F9' : '#0F172A',
                            letterSpacing: '0.02em',
                        }}>
                            {label}
                        </span>
                        {badge && (
                            <span style={{
                                fontSize: 9,
                                fontFamily: 'ui-monospace, monospace',
                                fontWeight: 700,
                                color: '#60A5FA',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                padding: '1px 5px',
                                borderRadius: 4,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                            }}>
                                {badge}
                            </span>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   NAV ITEM — CSES Sheet + Modern SaaS Navigation Item
═══════════════════════════════════════════════════════════════════ */
const NavItem = ({ icon, label, badge, isActive, onClick, disabled = false }) => {
    const [hovered, setHovered] = useState(false);
    const location = useLocation();
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    // Reset hovered state whenever route changes
    useEffect(() => {
        setHovered(false);
    }, [location.pathname]);

    const handleResetHover = () => {
        setHovered(false);
    };

    const handleClick = (e) => {
        setHovered(false);
        if (!disabled && onClick) {
            onClick(e);
        }
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={handleResetHover}
            onPointerLeave={handleResetHover}
            onPointerUp={handleResetHover}
            onTouchEnd={handleResetHover}
            onBlur={handleResetHover}
        >
            {/* Active Flush Left Rail Indicator */}
            {isActive && (
                <motion.div
                    layoutId="activeNavRailIndicator"
                    initial={{ opacity: 0, height: 14 }}
                    animate={{ opacity: 1, height: 24 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3.5,
                        borderRadius: '0 4px 4px 0',
                        background: isDark
                            ? 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)'
                            : 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                        boxShadow: isDark
                            ? '0 0 10px rgba(96, 165, 250, 0.8), 0 0 20px rgba(59, 130, 246, 0.4)'
                            : '0 0 6px rgba(59, 130, 246, 0.4)',
                        zIndex: 20,
                    }}
                />
            )}

            <motion.button
                onClick={handleClick}
                onMouseLeave={handleResetHover}
                onPointerLeave={handleResetHover}
                onPointerUp={handleResetHover}
                onTouchEnd={handleResetHover}
                whileHover={disabled ? {} : { scale: 1.03 }}
                whileTap={disabled ? {} : { scale: 0.96 }}
                style={{
                    width: 64,
                    height: 56,
                    borderRadius: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    border: isActive
                        ? (isDark ? '1px solid rgba(96, 165, 250, 0.35)' : '1px solid rgba(59, 130, 246, 0.3)')
                        : hovered && !disabled
                            ? (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.1)')
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.03)' : '1px solid rgba(0, 0, 0, 0.03)'),
                    outline: 'none',
                    cursor: disabled ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: isActive
                        ? (isDark
                            ? 'linear-gradient(180deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.75) 100%)'
                            : 'linear-gradient(180deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.7) 100%)')
                        : hovered && !disabled
                            ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)')
                            : (isDark ? 'rgba(255, 255, 255, 0.015)' : 'transparent'),
                    boxShadow: isActive
                        ? (isDark
                            ? '0 0 16px rgba(59, 130, 246, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            : '0 2px 8px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)')
                        : hovered
                            ? (isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.05)')
                            : 'none',
                }}
            >
                {/* SVG Icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: hovered ? 'translateY(-1px)' : 'none',
                    transition: 'transform 0.18s ease-in-out',
                }}>
                    {typeof icon === 'function' ? icon({ isActive, hovered }) : icon}
                </div>

                {/* CSES Sheet Monospace Typography */}
                <span style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "JetBrains Mono", monospace',
                    fontSize: label.length > 9 ? 8 : 9.5,
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: label.length > 9 ? '0.01em' : '0.03em',
                    lineHeight: 1,
                    color: isActive
                        ? (isDark ? '#93C5FD' : '#1D4ED8')
                        : hovered && !disabled
                            ? (isDark ? '#F1F5F9' : '#0F172A')
                            : (isDark ? '#64748B' : '#64748B'),
                    transition: 'color 0.18s ease',
                    whiteSpace: 'nowrap',
                }}>
                    {label}
                </span>

                {/* Future-Ready Unread Badge Slot (hidden when badge is null/undefined/0/false) */}
                {badge != null && badge !== false && badge !== 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        minWidth: typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? 14 : 6,
                        height: typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? 14 : 6,
                        padding: typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? '0 3.5px' : 0,
                        borderRadius: 99,
                        background: '#3B82F6',
                        color: '#FFFFFF',
                        fontSize: 8.5,
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(59,130,246,0.8)',
                    }}>
                        {typeof badge === 'number' || (typeof badge === 'string' && badge !== '') ? badge : null}
                    </span>
                )}
            </motion.button>

            {/* Hover Tooltip */}
            <SideTooltip label={label} badge={badge} visible={hovered} />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   CSES SHEET SECTION DIVIDER
═══════════════════════════════════════════════════════════════════ */
const CsesDivider = () => {
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    return (
        <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '4px 0',
            userSelect: 'none',
        }}>
            <div style={{ width: 18, height: 1, background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />
            <div style={{ width: 18, height: 1, background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   ICONS — Precision Modern SaaS & CSES Technical Style
═══════════════════════════════════════════════════════════════════ */
const HomeIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24"
        fill={filled ? 'rgba(59, 130, 246, 0.18)' : 'none'}
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={filled ? 1.9 : 1.75}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s, fill 0.18s' }}
    >
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const PlusIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24"
        fill={filled ? '#C084FC' : (hovered ? '#CBD5E1' : '#64748B')}
        style={{ transition: 'fill 0.18s' }}
    >
        <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
    </svg>
);

const AnnouncementIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24"
        fill={filled ? 'rgba(59, 130, 246, 0.18)' : 'none'}
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={filled ? 1.9 : 1.75}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s, fill 0.18s' }}
    >
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
);

const LostFoundIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24"
        fill="none"
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={1.75}
        strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s' }}
    >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.55" y2="16.55" />
    </svg>
);

const CieIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
            fill={filled ? "url(#dash-cie-icon-grad)" : "none"} 
            stroke={filled ? "#C4B5FD" : (hovered ? "#CBD5E1" : "#64748B")} 
            strokeWidth="1.75" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
        <defs>
            <linearGradient id="dash-cie-icon-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#a78bfa" />
                <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
        </defs>
    </svg>
);

const SgpaIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
            stroke={filled ? "#60A5FA" : (hovered ? "#CBD5E1" : "#64748B")} 
            strokeWidth="1.75" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill={filled ? "url(#dash-sgpa-icon-grad)" : "none"} stroke={filled ? "#60A5FA" : "#93C5FD"} strokeWidth="1.75" />
        <path d="M9 12h6M9 16h6" stroke={filled ? "#93C5FD" : (hovered ? "#94A3B8" : "#64748B")} strokeWidth="1.75" strokeLinecap="round" />
        <defs>
            <linearGradient id="dash-sgpa-icon-grad" x1="8" y1="2" x2="16" y2="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
        </defs>
    </svg>
);

const MaterialsIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s' }}
    >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={filled ? 'rgba(59, 130, 246, 0.2)' : 'none'} />
    </svg>
);

const InterviewsIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s' }}
    >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill={filled ? 'rgba(59, 130, 246, 0.2)' : 'none'} />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const MarketplaceIcon = ({ filled, hovered }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={filled ? '#60A5FA' : (hovered ? '#CBD5E1' : '#64748B')}
        strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: 'stroke 0.18s' }}
    >
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill={filled ? 'rgba(59, 130, 246, 0.2)' : 'none'} />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD SIDEBAR COMPONENT
═══════════════════════════════════════════════════════════════════ */
const DashboardSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    const isProfileSection = location.pathname.startsWith('/profile');

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'visible',
                paddingTop: 0,
                background: isDark ? 'rgba(9, 13, 22, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(226, 232, 240, 0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
        >
            {/* Logo */}
            <div
                style={{
                    width: '100%',
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(226, 232, 240, 0.8)',
                    flexShrink: 0,
                    cursor: 'pointer',
                }}
                onClick={() => window.location.href = '/'}
            >
                <ASLogo
                    size={32}
                    style={{ filter: isDark ? 'drop-shadow(0 0 10px rgba(139,92,246,0.4))' : 'none' }}
                />
            </div>

            {/* Nav Items */}
            {(() => {
                const isMaterials = location.pathname.includes('/materials');
                const isInterviews = location.pathname.includes('/interview-experiences');
                const isLostFound = location.pathname.includes('/lost-and-found');
                const isMarketplace = location.pathname.includes('/marketplace');
                const isHomeExact = location.pathname === '/home' || location.pathname === '/home/';
                const isRoadmaps = location.pathname.includes('/roadmaps');
                const isAnnouncements = location.pathname.includes('/announcements');
                const isPlusRoute = (location.pathname === '/plus' || location.pathname.startsWith('/plus/')) && !isAnnouncements && !isRoadmaps;
                const isAttendance = location.pathname.includes('/attendance');
                const isCie = location.pathname.includes('/cie');
                const isSgpa = location.pathname.includes('/sgpa') || location.pathname.includes('/cgpa');
                const isFacultyInsights = location.pathname.startsWith('/faculty-insights');

                return (
                    <nav
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 16,
                            paddingBottom: 16,
                            gap: 6,
                            width: '100%',
                            paddingLeft: 8,
                            paddingRight: 8,
                        }}
                    >
                        <NavItem
                            icon={({ hovered }) => <HomeIcon filled={isHomeExact} hovered={hovered} />}
                            label="Home"
                            isActive={isHomeExact}
                            onClick={() => navigate('/home')}
                        />
                        <NavItem
                            icon={({ hovered }) => <PlusIcon filled={isPlusRoute} hovered={hovered} />}
                            label="Plus"
                            isActive={isPlusRoute}
                            onClick={() => navigate('/plus')}
                        />
                        <NavItem
                            icon={({ hovered }) => <AnnouncementIcon filled={isAnnouncements} hovered={hovered} />}
                            label="Announcements"
                            isActive={isAnnouncements}
                            onClick={() => navigate('/plus/announcements')}
                            badge={null}
                        />
                        <NavItem
                            icon={({ hovered }) => (
                                <GraduationCap
                                    size={19}
                                    strokeWidth={1.75}
                                    className={isFacultyInsights ? 'text-purple-400' : (hovered ? 'text-slate-200' : 'text-slate-500')}
                                />
                            )}
                            label="Faculty"
                            isActive={isFacultyInsights}
                            onClick={() => navigate('/faculty-insights')}
                        />

                        {(isAttendance || isCie || isSgpa || isRoadmaps) && (
                            <>
                                <CsesDivider />
                                {isAttendance && (
                                    <NavItem
                                        icon={({ hovered }) => (
                                            <CheckSquare
                                                size={19}
                                                strokeWidth={1.75}
                                                className={isAttendance ? 'text-blue-400' : (hovered ? 'text-slate-200' : 'text-slate-500')}
                                            />
                                        )}
                                        label="Attendance"
                                        isActive={isAttendance}
                                        onClick={() => navigate('/home/attendance')}
                                    />
                                )}
                                {isCie && (
                                    <NavItem
                                        icon={({ hovered }) => <CieIcon filled={true} hovered={hovered} />}
                                        label="CIE"
                                        isActive={true}
                                        onClick={() => navigate('/home/cie')}
                                    />
                                )}
                                {isSgpa && (
                                    <NavItem
                                        icon={({ hovered }) => <SgpaIcon filled={true} hovered={hovered} />}
                                        label="SGPA"
                                        isActive={true}
                                        onClick={() => navigate('/plus/sgpa')}
                                    />
                                )}
                                {isRoadmaps && (
                                    <NavItem
                                        icon={({ hovered }) => (
                                            <Compass
                                                size={19}
                                                strokeWidth={1.75}
                                                className={isRoadmaps ? 'text-purple-400' : (hovered ? 'text-slate-200' : 'text-slate-500')}
                                            />
                                        )}
                                        label="Roadmap"
                                        isActive={true}
                                        onClick={() => navigate('/plus/roadmaps')}
                                    />
                                )}
                                <CsesDivider />
                            </>
                        )}

                        {isMaterials && (
                            <NavItem
                                icon={({ hovered }) => <MaterialsIcon filled={isMaterials} hovered={hovered} />}
                                label="Notes"
                                isActive={isMaterials}
                                onClick={() => navigate('/home/materials')}
                            />
                        )}

                        {isInterviews && (
                            <NavItem
                                icon={({ hovered }) => <InterviewsIcon filled={isInterviews} hovered={hovered} />}
                                label="Careers"
                                isActive={isInterviews}
                                onClick={() => navigate('/home/interview-experiences')}
                            />
                        )}

                        {isLostFound && (
                            <NavItem
                                icon={({ hovered }) => <LostFoundIcon filled={isLostFound} hovered={hovered} />}
                                label="Found"
                                isActive={isLostFound}
                                onClick={() => navigate('/home/lost-and-found')}
                            />
                        )}

                        {isMarketplace && (
                            <NavItem
                                icon={({ hovered }) => <MarketplaceIcon filled={isMarketplace} hovered={hovered} />}
                                label="Market"
                                isActive={isMarketplace}
                                onClick={() => navigate('/home/marketplace')}
                            />
                        )}

                        {isProfileSection && (
                            <NavItem
                                icon={({ hovered }) => (
                                    <UserRound
                                        size={19}
                                        strokeWidth={1.75}
                                        className={isProfileSection ? 'text-blue-400' : (hovered ? 'text-slate-200' : 'text-slate-500')}
                                    />
                                )}
                                label="Profile"
                                isActive={isProfileSection}
                                onClick={() => navigate('/profile')}
                            />
                        )}


                    </nav>
                );
            })()}

            {/* Profile Avatar Popover Menu at the bottom */}
            <div style={{ marginBottom: 20, zIndex: 50, flexShrink: 0 }}>
                <BottomProfileMenu user={user} />
            </div>

            {/* Bottom subtle ambient gradient */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
                background: isDark
                    ? 'linear-gradient(to top, rgba(59,130,246,0.03), transparent)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.02), transparent)',
                pointerEvents: 'none',
            }} />
        </div>
    );
};

export default DashboardSidebar;
