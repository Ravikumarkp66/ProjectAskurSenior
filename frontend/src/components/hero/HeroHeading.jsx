/**
 * HeroHeading.jsx
 * ─────────────────────────────────────────────────────────
 * Large, bold typography heading for AskUrSenior Hero.
 * Gradient applied exclusively to important words like "SIT Student".
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const HeroHeading = () => {
    return (
        <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 font-outfit text-slate-900 dark:text-white select-none"
        >
            Everything <br />
            Every <span className="text-purple-600 dark:text-purple-400 font-black">SIT</span> Student <br />
            Needs.
        </motion.h1>
    );
};

export default HeroHeading;
