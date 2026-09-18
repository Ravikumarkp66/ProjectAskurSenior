/**
 * HeroDescription.jsx
 * ─────────────────────────────────────────────────────────
 * Specific hero description paragraph.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const HeroDescription = ({ description }) => {
    const text = description || "Access study materials, PYQs, interview experiences, AI assistance, campus tools, faculty information, and more, built specifically for SIT students.";

    return (
        <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
            className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-6 max-w-xl text-left font-normal"
        >
            {text}
        </motion.p>
    );
};

export default HeroDescription;
