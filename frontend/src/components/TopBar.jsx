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
const ProfileDropdown = ({ user, onLogout, onProfile }) => {
    const [open, setOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const ref = useRef(null);

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

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() || '?';

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <motion.button
                onClick={() => setOpen(v => !v)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(139,92,246,0.3)',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.2))',
                    color: '#c4b5fd',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    boxShadow: open ? '0 0 0 2px rgba(139,92,246,0.3)' : 'none',
                    transition: 'box-shadow 0.18s',
                    overflow: 'hidden',
                }}
            >
                {profilePic && !imgError ? (
                    <img
                        src={getProfilePicUrl(profilePic)}
                        alt=""
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    initials
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 10px)',
                            right: 0,
                            width: 200,
                            borderRadius: 14,
                            overflow: 'hidden',
                            background: 'rgba(8, 4, 22, 0.97)',
                            border: '1px solid rgba(139, 92, 246, 0.18)',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06)',
                            backdropFilter: 'blur(24px)',
                            zIndex: 999,
                        }}
                    >
                        {/* User info */}
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
                                {user?.name || 'Student'}
                            </p>
                            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.email}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '6px' }}>
                            {[
                                { label: 'View Profile', icon: '👤', action: () => { onProfile?.(); setOpen(false); } },
                                { label: 'Sign Out', icon: '→', action: () => { onLogout?.(); setOpen(false); }, danger: true },
                            ].map(item => (
                                <button
                                    key={item.label}
                                    onClick={item.action}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: 9,
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: item.danger ? 'rgba(239,68,68,0.8)' : 'rgba(148,163,184,0.85)',
                                        transition: 'background 0.15s, color 0.15s',
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = item.danger
                                            ? 'rgba(239,68,68,0.08)'
                                            : 'rgba(139,92,246,0.08)';
                                        e.currentTarget.style.color = item.danger ? 'rgba(239,68,68,1)' : '#f1f5f9';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = item.danger ? 'rgba(239,68,68,0.8)' : 'rgba(148,163,184,0.85)';
                                    }}
                                >
                                    <span style={{ fontSize: 14 }}>{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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
                <ProfileDropdown
                    user={user}
                    onLogout={handleLogout}
                    onProfile={() => {}}
                />
            </div>
        </div>
    );
};

export default TopBar;
