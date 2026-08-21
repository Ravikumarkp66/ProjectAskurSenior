/**
 * ProfileDropdown.jsx
 * ─────────────────────────────────────────────────────────
 * User avatar button that opens a glass dropdown menu.
 *
 * Dropdown items:
 *  • My Profile   → /profile
 *  • Theme toggle (inline light / dark switch)
 *  • Logout
 *
 * Props:
 *   user     – user object from AuthContext
 *   onLogout – logout callback
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/* ── User initials helper ───────────────────────────────── */
const getInitials = (user) =>
    user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || '?';

/* ── Icons ──────────────────────────────────────────────── */
const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const SunIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

const MoonIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

/* ── Profile dropdown menu ──────────────────────────────── */
const ProfileDropdown = ({ user, onLogout }) => {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const profilePic = user?.profilePicture || user?.avatar || user?.picture || user?.photo || '';

    useEffect(() => {
        setImgError(false);
    }, [profilePic]);

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${pic.startsWith('/') ? '' : '/'}${pic}`;
    };

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* Close on Escape */
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const initials = getInitials(user);

    const menuItems = [
        {
            id: 'profile',
            label: 'My Profile',
            icon: <UserIcon />,
            action: () => { navigate('/profile'); setOpen(false); },
        },
        {
            id: 'theme',
            label: isDark ? 'Light Mode' : 'Dark Mode',
            icon: isDark ? <SunIcon /> : <MoonIcon />,
            action: () => { toggleTheme(); },
            keepOpen: true,
        },
    ];

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Avatar button */}
            <motion.button
                onClick={() => setOpen((v) => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Open profile menu"
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    border: open
                        ? '2px solid rgba(139,92,246,0.6)'
                        : '1.5px solid rgba(139,92,246,0.3)',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(99,102,241,0.22))',
                    color: '#c4b5fd',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: open
                        ? '0 0 0 3px rgba(139,92,246,0.18), 0 4px 16px rgba(124,58,237,0.22)'
                        : '0 2px 8px rgba(0,0,0,0.2)',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    flexShrink: 0,
                }}
            >
                {profilePic && !imgError ? (
                    <img
                        src={getProfilePicUrl(profilePic)}
                        alt={user.name || 'Profile'}
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    initials
                )}
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        role="menu"
                        aria-label="Profile menu"
                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            right: 0,
                            width: 216,
                            borderRadius: 16,
                            overflow: 'hidden',
                            background: isDark
                                ? 'rgba(8, 4, 22, 0.97)'
                                : 'rgba(255, 255, 255, 0.98)',
                            border: isDark
                                ? '1px solid rgba(139,92,246,0.18)'
                                : '1px solid rgba(15,23,42,0.1)',
                            boxShadow: isDark
                                ? '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.06)'
                                : '0 20px 60px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.04)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            zIndex: 9999,
                        }}
                    >
                        {/* User info header */}
                        <div
                            style={{
                                padding: '14px 16px 12px',
                                borderBottom: isDark
                                    ? '1px solid rgba(139,92,246,0.1)'
                                    : '1px solid rgba(15,23,42,0.07)',
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 13,
                                    fontWeight: 650,
                                    color: isDark ? '#f1f5f9' : '#0f172a',
                                    marginBottom: 2,
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                    letterSpacing: '-0.01em',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {user?.name || 'Student'}
                            </p>
                            <p
                                style={{
                                    fontSize: 11.5,
                                    color: isDark
                                        ? 'rgba(148,163,184,0.5)'
                                        : 'rgba(100,116,139,0.7)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                }}
                            >
                                {user?.email}
                            </p>
                        </div>

                        {/* Menu items */}
                        <div style={{ padding: '6px' }}>
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    role="menuitem"
                                    onClick={() => {
                                        item.action();
                                        if (!item.keepOpen) setOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                        color: isDark
                                            ? 'rgba(148,163,184,0.85)'
                                            : 'rgba(71,85,105,0.9)',
                                        transition: 'background 0.14s, color 0.14s',
                                        textAlign: 'left',
                                        outline: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isDark
                                            ? 'rgba(139,92,246,0.1)'
                                            : 'rgba(124,58,237,0.06)';
                                        e.currentTarget.style.color = isDark ? '#f1f5f9' : '#0f172a';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = isDark
                                            ? 'rgba(148,163,184,0.85)'
                                            : 'rgba(71,85,105,0.9)';
                                    }}
                                >
                                    <span
                                        style={{
                                            color: isDark ? '#a78bfa' : '#7c3aed',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            ))}

                            {/* Divider */}
                            <div
                                style={{
                                    height: 1,
                                    margin: '4px 0',
                                    background: isDark
                                        ? 'rgba(139,92,246,0.1)'
                                        : 'rgba(15,23,42,0.06)',
                                }}
                            />

                            {/* Logout */}
                            <button
                                role="menuitem"
                                onClick={() => { onLogout?.(); setOpen(false); }}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 13,
                                    fontWeight: 500,
                                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                                    color: 'rgba(239,68,68,0.8)',
                                    transition: 'background 0.14s, color 0.14s',
                                    textAlign: 'left',
                                    outline: 'none',
                                    marginBottom: 2,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                                    e.currentTarget.style.color = 'rgba(239,68,68,1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(239,68,68,0.8)';
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <LogoutIcon />
                                </span>
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
