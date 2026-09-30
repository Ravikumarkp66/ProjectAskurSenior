/**
 * HeroHeading.jsx
 * ─────────────────────────────────────────────────────────
 * Large, bold typography heading for AskUrSenior Hero.
 * Purple accent applied to SIT.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';

const HeroHeading = () => {
    return (
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] mb-4 text-[#111827] dark:text-[#F3F4F6] select-none">
            Everything <br />
            Every <span className="text-[#7C3AED] dark:text-[#A78BFA]">SIT</span> Student <br />
            Needs.
        </h1>
    );
};

export default HeroHeading;
