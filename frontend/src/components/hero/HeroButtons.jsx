/**
 * HeroButtons.jsx
 * ─────────────────────────────────────────────────────────
 * Primary ("Go to Dashboard") & Secondary ("Explore AskUrSenior Plus") CTA buttons
 * formatted with platform purple theme and 6px border radius.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
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
        navigate('/pricing');
    };

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 mb-8 w-full max-w-md sm:max-w-none">
            {/* Primary Button: Go to Dashboard → */}
            <button
                type="button"
                onClick={handlePrimaryClick}
                aria-label="Go to Dashboard"
                className="h-10 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
            >
                <span>Go to Dashboard</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>

            {/* Secondary Button: Explore AskUrSenior Plus */}
            <button
                type="button"
                onClick={handleSecondaryClick}
                aria-label="Explore AskUrSenior Plus"
                className="h-10 px-4 rounded-[6px] border border-[#D1D5DB] dark:border-[#292E37] bg-white dark:bg-[#15181D] hover:bg-[#F8FAFC] dark:hover:bg-[#1B1F26] text-[#374151] dark:text-[#F3F4F6] font-medium text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
            >
                <span className="text-[#7C3AED] dark:text-[#A78BFA] text-xs font-bold">✦</span>
                <span>Explore AskUrSenior Plus</span>
            </button>
        </div>
    );
};

export default HeroButtons;
