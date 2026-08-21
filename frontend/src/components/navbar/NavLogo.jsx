/**
 * NavLogo.jsx
 * ─────────────────────────────────────────────────────────
 * Clickable AskUrSenior logo — navigates to "/" on click.
 * Uses the existing Logo component (ASLogo + responsive wordmark).
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../Logo';

const NavLogo = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            role="link"
            tabIndex={0}
            aria-label="Go to AskUrSenior home"
            onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
            className="rounded-full transition-all duration-200"
            style={{
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                outline: 'none',
                padding: '4px 10px',
                background: 'var(--logo-bg, transparent)',
                border: 'var(--logo-border, none)',
                boxShadow: 'var(--logo-shadow, none)'
            }}
        >
            <Logo size="sm" showText={true} textClassName="hidden sm:inline-block" />
        </motion.div>
    );
};

export default NavLogo;
