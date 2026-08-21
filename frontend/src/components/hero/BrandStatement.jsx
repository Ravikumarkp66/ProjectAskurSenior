/**
 * BrandStatement.jsx
 * ─────────────────────────────────────────────────────────
 * Platform identity brand statement for AskUrSenior Hero.
 * "We share EXPERIENCE, not speculation."
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import { motion } from 'framer-motion';

const BrandStatement = ({ brandStatement }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
            className="mb-5 flex flex-col items-center lg:items-start"
        >
            <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs sm:text-sm md:text-base font-bold tracking-wide transition-all duration-200"
                style={{
                    backgroundColor: 'var(--brand-pill-bg, #7C3AED)',
                    borderColor: 'var(--brand-pill-border, rgba(124, 58, 237, 0.4))',
                    color: 'var(--brand-pill-text, #FFFFFF)',
                    boxShadow: 'var(--brand-pill-shadow, 0 4px 14px rgba(124, 58, 237, 0.25))'
                }}
            >
                <span>We share</span>
                <span className="font-extrabold tracking-wider uppercase text-sm sm:text-base md:text-lg" style={{ color: 'var(--brand-pill-highlight, #FDE047)' }}>
                    EXPERIENCE,
                </span>
                <span>not speculation.</span>
            </div>
        </motion.div>
    );
};

export default BrandStatement;
