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
        <div className="w-full max-w-xl">
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] shadow-none overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB] dark:divide-[#292E37]">
                    {items.map((item, idx) => (
                        <div
                            key={idx}
                            className="px-3 py-3 sm:px-4 sm:py-3 flex flex-col items-center sm:items-start text-center sm:text-left"
                        >
                            <span className="text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F3F4F6] tracking-tight leading-none mb-1 tabular-nums">
                                {item.count}
                            </span>
                            <span className="text-xs font-medium text-[#6B7280] dark:text-[#71717A] tracking-tight">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HeroStatistics;
