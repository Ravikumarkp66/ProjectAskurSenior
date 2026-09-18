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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block mb-5"
        >
            <button
                type="button"
                onClick={handleClick}
                aria-label="Announcement: Campus Explorer is now live"
                className="group inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none border border-purple-200/90 bg-purple-50/70 hover:bg-purple-100/70 text-slate-700 dark:border-purple-500/25 dark:bg-purple-950/25 dark:hover:bg-purple-900/35 dark:text-slate-300"
            >
                {/* Badge Tag */}
                <span className="font-bold text-[10px] tracking-wider text-purple-700 dark:text-purple-300 uppercase">
                    NEW
                </span>

                {/* Subtle Divider */}
                <span className="text-[9px] text-purple-400 dark:text-purple-400" aria-hidden="true">
                    ✦
                </span>

                {/* Text */}
                <span className="tracking-tight text-slate-800 dark:text-slate-200 font-medium">
                    Campus Explorer is now live
                </span>

                {/* Arrow */}
                <svg
                    className="w-3 h-3 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:translate-x-0.5 ml-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </motion.div>
    );
};

export default AnnouncementBadge;
