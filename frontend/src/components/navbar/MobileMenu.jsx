/**
 * MobileMenu.jsx
 * ─────────────────────────────────────────────────────────
 * Full-screen slide-down mobile navigation drawer.
 * Rendered when viewport width < 768px.
 *
 * Props:
 *   isOpen        – boolean controlling visibility
 *   onClose       – callback to close the menu
 *   items         – array from navConfig
 *   user          – user object or null
 *   isDark        – boolean from ThemeContext
 *   onLogout      – logout callback
 * ─────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/* ── X / Close icon ─────────────────────────────────────── */
const XIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const NAV_ICONS = {
    home: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
    ),
    plus: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
        </svg>
    ),
    dashboard: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
        </svg>
    ),
    pricing: (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.5 4.5L22 2" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M21 7.2L12.8 2.5C12.3 2.2 11.7 2.3 11.2 2.7L2.8 11.1C2.3 11.6 2.3 12.4 2.8 12.9L11.1 21.2C11.6 21.7 12.4 21.7 12.9 21.2L21.3 12.8C21.7 12.3 21.8 11.7 21.5 11.2L21 7.2Z" fill="#8B5CF6" />
            <circle cx="16" cy="8" r="1.6" fill="#030712" />
            <line x1="10" y1="7.5" x2="13" y2="10.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            <line x1="8" y1="9.5" x2="12.5" y2="14" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            <line x1="10.5" y1="14" x2="13.5" y2="17" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
            <path d="M5.5 13.5H9.5M5.5 15H9M5.5 13.5V19M5.5 16.2C7 16.2 8 15.6 8 14.8C8 14 7 13.5 5.5 13.5M6.8 16.2L9.2 19" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

const MobileMenu = ({ isOpen, onClose, items = [], user, isDark, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleTheme } = useTheme();

    /* Lock body scroll while open */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    /* Close on route change */
    useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line

    const isActive = (href) => {
        if (!href) return false;
        if (href === '/') return location.pathname === '/';
        return location.pathname === href || location.pathname.startsWith(href + '/');
    };

    const visibleItems = [...items]
        .filter((item) => item.visible !== false)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    const handleNav = (href) => {
        if (href) navigate(href);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="mobile-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 997,
                            background: isDark
                                ? 'rgba(3,7,18,0.7)'
                                : 'rgba(15,23,42,0.4)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        key="mobile-drawer"
                        initial={{ opacity: 0, y: -24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: 'fixed',
                            top: 88,
                            left: 12,
                            right: 12,
                            zIndex: 998,
                            borderRadius: 20,
                            overflow: 'hidden',
                            background: isDark
                                ? 'rgba(6, 3, 18, 0.98)'
                                : 'rgba(255, 255, 255, 0.99)',
                            border: isDark
                                ? '1px solid rgba(139,92,246,0.18)'
                                : '1px solid rgba(15,23,42,0.1)',
                            boxShadow: isDark
                                ? '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.06)'
                                : '0 24px 80px rgba(15,23,42,0.16)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile navigation menu"
                    >
                        {/* Nav items */}
                        <nav style={{ padding: '12px 8px 6px' }}>
                            {visibleItems.map((item, index) => (
                                <motion.button
                                    key={item.id || item.href}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.2 }}
                                    onClick={() => handleNav(item.href)}
                                    style={{
                                        width: '100%',
                                        padding: '13px 16px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: isActive(item.href)
                                            ? isDark
                                                ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.12))'
                                                : 'rgba(124,58,237,0.07)'
                                            : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: 15,
                                        fontWeight: isActive(item.href) ? 650 : 500,
                                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                        color: isActive(item.href)
                                            ? isDark ? '#c4b5fd' : '#7c3aed'
                                            : isDark ? 'rgba(203,213,225,0.9)' : 'rgba(30,41,59,0.85)',
                                        textAlign: 'left',
                                        letterSpacing: '-0.01em',
                                        outline: 'none',
                                        marginBottom: 2,
                                        transition: 'background 0.15s, color 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {item.icon && NAV_ICONS[item.icon] && (
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: (item.id === 'plus' || item.icon === 'plus' || item.icon === 'dashboard')
                                                    ? '#8B5CF6'
                                                    : isActive(item.href)
                                                        ? isDark ? '#c4b5fd' : '#7c3aed'
                                                        : isDark ? 'rgba(148,163,184,0.7)' : '#64748b',
                                                flexShrink: 0
                                            }}>
                                                {NAV_ICONS[item.icon]}
                                            </span>
                                        )}
                                        <span>{item.title}</span>
                                    </div>
                                    {item.badge && (
                                        <span style={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                            color: 'rgba(139,92,246,0.9)',
                                            background: 'rgba(139,92,246,0.12)',
                                            border: '1px solid rgba(139,92,246,0.22)',
                                            padding: '2px 7px',
                                            borderRadius: 99,
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </nav>

                        {/* Divider */}
                        <div style={{
                            height: 1,
                            margin: '0 12px',
                            background: isDark
                                ? 'rgba(139,92,246,0.1)'
                                : 'rgba(15,23,42,0.07)',
                        }} />

                        {/* Footer actions */}
                        <div style={{ padding: '10px 8px 12px' }}>
                            {/* Theme toggle row */}
                            <button
                                onClick={toggleTheme}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                    color: isDark ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)',
                                    textAlign: 'left',
                                    outline: 'none',
                                    marginBottom: 2,
                                }}
                            >
                                <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                                <span style={{
                                    width: 32,
                                    height: 18,
                                    borderRadius: 99,
                                    background: isDark
                                        ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                                        : 'rgba(148,163,184,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 3px',
                                    transition: 'background 0.25s',
                                    position: 'relative',
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: '#fff',
                                        transform: isDark ? 'translateX(14px)' : 'translateX(0)',
                                        transition: 'transform 0.25s',
                                        display: 'block',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                    }} />
                                </span>
                            </button>

                            {/* Auth action */}
                            {user ? (
                                <>
                                    {/* Profile row */}
                                    <button
                                        onClick={() => { navigate('/profile'); onClose(); }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 12,
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                            color: isDark ? 'rgba(148,163,184,0.8)' : 'rgba(71,85,105,0.85)',
                                            textAlign: 'left',
                                            outline: 'none',
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.25))',
                                            border: '1.5px solid rgba(139,92,246,0.3)',
                                            color: '#c4b5fd',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {user?.name?.[0]?.toUpperCase() || '?'}
                                        </span>
                                        My Profile
                                    </button>

                                    {/* Logout */}
                                    <button
                                        onClick={() => { onLogout?.(); onClose(); }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 12,
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            fontWeight: 500,
                                            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                            color: 'rgba(239,68,68,0.8)',
                                            textAlign: 'left',
                                            outline: 'none',
                                        }}
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                /* Get Started */
                                <button
                                    onClick={() => { navigate('/login'); onClose(); }}
                                    style={{
                                        width: '100%',
                                        padding: '13px 20px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 60%, #818cf8 100%)',
                                        color: '#fff',
                                        fontSize: 14,
                                        fontWeight: 650,
                                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                        cursor: 'pointer',
                                        letterSpacing: '-0.01em',
                                        boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                                        outline: 'none',
                                        transition: 'box-shadow 0.18s',
                                        marginTop: 2,
                                    }}
                                >
                                    Get Started
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
