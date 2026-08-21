/**
 * ThemeToggle.jsx
 * ─────────────────────────────────────────────────────────
 * A pill-style light/dark toggle button.
 * Reads from and writes to ThemeContext.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/* ── Sun icon ───────────────────────────────────────────── */
const SunIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/* ── Moon icon ──────────────────────────────────────────── */
const MoonIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.93 }}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 99,
                border: isDark
                    ? '1px solid rgba(139,92,246,0.2)'
                    : '1px solid rgba(15,23,42,0.1)',
                background: isDark
                    ? 'rgba(139,92,246,0.08)'
                    : 'rgba(15,23,42,0.05)',
                color: isDark ? '#a78bfa' : '#64748b',
                cursor: 'pointer',
                outline: 'none',
                flexShrink: 0,
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            }}
        >
            <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 30, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {isDark ? <MoonIcon /> : <SunIcon />}
            </motion.div>
        </motion.button>
    );
};

export default ThemeToggle;
