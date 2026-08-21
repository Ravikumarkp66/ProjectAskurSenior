/**
 * HeroPreview.jsx
 * ─────────────────────────────────────────────────────────
 * Reusable Hero Showcase component featuring a 5-second auto-rotating
 * showcase between Ask+, Study Materials, Interview Experiences,
 * Campus Explorer, and CGPA Calculator.
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SHOWCASE_TABS } from './heroConfig';

const HeroPreview = () => {
    const [activeIdx, setActiveIdx] = useState(0);
    const navigate = useNavigate();
    const intervalRef = useRef(null);

    const resetTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setActiveIdx((prev) => (prev + 1) % SHOWCASE_TABS.length);
        }, 5000);
    };

    useEffect(() => {
        resetTimer();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleTabClick = (idx) => {
        setActiveIdx(idx);
        resetTimer();
    };

    const currentTab = SHOWCASE_TABS[activeIdx];

    return (
        <div className="w-full max-w-xl lg:max-w-2xl mx-auto flex flex-col gap-4">
            {/* Top Showcase Navigation Pills */}
            <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
                {SHOWCASE_TABS.map((tab, idx) => {
                    const isActive = idx === activeIdx;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(idx)}
                            aria-label={`View ${tab.title}`}
                            className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 outline-none cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                isActive
                                    ? 'text-white bg-purple-600/30 border border-purple-500/40 shadow-[0_2px_12px_rgba(139,92,246,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span>{tab.title}</span>
                            {isActive && (
                                <motion.span
                                    layoutId="activeTabDot"
                                    className="w-1.5 h-1.5 rounded-full bg-purple-400"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Interactive Product Preview Screen */}
            <div className="relative rounded-2xl border border-white/10 bg-[#0c0919]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] overflow-hidden min-h-[380px] sm:min-h-[420px] flex flex-col">
                {/* Header Window Bar */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        <span className="text-[11px] font-mono text-slate-500 ml-2">askursenior.com/{currentTab.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase text-white bg-gradient-to-r ${currentTab.badgeColor}`}>
                            {currentTab.tag}
                        </span>
                        <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                            {currentTab.metrics}
                        </span>
                    </div>
                </div>

                {/* Dynamic Screen Viewport with Smooth Fade */}
                <div className="relative flex-1 p-5 overflow-hidden flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab.id}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="w-full flex flex-col h-full justify-between"
                        >
                            {/* 1. Ask+ AI Assistant View */}
                            {currentTab.id === 'ask_plus' && (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-2xl">
                                        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            🤖
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-purple-300 mb-1">Ask+ AI (SIT Edition)</p>
                                            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                                                "SIT CIE rules require a minimum of 40% aggregate in CIE 1, 2, 3 to be eligible for SEE exams. Here is your target score."
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-colors">
                                            <span className="text-purple-400 font-bold block mb-1">💡 Ask Question</span>
                                            <span className="text-slate-400 text-[11px]">"What happens if I get NE in Math III?"</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-colors">
                                            <span className="text-indigo-400 font-bold block mb-1">📝 Summarize</span>
                                            <span className="text-slate-400 text-[11px]">"Explain Fast Fourier Transform in 3 points"</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/ask-finder')}
                                        className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Try Ask+ Assistant Now →
                                    </button>
                                </div>
                            )}

                            {/* 2. Study Materials View */}
                            {currentTab.id === 'materials' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                        <span className="font-bold text-white">SIT Computer Science & Engineering</span>
                                        <span className="text-purple-400">Semester 5 • 2026</span>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            { title: 'DBMS Module 3 - Normalization Notes', author: 'Senior Top Scorer', downloads: '412', tag: 'NOTES' },
                                            { title: 'Engineering Physics SEE 2025 Solved PYQ', author: 'Verified Senior', downloads: '890', tag: 'PYQ' },
                                            { title: 'DSA Question Bank - Trees & Graphs', author: 'Faculty Approved', downloads: '654', tag: 'BANK' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 transition-colors">
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-bold text-slate-100 truncate">{item.title}</p>
                                                    <p className="text-[10px] text-slate-500">By {item.author} • {item.downloads} downloads</p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    {item.tag}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => navigate('/ask-finder')}
                                        className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Explore All Study Resources →
                                    </button>
                                </div>
                            )}

                            {/* 3. Interview Experiences View */}
                            {currentTab.id === 'interviews' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { company: 'Amazon', role: 'SDE-1', ctc: '28 LPA', difficulty: 'Hard', batch: '2026 Batch' },
                                            { company: 'Morgan Stanley', role: 'Tech Analyst', ctc: '19 LPA', difficulty: 'Medium', batch: '2026 Batch' },
                                            { company: 'TCS', role: 'Ninja/Digital', ctc: '7.5 LPA', difficulty: 'Easy', batch: '2025 Batch' },
                                            { company: 'Infosys', role: 'Specialist Programmer', ctc: '9.5 LPA', difficulty: 'Medium', batch: '2025 Batch' }
                                        ].map((c, i) => (
                                            <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-fuchsia-500/30 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-xs text-white">{c.company}</span>
                                                    <span className="text-[10px] text-emerald-400 font-bold">{c.ctc}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400">{c.role} • {c.batch}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => navigate('/interview')}
                                        className="w-full py-2.5 rounded-xl bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/30 text-fuchsia-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Read Senior Interview Transcripts →
                                    </button>
                                </div>
                            )}

                            {/* 4. Campus Explorer View */}
                            {currentTab.id === 'campus_map' && (
                                <div className="space-y-3">
                                    <div className="relative rounded-xl overflow-hidden h-36 bg-[#090f1e] border border-white/10 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                                        <div className="relative text-center p-4">
                                            <span className="text-2xl mb-1 block">🗺️</span>
                                            <p className="text-xs font-bold text-emerald-300">Interactive 3D SIT Campus Map</p>
                                            <p className="text-[10px] text-slate-400">Search CSE Block, Library, Mechanical Hall & Canteens</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/campus-map')}
                                        className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Open 3D Campus Explorer →
                                    </button>
                                </div>
                            )}

                            {/* 5. CGPA Calculator View */}
                            {currentTab.id === 'calculator' && (
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                        <p className="text-xs font-bold text-amber-300 mb-1">Target CGPA Predictor</p>
                                        <p className="text-2xl font-black text-white">8.94 SGPA Needed</p>
                                        <p className="text-[11px] text-slate-400 mt-1">To achieve overall 9.0 CGPA target in Semester 6</p>
                                    </div>

                                    <button
                                        onClick={() => navigate('/calculator')}
                                        className="w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        Calculate Your SGPA / CGPA Now →
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default HeroPreview;
