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
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
    ),
    plus: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
        </svg>
    ),
    dashboard: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#8B5CF6">
            <path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0-18v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z" />
        </svg>
    ),
    pricing: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

    const iconColor = (item.id === 'plus' || item.icon === 'plus' || item.icon === 'dashboard' || item.id === 'pricing' || item.icon === 'pricing')
        ? '#8B5CF6'
        : isActive
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
