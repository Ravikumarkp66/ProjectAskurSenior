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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block mb-6"
        >
            <div
                onClick={handleClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                aria-label={`Announcement: ${announcement.text}`}
                className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] dark:bg-white/[0.04] light:bg-[#F3E8FF] border border-purple-500/30 dark:border-purple-500/20 backdrop-blur-xl hover:bg-purple-500/10 transition-all duration-300 cursor-pointer select-none shadow-[0_2px_16px_rgba(139,92,246,0.12)]"
                style={{
                    backgroundColor: 'var(--announcement-bg, rgba(243, 232, 255, 0.9))',
                    borderColor: 'var(--announcement-border, rgba(168, 85, 247, 0.4))',
                }}
            >
                {/* Glow ring */}
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none" />

                {/* Badge Tag */}
                <span
                    className="relative inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider leading-none"
                    style={{
                        backgroundColor: 'var(--announcement-tag-bg, #7C3AED)',
                        color: 'var(--announcement-tag-text, #FFFFFF)',
                        border: '1px solid var(--announcement-tag-border, #6D28D9)'
                    }}
                >
                    {announcement.badge || '✨ NEW'}
                </span>

                {/* Text */}
                <span
                    className="relative text-xs md:text-sm font-bold tracking-tight transition-colors flex items-center gap-1"
                    style={{
                        color: 'var(--announcement-text, #4C1D95)'
                    }}
                >
                    {announcement.text || 'Campus Explorer 3D Map is Live'}
                    <svg
                        className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300"
                        style={{ color: 'var(--announcement-icon, #7C3AED)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </div>
        </motion.div>
    );
};

export default AnnouncementBadge;
