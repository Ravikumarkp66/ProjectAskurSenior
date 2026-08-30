import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ASLogo } from './Logo';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import academicAPI from '../services/academicService';
import { User, Settings, Star, Bell, Shield, Sun, Moon, MessageSquare, LogOut, HelpCircle, Map, GraduationCap, BookOpenCheck, LayoutList, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import BottomProfileMenu from './BottomProfileMenu';

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR WIDTH — 80px fixed, icon-only (like Linear / Discord)
═══════════════════════════════════════════════════════════════════ */
export const SIDEBAR_WIDTH = 80;

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP — appears to the right of hovered item
═══════════════════════════════════════════════════════════════════ */
const SideTooltip = ({ label, badge, visible }) => (
    <AnimatePresence>
        {visible && (
            <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    position: 'absolute',
                    left: 'calc(100% + 12px)',
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
                    padding: '6px 12px',
                    borderRadius: 10,
                    background: 'rgba(8, 4, 22, 0.97)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
                    backdropFilter: 'blur(20px)',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                        {label}
                    </span>
                    {badge && (
                        <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: 'rgba(139,92,246,0.9)',
                            background: 'rgba(139,92,246,0.12)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            padding: '2px 6px',
                            borderRadius: 99,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                        }}>
                            {badge}
                        </span>
                    )}
                </div>
                {/* Arrow */}
                <div style={{
                    position: 'absolute',
                    left: -5,
                    top: '50%',
                    transform: 'translateY(-50%) rotate(45deg)',
                    width: 8,
                    height: 8,
                    background: 'rgba(8, 4, 22, 0.97)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderTop: 'none',
                    borderRight: 'none',
                }} />
            </motion.div>
        )}
    </AnimatePresence>
);

/* ═══════════════════════════════════════════════════════════════════
   NAV ITEM — Blue Border Card with Internal Icon & Text
═══════════════════════════════════════════════════════════════════ */
const NavItem = ({ icon, label, badge, isActive, onClick, disabled = false }) => {
    const [hovered, setHovered] = useState(false);
    const location = useLocation();

    // Reset hovered state immediately whenever route changes
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
            <motion.button
                onClick={handleClick}
                onMouseLeave={handleResetHover}
                onPointerLeave={handleResetHover}
                onPointerUp={handleResetHover}
                onTouchEnd={handleResetHover}
                whileHover={disabled ? {} : { scale: 1.05 }}
                whileTap={disabled ? {} : { scale: 0.95 }}
                style={{
                    width: 56,
                    height: 66,
                    borderRadius: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    border: isActive
                        ? '1.5px solid #3b82f6'
                        : hovered && !disabled
                            ? '1.5px solid #60a5fa'
                            : '1px solid rgba(59, 130, 246, 0.4)',
                    outline: 'none',
                    cursor: disabled ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s ease-in-out',
                    background: isActive
                        ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.45), rgba(59, 130, 246, 0.18))'
                        : hovered && !disabled
                            ? 'rgba(30, 58, 138, 0.25)'
                            : 'rgba(15, 23, 42, 0.65)',
                    boxShadow: isActive
                        ? '0 0 16px rgba(59, 130, 246, 0.35), inset 0 0 10px rgba(59, 130, 246, 0.15)'
                        : hovered
                            ? '0 0 12px rgba(59, 130, 246, 0.25)'
                            : '0 2px 8px rgba(0, 0, 0, 0.4)',
                }}
            >
                {/* Active left accent bar */}
                {isActive && (
                    <div
                        style={{
                            position: 'absolute',
                            left: -12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3.5,
                            height: 28,
                            borderRadius: 99,
                            background: 'linear-gradient(180deg, #3B82F6, #60A5FA)',
                            boxShadow: '0 0 12px rgba(59, 130, 246, 0.8)',
                            transition: 'all 0.2s ease',
                        }}
                    />
                )}

                {/* SVG Icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: hovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.18s ease-in-out',
                }}>
                    {icon}
                </div>

                {/* Text Label Inside Icon Rectangle Card */}
                <span style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive
                        ? '#93C5FD'
                        : hovered && !disabled
                            ? '#E2E8F0'
                            : '#94A3B8',
                    letterSpacing: '-0.01em',
                    lineHeight: 1,
                    transition: 'color 0.18s',
                }}>
                    {label}
                </span>

                {/* Badge */}
                {badge && (
                    <span style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#3B82F6',
                        boxShadow: '0 0 6px rgba(59,130,246,0.8)',
                    }} />
                )}
            </motion.button>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════════════ */
const HomeIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#3B82F6' : 'none'} stroke={filled ? '#60A5FA' : '#93C5FD'} strokeWidth={filled ? 1.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const PlusIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#8B5CF6">
        <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
    </svg>
);

const AcademicIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#8B5CF6' : 'none'} stroke={filled ? '#A78BFA' : '#93C5FD'} strokeWidth={filled ? 1.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
);

const LostFoundIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={filled ? '#60A5FA' : '#93C5FD'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.55" y2="16.55" />
    </svg>
);

const CieIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
            fill={filled ? "url(#dash-cie-icon-grad)" : "none"} 
            stroke={filled ? "#C4B5FD" : "#93C5FD"} 
            strokeWidth="1.8" 
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

const SgpaIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" 
            stroke={filled ? "#60A5FA" : "#93C5FD"} 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill={filled ? "url(#dash-sgpa-icon-grad)" : "none"} stroke={filled ? "#60A5FA" : "#93C5FD"} strokeWidth="1.8" />
        <path d="M9 12h6M9 16h6" stroke={filled ? "#93C5FD" : "#64748B"} strokeWidth="1.8" strokeLinecap="round" />
        <defs>
            <linearGradient id="dash-sgpa-icon-grad" x1="8" y1="2" x2="16" y2="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
        </defs>
    </svg>
);

const SGPAIcon = SgpaIcon;

const MaterialsIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={filled ? '#60A5FA' : '#93C5FD'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill={filled ? 'rgba(59, 130, 246, 0.25)' : 'none'} />
    </svg>
);

const InterviewsIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={filled ? '#60A5FA' : '#93C5FD'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" fill={filled ? 'rgba(59, 130, 246, 0.25)' : 'none'} />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const MarketplaceIcon = ({ filled }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={filled ? '#60A5FA' : '#93C5FD'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill={filled ? 'rgba(59, 130, 246, 0.25)' : 'none'} />
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
    const { user, logout } = useContext(AuthContext);
    const themeContext = useTheme();
    const isDark = themeContext ? themeContext.isDark : true;

    const handleLogout = () => {
        logout?.();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
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
                background: isDark ? 'rgba(7, 5, 18, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderRight: isDark ? '1px solid rgba(139, 92, 246, 0.08)' : '1px solid rgba(226, 232, 240, 0.8)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
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
                    borderBottom: '1px solid rgba(139,92,246,0.07)',
                    flexShrink: 0,
                    cursor: 'pointer',
                }}
                onClick={() => window.location.href = '/'}
            >
                <ASLogo
                    size={34}
                    style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }}
                />
            </div>

            {/* Nav Items */}
            {(() => {
                const isMaterials = location.pathname.includes('/materials');
                const isInterviews = location.pathname.includes('/interview-experiences');
                const isLostFound = location.pathname.includes('/lost-and-found');
                const isMarketplace = location.pathname.includes('/marketplace');
                const isSGPA = location.pathname.includes('/sgpa-calculator') || location.pathname.includes('/sgpa') || location.pathname.includes('/cgpa');
                const isCGPA = location.pathname.includes('/cgpa-calculator');
                const isHomeExact = location.pathname === '/home' || location.pathname === '/home/';
                const isStudentAcademics = location.pathname.includes('/student-academics') || location.pathname.includes('/academic-register');
                const isAttendance = location.pathname.includes('/attendance');
                const isCie = location.pathname.includes('/cie');
                const isSgpa = location.pathname.includes('/sgpa') || location.pathname.includes('/cgpa');
                const isTimetable = location.pathname.includes('/timetable') || location.pathname.includes('/todays-classes');
                const isAcademicNav = isStudentAcademics || isAttendance || isCie || isSgpa || isTimetable;
                const searchParams = new URLSearchParams(location.search);
                const currentSection = searchParams.get('section') || 'registration';

                return (
                    <nav
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: 20,
                            paddingBottom: 20,
                            gap: 8,
                            width: '100%',
                            paddingLeft: 16,
                            paddingRight: 16,
                        }}
                    >
                        <NavItem
                            icon={<HomeIcon filled={isHomeExact} />}
                            label="Home"
                            isActive={isHomeExact}
                            onClick={() => navigate('/home')}
                        />
                        <NavItem
                            icon={<PlusIcon />}
                            label="Plus"
                            isActive={location.pathname.startsWith('/plus')}
                            onClick={() => navigate('/plus')}
                        />
                        <NavItem
                            icon={<AcademicIcon filled={isStudentAcademics} />}
                            label="Academics"
                            isActive={isStudentAcademics}
                            onClick={() => navigate('/student-academics')}
                        />

                        {(isAttendance || isCie || isSgpa) && (
                            <>
                                <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(139, 92, 246, 0.15)', margin: '4px 0' }} />
                                {isAttendance && (
                                    <NavItem
                                        icon={<CheckSquare size={20} strokeWidth={1.8} />}
                                        label="Attendance"
                                        isActive={isAttendance}
                                        onClick={() => navigate('/home/attendance')}
                                    />
                                )}
                                {isCie && (
                                    <NavItem
                                        icon={<CieIcon filled={true} />}
                                        label="CIE"
                                        isActive={true}
                                        onClick={() => navigate('/home/cie')}
                                    />
                                )}
                                {isSgpa && (
                                    <NavItem
                                        icon={<SgpaIcon filled={true} />}
                                        label="SGPA"
                                        isActive={true}
                                        onClick={() => navigate('/home/sgpa')}
                                    />
                                )}
                                <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(139, 92, 246, 0.15)', margin: '4px 0' }} />
                            </>
                        )}

                        {isMaterials && (
                            <NavItem
                                icon={<MaterialsIcon filled={isMaterials} />}
                                label="Notes"
                                isActive={isMaterials}
                                onClick={() => navigate('/home/materials')}
                            />
                        )}

                        {isInterviews && (
                            <NavItem
                                icon={<InterviewsIcon filled={isInterviews} />}
                                label="Careers"
                                isActive={isInterviews}
                                onClick={() => navigate('/home/interview-experiences')}
                            />
                        )}

                        {isLostFound && (
                            <NavItem
                                icon={<LostFoundIcon filled={isLostFound} />}
                                label="Found"
                                isActive={isLostFound}
                                onClick={() => navigate('/home/lost-and-found')}
                            />
                        )}

                        {isMarketplace && (
                            <NavItem
                                icon={<MarketplaceIcon filled={isMarketplace} />}
                                label="Market"
                                isActive={isMarketplace}
                                onClick={() => navigate('/home/marketplace')}
                            />
                        )}

                        {isProfileSection && (
                            <NavItem
                                icon={<User size={20} strokeWidth={1.8} />}
                                label="Profile"
                                isActive={isProfileSection}
                                onClick={() => navigate('/profile')}
                            />
                        )}
                    </nav>
                );
            })()}

            {/* Profile Avatar Popover Menu at the bottom */}
            <div style={{ marginBottom: 24, zIndex: 50, flexShrink: 0 }}>
                <BottomProfileMenu user={user} />
            </div>

            {/* Bottom glow */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
                background: 'linear-gradient(to top, rgba(124,58,237,0.04), transparent)',
                pointerEvents: 'none',
            }} />
        </div>
    );
};

export default DashboardSidebar;
