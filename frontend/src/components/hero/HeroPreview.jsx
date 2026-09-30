/**
 * HeroPreview.jsx
 * ─────────────────────────────────────────────────────────
 * Genuine AskUrSenior Product Showcase.
 * Displays interactive, authentic UI previews of real platform tools:
 *   1. Smart Attendance & Timetable Tracker
 *   2. CIE 50-Mark Analyzer & SEE Forecaster
 *   3. Study Materials & Solved PYQs
 *   4. Senior Interview Experiences
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Calendar, PieChart, FileText, Briefcase } from 'lucide-react';

const TABS = [
    { id: 'attendance', label: 'Smart Attendance', badge: '85% SIT Rule' },
    { id: 'cie', label: 'CIE Analyzer', badge: '50-Mark Normalization' },
    { id: 'materials', label: 'Materials & PYQs', badge: 'Verified Notes' },
    { id: 'interviews', label: 'Interview Logs', badge: 'Real Placements' }
];

const HeroPreview = () => {
    const [activeTab, setActiveTab] = useState('attendance');
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-lg lg:max-w-xl mx-auto flex flex-col gap-3">
            {/* Top Product Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#F8FAFC] dark:bg-[#15181D] border border-[#E5E7EB] dark:border-[#292E37] overflow-x-auto no-scrollbar">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            aria-label={`View ${tab.label}`}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                                isActive
                                    ? 'bg-white dark:bg-[#1B1F26] text-[#7C3AED] dark:text-[#A78BFA] border border-[#E5E7EB] dark:border-[#292E37]'
                                    : 'text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#111827] dark:hover:text-[#F3F4F6] border border-transparent'
                            }`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Product Showcase Card */}
            <div className="rounded-lg border border-[#E5E7EB] dark:border-[#292E37] bg-white dark:bg-[#15181D] shadow-none overflow-hidden flex flex-col min-h-[360px]">
                {/* Header Bar */}
                <div className="px-4 py-2.5 border-b border-[#E5E7EB] dark:border-[#292E37] flex items-center justify-between bg-[#F8FAFC] dark:bg-[#1B1F26]">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
                        <span className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#7C3AED] dark:text-[#DDD6FE] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 px-2 py-0.5 rounded-full">
                        {TABS.find(t => t.id === activeTab)?.badge}
                    </span>
                </div>

                {/* Viewport */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex-1 flex flex-col justify-between"
                        >
                            {/* 1. Smart Attendance Tracker View */}
                            {activeTab === 'attendance' && (
                                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2.5">
                                        {/* Attendance Status Widget */}
                                        <div className="p-3 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/15 border border-[#E9D5FF] dark:border-[#7C3AED]/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-semibold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider block">Overall SIT Attendance</span>
                                                <span className="text-xl font-bold text-[#111827] dark:text-[#F3F4F6] tabular-nums">89.4%</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-medium text-[#16A34A] dark:text-[#4ADE80] bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#BBF7D0] dark:border-[#166534] px-2 py-0.5 rounded-[4px] block">
                                                    Safe (Above 85%)
                                                </span>
                                                <span className="text-[11px] text-[#6B7280] dark:text-[#71717A] mt-0.5 block">Can Miss: 4 classes</span>
                                            </div>
                                        </div>

                                        {/* Subject List */}
                                        <div className="space-y-1.5">
                                            {[
                                                { code: '22CS501', name: 'Database Management Systems', pct: '92%', attended: '23/25', status: 'Safe' },
                                                { code: '22CS502', name: 'Operating Systems & Concurrency', pct: '86%', attended: '19/22', status: 'Safe' },
                                                { code: '22CS503', name: 'Computer Networks Lab (B1)', pct: '100%', attended: '8/8', status: 'Optimal' }
                                            ].map((sub, i) => (
                                                <div key={i} className="p-2 px-3 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] flex items-center justify-between">
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">{sub.name}</p>
                                                        <p className="text-[10px] text-[#6B7280] dark:text-[#71717A] font-mono">{sub.code} • {sub.attended}</p>
                                                    </div>
                                                    <span className="text-xs font-bold text-[#111827] dark:text-[#F3F4F6] tabular-nums">{sub.pct}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/home')}
                                        className="w-full h-9 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Open Attendance Workspace</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 2. CIE Analyzer View */}
                            {activeTab === 'cie' && (
                                <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2.5">
                                        <div className="p-3 rounded-[6px] bg-[#FAF5FF] dark:bg-[#581C87]/15 border border-[#E9D5FF] dark:border-[#7C3AED]/30 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-semibold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider block">Normalized CIE Score</span>
                                                <span className="text-xl font-bold text-[#111827] dark:text-[#F3F4F6] tabular-nums">44.5 / 50</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-medium text-[#7C3AED] dark:text-[#A78BFA] bg-white dark:bg-[#15181D] border border-[#E9D5FF] dark:border-[#7C3AED]/30 px-2 py-0.5 rounded-[4px] block">
                                                    Target: 'O' Grade (90%+)
                                                </span>
                                                <span className="text-[11px] text-[#6B7280] dark:text-[#71717A] mt-0.5 block">Required SEE: 46 / 50</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="p-2.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Test 1 (Normalized 20M)</span>
                                                    <span className="font-bold text-[#111827] dark:text-[#F3F4F6] tabular-nums">18.5 / 20</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Test 2 (Normalized 20M)</span>
                                                    <span className="font-bold text-[#111827] dark:text-[#F3F4F6] tabular-nums">19.0 / 20</span>
                                                </div>
                                                <div className="flex justify-between text-xs border-t border-[#E5E7EB] dark:border-[#292E37] pt-1">
                                                    <span className="font-semibold text-[#111827] dark:text-[#F3F4F6]">Quiz & Assignment (10M)</span>
                                                    <span className="font-bold text-[#16A34A] tabular-nums">7.0 / 10</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/home')}
                                        className="w-full h-9 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Calculate CIE & Target SEE Marks</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 3. Study Materials View */}
                            {activeTab === 'materials' && (
                                <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {[
                                            { title: 'DBMS Module 3 — Normalization Notes', branch: 'CSE/ISE', sem: 'Sem 5', type: 'Notes' },
                                            { title: 'Engineering Physics — 2025 Solved SEE Papers', branch: '1st Year', sem: 'Sem 1-2', type: 'PYQ' },
                                            { title: 'Operating Systems — Model Question Bank', branch: 'CSE/ISE', sem: 'Sem 4', type: 'Question Bank' }
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="p-2.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] flex items-center justify-between"
                                            >
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6] truncate">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[10px] text-[#6B7280] dark:text-[#71717A]">
                                                        {item.branch} • {item.sem}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-medium text-[#7C3AED] dark:text-[#DDD6FE] bg-[#FAF5FF] dark:bg-[#581C87]/20 border border-[#E9D5FF] dark:border-[#7C3AED]/30 px-2 py-0.5 rounded-[4px] shrink-0">
                                                    {item.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/ask-finder')}
                                        className="w-full h-9 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Browse Verified Materials & PYQs</span>
                                        <span>→</span>
                                    </button>
                                </div>
                            )}

                            {/* 4. Interview Experiences View */}
                            {activeTab === 'interviews' && (
                                <div className="space-y-3 flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {[
                                            { company: 'Cisco', role: 'Software Engineer', rounds: '3 Rounds (OA + DSA + Tech/HR)', summary: 'Focus on Computer Networks (OSI, TCP/IP) and Graph traversal questions.' },
                                            { company: 'Torry Harris', role: 'Associate Software Engineer', rounds: '2 Rounds', summary: 'Core Java fundamentals, SQL queries, and final behavioral round.' }
                                        ].map((exp, i) => (
                                            <div
                                                key={i}
                                                className="p-3 rounded-[6px] border border-[#E5E7EB] dark:border-[#292E37] bg-[#F8FAFC] dark:bg-[#1B1F26] space-y-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-[#111827] dark:text-[#F3F4F6]">
                                                        {exp.company}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-[#16A34A] dark:text-[#4ADE80] bg-[#F0FDF4] dark:bg-[#14532D]/30 border border-[#BBF7D0] dark:border-[#166534] px-1.5 py-0.5 rounded-[4px]">
                                                        Verified Senior
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-medium text-[#7C3AED] dark:text-[#A78BFA]">
                                                    {exp.role} • {exp.rounds}
                                                </p>
                                                <p className="text-[11px] text-[#4B5563] dark:text-[#A1A1AA] line-clamp-2">
                                                    {exp.summary}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/interview')}
                                        className="w-full h-9 px-4 rounded-[6px] bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Read Senior Placement Transcripts</span>
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
