/**
 * HeroStatistics.jsx
 * ─────────────────────────────────────────────────────────
 * ONE structured statistics strip with subtle vertical separators.
 * 362+ Resources | 921+ Students | 13+ Companies | 2,000+ Peer Network
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const DEFAULT_ITEMS = [
    { count: '362+', label: 'Resources' },
    { count: '921+', label: 'Students' },
    { count: '13+', label: 'Companies' },
    { count: '2,000+', label: 'Peer Network' }
];

const HeroStatistics = ({ stats = [] }) => {
    // Standardize dynamic stats if provided
    const items = stats && stats.length >= 4 ? [
        { count: `${stats[0]?.count || 362}+`, label: 'Resources' },
        { count: `${stats[1]?.count || 921}+`, label: 'Students' },
        { count: `${stats[2]?.count || 13}+`, label: 'Companies' },
        { count: `${stats[3]?.count || 2000}+`, label: 'Peer Network' }
    ] : DEFAULT_ITEMS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32, ease: "easeOut" }}
            className="w-full max-w-xl"
        >
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#0D111C]/90 shadow-sm backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className="px-3 py-3 sm:px-4 sm:py-3 flex flex-col items-center sm:items-start text-center sm:text-left"
                        >
                            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight leading-none mb-1">
                                {item.count}
                            </span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default HeroStatistics;
