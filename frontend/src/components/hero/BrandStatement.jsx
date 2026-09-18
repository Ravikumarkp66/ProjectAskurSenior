/**
 * BrandStatement.jsx
 * ─────────────────────────────────────────────────────────
 * Platform identity brand statement for AskUrSenior Hero.
 * "We share EXPERIENCE, not speculation."
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const BrandStatement = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14, ease: "easeOut" }}
            className="mb-4 flex flex-col items-start text-left"
        >
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400 mb-1">
                <span className="text-[10px]">✦</span>
                <span>REAL STUDENT EXPERIENCE</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                We share <span className="text-purple-600 dark:text-purple-400 font-bold">EXPERIENCE</span>, not speculation.
            </p>
        </motion.div>
    );
};

export default BrandStatement;
