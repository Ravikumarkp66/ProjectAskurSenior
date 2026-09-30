/**
 * BrandStatement.jsx
 * ─────────────────────────────────────────────────────────
 * Platform identity brand statement for AskUrSenior Hero.
 * "We share EXPERIENCE, not speculation."
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';

const BrandStatement = () => {
    return (
        <div className="mb-4 flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#7C3AED] dark:text-[#A78BFA] mb-1">
                <span>•</span>
                <span>REAL STUDENT EXPERIENCE</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#111827] dark:text-[#F3F4F6] tracking-tight">
                We share <span className="text-[#7C3AED] dark:text-[#A78BFA] font-bold">EXPERIENCE</span>, not speculation.
            </p>
        </div>
    );
};

export default BrandStatement;
