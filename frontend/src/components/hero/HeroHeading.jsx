/**
 * HeroHeading.jsx
 * ─────────────────────────────────────────────────────────
 * Large, bold typography heading for AskUrSenior Hero.
 * Gradient applied exclusively to important words like "SIT Student".
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const HeroHeading = ({ heading }) => {
    return (
        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white tracking-tight leading-[1.06] mb-4 font-outfit text-center lg:text-left select-none"
        >
            Everything <br />
            Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.35)]">SIT Student</span> <br />
            Needs.
        </motion.h1>
    );
};

export default HeroHeading;
