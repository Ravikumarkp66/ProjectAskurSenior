import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SIDEBAR_WIDTH } from './Sidebar';
import Logo from './Logo';

/* ═══════════════════════════════════════════════════════════════════
   NAV PILL ITEM
═══════════════════════════════════════════════════════════════════ */
const NavPill = ({ label, path, isActive, onClick, badge }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        style={{
            position: 'relative',
            padding: '6px 14px',
            borderRadius: 99,
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            letterSpacing: '-0.01em',
            transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
            background: isActive
                ? 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.18))'
                : 'transparent',
            color: isActive
                ? '#c4b5fd'
                : 'rgba(148,163,184,0.75)',
            boxShadow: isActive
                ? '0 0 0 1px rgba(139,92,246,0.28), 0 2px 12px rgba(124,58,237,0.14)'
                : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}
    >
        {label}
        {badge && (
            <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(139,92,246,0.85)',
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.2)',
                padding: '1px 5px',
                borderRadius: 99,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
            }}>
                {badge}
            </span>
        )}
    </motion.button>
);

/* ═══════════════════════════════════════════════════════════════════
   PROFILE DROPDOWN
═══════════════════════════════════════════════════════════════════ */
import UserMenu from './common/UserMenu';


/* ═══════════════════════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════════════════════ */
const TopBar = () => {
    const { user, logout } = React.useContext(AuthContext);
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    const navItems = [
        { label: 'Home', path: '/home' },
        { label: 'AskUrSenior Plus', path: '/plus' },
        { label: 'Pricing', path: '/pricing' },
    ];

    const handleLogout = () => {
        logout?.();
        navigate('/login');
    };

    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: SIDEBAR_WIDTH,
                right: 0,
                height: 64,
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                background: isDark ? 'rgba(7, 5, 18, 0.88)' : 'rgba(255,255,255,0.90)',
                borderBottom: isDark ? '1px solid rgba(139,92,246,0.08)' : '1px solid rgba(15,23,42,0.06)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: isDark
                    ? '0 1px 0 rgba(139,92,246,0.04), 0 4px 24px rgba(0,0,0,0.35)'
                    : '0 1px 0 rgba(15,23,42,0.03), 0 4px 20px rgba(15,23,42,0.04)',
            }}
        >
            {/* Logo — left */}
            <div
                style={{ paddingLeft: 24, paddingRight: 24, cursor: 'pointer', flexShrink: 0 }}
                onClick={() => navigate('/home')}
            >
                <Logo size="sm" showText={true} />
            </div>

            {/* Center Nav */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '4px',
                    borderRadius: 99,
                    background: isDark ? 'rgba(139,92,246,0.05)' : 'rgba(15,23,42,0.04)',
                    border: isDark ? '1px solid rgba(139,92,246,0.08)' : '1px solid rgba(15,23,42,0.06)',
                }}>
                    {navItems.map(item => (
                        <NavPill
                            key={item.label}
                            label={item.label}
                            path={item.path}
                            isActive={item.path ? isActive(item.path) : false}
                            badge={item.badge}
                            onClick={() => {
                                if (item.path) navigate(item.path);
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Right — Profile */}
            <div style={{ paddingLeft: 24, paddingRight: 24, flexShrink: 0 }}>
                <UserMenu direction="down" align="right" />
            </div>
        </div>
    );
};

export default TopBar;
