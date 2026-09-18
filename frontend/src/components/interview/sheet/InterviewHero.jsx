import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';

// Smooth, subtle count-up hook using requestAnimationFrame
const useCountUp = (endValue, duration = 850) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const target = Number(endValue) || 0;
        if (target <= 0) {
            setCount(0);
            return;
        }

        let startTime = null;
        let animationFrameId;

        // Quadratic ease-out for a smooth finish
        const easeOutQuad = (t) => t * (2 - t);

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(easeOutQuad(progress) * target);
            setCount(current);

            if (progress < 1) {
                animationFrameId = window.requestAnimationFrame(step);
            } else {
                setCount(target);
            }
        };

        animationFrameId = window.requestAnimationFrame(step);

        return () => {
            if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        };
    }, [endValue, duration]);

    return count;
};

const InterviewHero = ({ totalCompanies = 0, totalStories = 0 }) => {
    const [notesModalOpen, setNotesModalOpen] = useState(false);

    // Fall back to actual counts if available or sensible defaults (13, 238)
    const targetCompanies = totalCompanies > 0 ? totalCompanies : 13;
    const targetStories = totalStories > 0 ? totalStories : 238;

    const animatedCompanies = useCountUp(targetCompanies, 850);
    const animatedStories = useCountUp(targetStories, 950);

    return (
        <div className="w-full pt-6 pb-4 relative">
            {/* 1. TOP-LEFT "i" (INFORMATION) BUTTON FOR RECRUITMENT NOTES */}
            <div className="absolute top-2 left-0 z-20">
                <button
                    type="button"
                    onClick={() => setNotesModalOpen(true)}
                    aria-label="View Recruitment Notes"
                    className="group flex items-center justify-center w-7 h-7 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition-all shadow-sm"
                    title="Recruitment Notes & Guidelines"
                >
                    <span className="font-serif italic font-bold text-xs">i</span>
                </button>
            </div>

            {/* 2. CENTERED HERO SECTION */}
            <div className="max-w-2xl mx-auto text-center px-4">
                {/* Subtle Placement Intelligence Label */}
                <div className="mb-2">
                    <span className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.24em] text-zinc-500 dark:text-zinc-400 uppercase">
                        Placement Intelligence
                    </span>
                </div>

                {/* Main Centered Heading */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase leading-tight mb-2.5">
                    ASK+ <span className="text-purple-600 dark:text-purple-400 font-black">EXPERIENCES</span>
                </h1>

                {/* Centered Description */}
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 font-normal max-w-lg mx-auto leading-relaxed">
                    Verified interview rounds, actual coding questions, and recruitment insights directly from senior peers.
                </p>

                {/* 3. ANIMATED COUNTERS (Directly under description) */}
                <div className="flex items-center justify-center gap-10 sm:gap-16 mt-6 pt-5 max-w-xs sm:max-w-sm mx-auto">
                    {/* Companies Counter */}
                    <div className="flex flex-col items-center text-center">
                        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                            {animatedCompanies}+
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">
                            Companies
                        </span>
                    </div>

                    {/* Subtle Vertical Divider */}
                    <div className="w-px h-8 bg-zinc-200 dark:bg-white/[0.1]" aria-hidden="true" />

                    {/* Experiences Counter */}
                    <div className="flex flex-col items-center text-center">
                        <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-white">
                            {animatedStories}+
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">
                            Experiences
                        </span>
                    </div>
                </div>
            </div>

            {/* 4. RECRUITMENT NOTES MODAL (Preserving exact original text) */}
            <AnimatePresence>
                {notesModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setNotesModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ duration: 0.15 }}
                            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f1117] border border-zinc-200 dark:border-white/[0.1] shadow-2xl p-5 sm:p-6 z-10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/[0.08] mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-serif italic text-xs font-bold">
                                        i
                                    </span>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide uppercase">
                                        Recruitment Notes
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setNotesModalOpen(false)}
                                    className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Preserved Exact Recruitment Notes Text */}
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3">
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
                                    Senior Peer Submission Guidelines:
                                </p>
                                <div className="space-y-2.5">
                                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200/80 dark:border-white/5">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                                            Authentic Experiences
                                        </span>
                                        Experiences are submitted directly by seniors and vetted for clarity. Interview questions and rounds may vary across hiring seasons.
                                    </div>
                                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200/80 dark:border-white/5">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                                            CTC Disclosures
                                        </span>
                                        Package figures typically represent full-time conversion CTC. Internship stipends may differ.
                                    </div>
                                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200/80 dark:border-white/5">
                                        <span className="font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                                            Eligibility Criteria
                                        </span>
                                        Cutoffs represent minimum CGPA thresholds specified by companies during campus recruitment drives.
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-white/[0.08] flex justify-end">
                                <button
                                    onClick={() => setNotesModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/[0.06] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InterviewHero;
