/**
 * NavigationItems.jsx
 * ─────────────────────────────────────────────────────────
 * Renders the center nav pills from a dynamic items array.
 * Items are sorted by `order` and filtered by `visible`.
 * Dynamic destination for Home depending on authentication state (user ? '/home' : '/').
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';

/* ── SVG icon map — add new icons here as needed ─────────── */
const NAV_ICONS = {
    home: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
    ),
    plus: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    pricing: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
};

/* ── Single nav pill ────────────────────────────────────── */
const NavPill = ({ item, isActive, isDark }) => {
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();

    const handleClick = () => {
        if (item.id === 'home') {
            navigate(user ? '/home' : '/');
        } else if (item.href) {
            navigate(item.href);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    };

    const iconColor = isActive
        ? isDark ? '#c4b5fd' : '#7c3aed'
        : isDark ? 'rgba(148,163,184,0.7)' : '#374151';

    return (
        <motion.button
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            tabIndex={0}
            role="link"
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.title}
            style={{
                position: 'relative',
                padding: '7px 16px',
                borderRadius: 99,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '-0.01em',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                background: isActive
                    ? isDark
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.16))'
                        : 'rgba(124, 58, 237, 0.1)'
                    : 'transparent',
                color: isActive
                    ? isDark ? '#c4b5fd' : '#7c3aed'
                    : isDark ? 'rgba(226,232,240,0.9)' : '#374151',
                boxShadow: isActive
                    ? isDark
                        ? '0 0 0 1px rgba(139,92,246,0.28), 0 2px 12px rgba(124,58,237,0.12)'
                        : '0 0 0 1px rgba(124,58,237,0.25), 0 2px 8px rgba(124,58,237,0.12)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                whiteSpace: 'nowrap',
            }}
        >
            {/* SVG icon */}
            {item.icon && NAV_ICONS[item.icon] && (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: iconColor,
                        transition: 'color 0.2s',
                        flexShrink: 0,
                    }}
                >
                    {NAV_ICONS[item.icon]}
                </span>
            )}

            {item.title}

            {item.badge && (
                <span
                    style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'rgba(139,92,246,0.9)',
                        background: 'rgba(139,92,246,0.12)',
                        border: '1px solid rgba(139,92,246,0.22)',
                        padding: '1px 6px',
                        borderRadius: 99,
                    }}
                >
                    {item.badge}
                </span>
            )}
        </motion.button>
    );
};

/* ── Navigation Items container ─────────────────────────── */
const NavigationItems = ({ items = [], isDark }) => {
    const { user } = React.useContext(AuthContext);
    const location = useLocation();

    const isActive = (item) => {
        const target = item.id === 'home' ? (user ? '/home' : '/') : item.href;
        if (!target) return false;
        if (target === '/') return location.pathname === '/';
        return location.pathname === target || location.pathname.startsWith(target + '/');
    };

    const visibleItems = [...items]
        .filter((item) => item.visible !== false)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
            }}
            role="navigation"
            aria-label="Main navigation"
        >
            {visibleItems.map((item) => (
                <NavPill
                    key={item.id || item.href}
                    item={item}
                    isActive={isActive(item)}
                    isDark={isDark}
                />
            ))}
        </div>
    );
};

export default NavigationItems;
