/**
 * HeroPreview.jsx
 * ─────────────────────────────────────────────────────────
 * Premium AskUrSenior Product Showcase.
 * Replaces fake browser mockups with real, polished UI previews:
 *   1. Ask+ AI
 *   2. Study Materials & PYQs
 *   3. Interview Experiences
 *   4. Campus Explorer
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TABS = [
    { id: 'ask_plus', label: 'Ask+ AI', badge: 'Trained on SIT' },
    { id: 'materials', label: 'Study Materials & PYQs', badge: '360+ Verified' },
    { id: 'interviews', label: 'Interview Experiences', badge: 'Real Placements' },
    { id: 'campus_map', label: 'Campus Explorer', badge: '3D Campus' }
];

const HeroPreview = () => {
    const [activeTab, setActiveTab] = useState('ask_plus');
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-lg lg:max-w-xl mx-auto flex flex-col gap-3">
            {/* Top Product Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0D111C] border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            aria-label={`View ${tab.label}`}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                                isActive
                                    ? 'bg-white dark:bg-[#151B2C] text-purple-700 dark:text-purple-300 shadow-sm border border-slate-200/80 dark:border-slate-700/60'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Product Showcase Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0D111C] shadow-sm overflow-hidden flex flex-col min-h-[360px]">
                {/* Header Bar */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#111624]/60">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 px-2 py-0.5 rounded-md">
                        {TABS.find(t => t.id === activeTab)?.badge}
                    </span>
                </div>

                {/* Viewport */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex flex-col justify-between"
                        >
                            {/* 1. Ask+ AI Assistant View */}
                            {activeTab === 'ask_plus' && (
                                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        {/* User prompt preview */}
                                        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-[#111624] border border-slate-200/70 dark:border-slate-800">
                                            <span className="text-xs font-bold text-slate-500 uppercase shrink-0 mt-0.5">Q:</span>
                                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                                What is the minimum CIE required for SEE 2026?
                                            </p>
                                        </div>

                                        {/* AI response preview */}
                                        <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-500/20 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                                    Ask+ Assistant
                                                </span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">• Official Syllabus</span>
                                            </div>
                                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                                Under SIT regulations, you must score at least <strong>40% in aggregate CIE</strong> (minimum 20/50) to be eligible for SEE. Scoring below 40% leads to a Not Eligible (NE) status.
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#111624] border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                                                    Ref: Academic Policy §4.1
                                                </span>
                                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded">
                                                    Verified Rule
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/ask-finder')}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Ask Ask+ a Question</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 2. Study Materials View */}
                            {activeTab === 'materials' && (
                                <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {[
                                            { title: 'DBMS Module 3 — Normalization Notes', branch: 'CSE', sem: 'Sem 5', downloads: '412', type: 'Notes' },
                                            { title: 'Engineering Physics — 2025 Solved Papers', branch: '1st Year', sem: 'Sem 1-2', downloads: '890', type: 'PYQ' },
                                            { title: 'Operating Systems — Question Bank', branch: 'ISE/CSE', sem: 'Sem 4', downloads: '654', type: 'Bank' }
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111624]/60 flex items-center justify-between"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {item.branch} • {item.sem} • {item.downloads} downloads
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/40 px-2 py-0.5 rounded shrink-0">
                                                    {item.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/ask-finder')}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Browse Study Materials</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 3. Interview Experiences View */}
                            {activeTab === 'interviews' && (
                                <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {[
                                            { company: 'Amazon', role: 'SDE-1', ctc: '28 LPA', summary: 'OA: Trees & DP. Technical R1: Graph traversal & system design.' },
                                            { company: 'Morgan Stanley', role: 'Technology Analyst', ctc: '19 LPA', summary: 'R1: Core Java, DBMS indexing. R2: Scenario architecture.' }
                                        ].map((exp, i) => (
                                            <div
                                                key={i}
                                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111624]/60 space-y-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {exp.company}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        {exp.ctc}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                                    {exp.role}
                                                </p>
                                                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    {exp.summary}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/interview')}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Read Placement Transcripts</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 4. Campus Explorer View */}
                            {activeTab === 'campus_map' && (
                                <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111624]/60 space-y-2.5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                            <span>🗺️</span>
                                            <span>SIT Campus Locations</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {[
                                                'Academic Block 2 (CSE & ISE)',
                                                'Central Library & Digital Reading Hall',
                                                'Mechanical Labs & Robotics Wing',
                                                'Food Court & South Canteen'
                                            ].map((loc, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" aria-hidden="true" />
                                                    <span>{loc}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/campus-map')}
                                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Open Campus Explorer</span>
                                        <span>→</span>
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
