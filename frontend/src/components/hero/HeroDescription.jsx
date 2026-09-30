/**
 * HeroDescription.jsx
 * ─────────────────────────────────────────────────────────
 * Specific hero description paragraph.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';

const HeroDescription = ({ description }) => {
    const text = description || "Access verified study materials, solved PYQs, section timetables, attendance tracking, CIE calculators, lab coding tools, and senior interview experiences—built specifically for SIT students.";

    return (
        <p className="text-sm sm:text-base text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed mb-6 max-w-xl text-left font-normal">
            {text}
        </p>
    );
};

export default HeroDescription;
