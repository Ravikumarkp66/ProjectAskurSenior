/**
 * AnnouncementBadge.jsx
 * ─────────────────────────────────────────────────────────
 * Dynamic, CMS-driven announcement badge for AskUrSenior Hero.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AnnouncementBadge = ({ announcement }) => {
    const navigate = useNavigate();

    if (!announcement || announcement.visible === false) return null;

    const handleClick = () => {
        if (announcement.href) navigate(announcement.href);
    };

    return (
        <div className="inline-block mb-4">
            <button
                type="button"
                onClick={handleClick}
                aria-label="Announcement: Campus Explorer is now live"
                className="group inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer select-none border border-[#E9D5FF] bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#6B21A8] dark:border-[#7C3AED]/30 dark:bg-[#581C87]/20 dark:hover:bg-[#581C87]/30 dark:text-[#DDD6FE]"
            >
                {/* Badge Tag */}
                <span className="font-semibold text-[10px] tracking-wider text-[#7C3AED] dark:text-[#A78BFA] uppercase">
                    NEW
                </span>

                {/* Subtle Divider */}
                <span className="text-[9px] text-[#C4B5FD] dark:text-[#A78BFA]" aria-hidden="true">
                    •
                </span>

                {/* Text */}
                <span className="tracking-tight text-[#581C87] dark:text-[#F3F4F6] font-medium">
                    Campus Explorer is now live
                </span>

                {/* Arrow */}
                <svg
                    className="w-3 h-3 text-[#7C3AED] dark:text-[#A78BFA] transition-transform duration-150 group-hover:translate-x-0.5 ml-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
};

export default AnnouncementBadge;
