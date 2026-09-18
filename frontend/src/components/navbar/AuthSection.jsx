/**
 * AuthSection.jsx
 * ─────────────────────────────────────────────────────────
 * Renders either:
 *   • "Get Started" button  — when user is NOT logged in
 *   • <ProfileDropdown />   — when user IS logged in
 *
 * All authentication logic lives here; Navbar stays clean.
 *
 * Props:
 *   user     – user object or null from AuthContext
 *   isDark   – boolean from ThemeContext
 *   onLogout – logout callback
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

/* ── Spark / arrow icon for CTA ─────────────────────────── */
const ArrowIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginLeft: 2 }}
    >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const AuthSection = ({ user, isDark, onLogout }) => {
    const navigate = useNavigate();

    if (user) {
        return <ProfileDropdown user={user} onLogout={onLogout} />;
    }

    /* ── Understated Sign In CTA (equal visual weight to ThemeToggle) ── */
    return (
        <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Sign in to AskUrSenior"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 border cursor-pointer select-none bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 dark:bg-[#111624] dark:hover:bg-[#171F32] dark:border-slate-800 dark:text-slate-200 dark:hover:border-purple-500/40"
        >
            <span>Sign In</span>
            <ArrowIcon />
        </motion.button>
    );
};

export default AuthSection;
