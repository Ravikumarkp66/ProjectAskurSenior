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


const HeroButtons = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handlePrimaryClick = () => {
        if (user) {
            navigate('/home');
        } else {
            navigate('/login');
        }
    };

    const handleSecondaryClick = () => {
        navigate('/plus');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.26, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 mb-8 w-full max-w-md sm:max-w-none"
        >
            {/* Primary Button: Go to Dashboard → */}
            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrimaryClick}
                aria-label="Go to Dashboard"
                className="h-11 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-[#080B14]"
            >
                <span>Go to Dashboard</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </motion.button>

            {/* Secondary Button: ✦ Explore AskUrSenior Plus */}
            <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSecondaryClick}
                aria-label="Explore AskUrSenior Plus"
                className="h-11 px-5 rounded-xl border border-slate-300 dark:border-slate-800/90 bg-white dark:bg-[#0D111C] hover:bg-slate-50 dark:hover:bg-[#111624] active:bg-slate-100 dark:active:bg-[#151B2C] text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-[#080B14]"
            >
                <span className="text-purple-600 dark:text-purple-400 text-xs">✦</span>
                <span>Explore AskUrSenior Plus</span>
            </motion.button>
        </motion.div>
    );
};

export default HeroButtons;
