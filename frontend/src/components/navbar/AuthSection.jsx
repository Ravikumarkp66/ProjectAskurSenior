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

    /* ── Get Started CTA ──────────────────────────────────── */
    return (
        <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Get started with AskUrSenior"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 20px',
                borderRadius: 99,
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 650,
                letterSpacing: '-0.01em',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 60%, #818cf8 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(124,58,237,0.38), 0 0 0 1px rgba(124,58,237,0.22)',
                transition: 'box-shadow 0.2s, transform 0.2s',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                    '0 8px 32px rgba(124,58,237,0.48), 0 0 0 1px rgba(124,58,237,0.32)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                    '0 4px 20px rgba(124,58,237,0.38), 0 0 0 1px rgba(124,58,237,0.22)';
            }}
        >
            {/* Shimmer overlay */}
            <span
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                    animation: 'navShimmer 2.4s ease-in-out infinite',
                    borderRadius: 99,
                }}
            />
            Get Started
            <ArrowIcon />
        </motion.button>
    );
};

export default AuthSection;
