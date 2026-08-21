/**
 * HeroDescription.jsx
 * ─────────────────────────────────────────────────────────
 * Specific hero description paragraph.
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const HeroDescription = ({ description }) => {
    const text = description || "Access study materials, PYQs, interview experiences, AI assistance, campus tools, faculty information, and more—built specifically for SIT students.";

    return (
        <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
            className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 max-w-xl text-center lg:text-left font-normal"
        >
            {text}
        </motion.p>
    );
};

export default HeroDescription;
