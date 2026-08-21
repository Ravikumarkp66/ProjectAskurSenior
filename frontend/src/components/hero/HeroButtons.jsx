/**
 * HeroButtons.jsx
 * ─────────────────────────────────────────────────────────
 * Primary ("Start For Free") & Secondary ("Explore AskUrSenior Plus") CTA buttons
 * with premium micro-interactions, shimmer effects, and hover animations.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/hooks';

const HeroButtons = ({ primaryCTA, secondaryCTA }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handlePrimaryClick = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate(primaryCTA?.href || '/signup');
        }
    };

    const handleSecondaryClick = () => {
        navigate(secondaryCTA?.href || '/plus');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 sm:gap-4 mb-8 sm:mb-10 w-full max-w-md sm:max-w-none"
        >
            {/* Primary Button: Start For Free */}
            <div className="relative group w-full sm:w-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition duration-300 pointer-events-none" />
                
                <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handlePrimaryClick}
                    aria-label={user ? 'Go to Student Dashboard' : 'Start For Free'}
                    className="relative flex items-center justify-center gap-2.5 w-full sm:w-auto min-h-[48px] px-7 py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-extrabold text-base shadow-[0_4px_24px_rgba(124,58,237,0.38)] transition-all duration-300 border border-white/20 outline-none cursor-pointer overflow-hidden active:bg-purple-700"
                >
                    {/* Shimmer line */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"
                    />

                    <span>{user ? 'Go to Dashboard' : (primaryCTA?.label || 'Start For Free')}</span>
                    
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </motion.button>
            </div>

            {/* Secondary Button: Explore AskUrSenior Plus */}
            <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSecondaryClick}
                aria-label="Explore AskUrSenior Plus"
                className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl font-bold text-base transition-all duration-300 backdrop-blur-xl outline-none cursor-pointer"
                style={{
                    backgroundColor: 'var(--hero-btn-sec-bg, #F8FAFC)',
                    borderColor: 'var(--hero-btn-sec-border, #D1D5DB)',
                    color: 'var(--hero-btn-sec-text, #374151)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                }}
            >
                <span className="text-amber-500 font-extrabold">✨</span>
                <span>{secondaryCTA?.label || 'Explore AskUrSenior Plus'}</span>
            </motion.button>
        </motion.div>
    );
};

export default HeroButtons;
