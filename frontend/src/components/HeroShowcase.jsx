import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Zap, Target, Briefcase, Sparkles } from 'lucide-react';

export default function HeroShowcase() {
    const [activeTab, setActiveTab] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const timerRef = useRef(null);
    const autoCycleRef = useRef(null);

    const tabs = [
        { id: 0, label: "Math III", icon: BookOpen },
        { id: 1, label: "Physics", icon: Zap },
        { id: 2, label: "Eligibility", icon: Target },
        { id: 3, label: "Placements", icon: Briefcase },
        { id: 4, label: "Ask+", icon: Sparkles }
    ];

    // Reset auto-cycling and start fresh 5-second interval
    const resetAutoCycle = () => {
        if (autoCycleRef.current) clearInterval(autoCycleRef.current);
        autoCycleRef.current = setInterval(() => {
            setActiveTab((prev) => (prev + 1) % 5);
        }, 5000);
    };

    // Auto cycle setup
    useEffect(() => {
        resetAutoCycle();
        return () => {
            if (autoCycleRef.current) clearInterval(autoCycleRef.current);
        };
    }, []);

    // Set up 50ms interval for sub-animations when activeTab changes
    useEffect(() => {
        setTimeElapsed(0);
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            setTimeElapsed((prev) => prev + 50);
        }, 50);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeTab]);

    const handleTabClick = (id) => {
        setActiveTab(id);
        resetAutoCycle();
    };

    // State 0: Mathematics III search typing
    const mathQuery = "Mathematics III";
    let mathTyped = "";
    if (timeElapsed < 1000) {
        const progress = timeElapsed / 1000;
        const count = Math.floor(progress * mathQuery.length);
        mathTyped = mathQuery.slice(0, count);
    } else {
        mathTyped = mathQuery;
    }

    // State 1: Engineering Physics search typing
    const physicsQuery = "Engineering Physics";
    let physicsTyped = "";
    if (timeElapsed < 1000) {
        const progress = timeElapsed / 1000;
        const count = Math.floor(progress * physicsQuery.length);
        physicsTyped = physicsQuery.slice(0, count);
    } else {
        physicsTyped = physicsQuery;
    }

    // State 2: CIE Score count up (0 to 44)
    const getCieVal = () => {
        if (timeElapsed < 600) return 0;
        if (timeElapsed >= 1800) return 44;
        const progress = (timeElapsed - 600) / 1200;
        return Math.round(progress * 44);
    };
    const cieVal = getCieVal();

    // State 4: Ask+ AI question and answer typing
    const askQuestion = "What happens if I become NE?";
    let askQuestionTyped = "";
    if (timeElapsed < 1200) {
        const progress = timeElapsed / 1200;
        const count = Math.floor(progress * askQuestion.length);
        askQuestionTyped = askQuestion.slice(0, count);
    } else {
        askQuestionTyped = askQuestion;
    }

    const askAnswer = "If you become NE in a subject, you must register for the subject again, attend classes, and appear for the examination in a future semester.";
    let askAnswerTyped = "";
    if (timeElapsed >= 2000 && timeElapsed < 4500) {
        const progress = (timeElapsed - 2000) / 2500;
        const count = Math.floor(progress * askAnswer.length);
        askAnswerTyped = askAnswer.slice(0, count);
    } else if (timeElapsed >= 4500) {
        askAnswerTyped = askAnswer;
    }

    return (
        <div className="relative w-full max-w-[620px] mx-auto min-h-[480px] flex items-center justify-center py-12 px-4 select-none overflow-visible">
            {/* Inline styles for circular orbit animations */}
            <style>{`
                @keyframes orbit {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes counter-orbit {
                    0% { transform: rotate(360deg); }
                    100% { transform: rotate(0deg); }
                }
                .orbit-container {
                    animation: orbit 28s linear infinite;
                }
                .orbit-icon {
                    animation: counter-orbit 28s linear infinite;
                }
            `}</style>

            {/* Orbiting Path Ring */}
            <div className="absolute w-[500px] h-[500px] rounded-full border border-purple-500/5 pointer-events-none hidden md:block z-0">
                <div className="absolute inset-0 orbit-container">
                    {[
                        { label: "Maths", emoji: "📘", angle: 0 },
                        { label: "Physics", emoji: "⚛️", angle: 60 },
                        { label: "Chemistry", emoji: "🧪", angle: 120 },
                        { label: "Internals", emoji: "🎯", angle: 180 },
                        { label: "Placements", emoji: "💼", angle: 240 },
                        { label: "Ask+", emoji: "🤖", angle: 300 }
                    ].map((chip, idx) => (
                        <div 
                            key={idx}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            style={{
                                transform: `rotate(${chip.angle}deg) translateY(-250px)`
                            }}
                        >
                            <div 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    transform: `rotate(-${chip.angle}deg)`
                                }}
                            >
                                <div className="orbit-icon flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0c1228]/95 border border-purple-500/20 backdrop-blur-md text-xs text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)] whitespace-nowrap">
                                    <span>{chip.emoji}</span>
                                    <span>{chip.label}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Glow backing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full bg-gradient-to-br from-purple-600/10 to-indigo-600/10 blur-[70px] -z-10 pointer-events-none" />

            <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-full max-w-[460px] min-h-[385px] bg-[#0f172a]/50 border border-white/8 rounded-3xl backdrop-blur-[20px] shadow-[0_0_50px_rgba(139,92,246,0.12)] flex flex-col justify-between overflow-hidden relative z-10"
            >
                {/* Simulated Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        <span className="text-[10px] text-slate-500 font-mono ml-2 font-semibold">askursenior.org/showcase</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-400">
                        <Sparkles size={11} className="animate-pulse" />
                        <span className="text-[9px] font-bold tracking-wider uppercase">Live Preview</span>
                    </div>
                </div>

                {/* Main Dynamic Viewport */}
                <div className="flex-1 p-5 flex flex-col justify-start">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -12, scale: 0.98 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* State 0: Mathematics III */}
                            {activeTab === 0 && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                                            <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none text-left font-medium">
                                                {mathTyped}
                                                {timeElapsed < 1000 && (
                                                    <span className="animate-ping border-l-2 border-purple-500 ml-0.5 h-3.5" />
                                                )}
                                            </div>
                                        </div>
                                        <button className="px-4 py-1.5 bg-purple-600 rounded-xl text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5 transition-all hover:bg-purple-500">
                                            {timeElapsed >= 1000 && timeElapsed < 1400 ? (
                                                <>
                                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Searching</span>
                                                </>
                                            ) : (
                                                <span>Search</span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Search Results list */}
                                    <div className="space-y-2">
                                        {[
                                            { label: "Notes", type: "notes", info: "Unit 1-5 Comprehensive Notes" },
                                            { label: "PYQs", type: "pyq", info: "2021 - 2025 Solved Papers" },
                                            { label: "Important Questions", type: "questions", info: "CIE & SEE Blueprint Prep" },
                                            { label: "Previous Year Papers", type: "papers", info: "Official Schemes Question Banks" }
                                        ].map((res, i) => {
                                            const isVisible = timeElapsed >= (1400 + i * 250);
                                            return (
                                                <div key={i} className="h-11 relative">
                                                    <AnimatePresence>
                                                        {isVisible && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                className="absolute inset-0 flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/20 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="text-emerald-400 font-black text-xs">✓</span>
                                                                    <div className="text-left">
                                                                        <p className="text-[11px] font-bold text-slate-200">{res.label}</p>
                                                                        <p className="text-[9px] text-slate-400">{res.info}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md uppercase">
                                                                    {res.type}
                                                                </span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Resources Found Badge */}
                                    <div className="h-6 flex justify-start items-center">
                                        {timeElapsed >= 2500 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold"
                                            >
                                                ✨ 42 Resources Found
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* State 1: Engineering Physics */}
                            {activeTab === 1 && (
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
                                            <div className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 outline-none text-left font-medium">
                                                {physicsTyped}
                                                {timeElapsed < 1000 && (
                                                    <span className="animate-ping border-l-2 border-purple-500 ml-0.5 h-3.5" />
                                                )}
                                            </div>
                                        </div>
                                        <button className="px-4 py-1.5 bg-indigo-600 rounded-xl text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5 transition-all hover:bg-indigo-500">
                                            {timeElapsed >= 1000 && timeElapsed < 1400 ? (
                                                <>
                                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Searching</span>
                                                </>
                                            ) : (
                                                <span>Search</span>
                                            )}
                                        </button>
                                    </div>

                                    {/* Search Results list */}
                                    <div className="space-y-2">
                                        {[
                                            { label: "Unit-wise Notes", type: "notes", info: "Complete syllabus notes with diagrams" },
                                            { label: "PYQs", type: "pyq", info: "SIT Physics exam papers solved" },
                                            { label: "Lab Manual", type: "lab", info: "Viva questions & step-by-step manual" },
                                            { label: "Important Questions", type: "questions", info: "Formula reference & key derivations" }
                                        ].map((res, i) => {
                                            const isVisible = timeElapsed >= (1400 + i * 250);
                                            return (
                                                <div key={i} className="h-11 relative">
                                                    <AnimatePresence>
                                                        {isVisible && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                className="absolute inset-0 flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="text-emerald-400 font-black text-xs">✓</span>
                                                                    <div className="text-left">
                                                                        <p className="text-[11px] font-bold text-slate-200">{res.label}</p>
                                                                        <p className="text-[9px] text-slate-400">{res.info}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md uppercase">
                                                                    {res.type}
                                                                </span>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Resources Found Badge */}
                                    <div className="h-6 flex justify-start items-center">
                                        {timeElapsed >= 2500 && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.85 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold"
                                            >
                                                ✨ 28 Resources Found
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* State 2: Eligibility Checker */}
                            {activeTab === 2 && (
                                <div className="space-y-3.5 text-left">
                                    <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                                        <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                            <span>🎯</span> Eligibility Checker & CIE Estimate
                                        </h3>
                                        <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">Attendance: 95%</span>
                                    </div>

                                    {/* Marks Cards Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "IA1", val: "18" },
                                            { label: "IA2", val: "16" },
                                            { label: "Quiz 1", val: "16/20" },
                                            { label: "Quiz 2", val: "18/20" },
                                            { label: "Assignment", val: "10/10" },
                                            { label: "CIE Target", val: "40+" }
                                        ].map((item, i) => {
                                            const isVisible = timeElapsed >= (i * 100);
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`p-2.5 rounded-xl border transition-all duration-300 ${
                                                        isVisible 
                                                        ? 'bg-white/[0.02] border-white/10 opacity-100 translate-y-0' 
                                                        : 'bg-transparent border-transparent opacity-0 translate-y-2'
                                                    }`}
                                                >
                                                    <p className="text-[9px] text-slate-400 font-semibold uppercase">{item.label}</p>
                                                    <p className="text-[11px] font-black text-slate-100 mt-0.5">{item.val}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* CIE Calculation Section */}
                                    <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-between mt-1">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Estimated CIE Score</p>
                                            <p className="text-[9px] text-slate-500 font-mono">IA Avg (17) + Quiz Avg (17) + Asg (10)</p>
                                            <div className="h-5 flex items-center">
                                                {timeElapsed >= 1800 && (
                                                    <motion.p 
                                                        initial={{ opacity: 0, y: 4 }} 
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"
                                                    >
                                                        Eligible ✅ <span className="text-slate-500 font-medium">| Need 21/50 in SEE</span>
                                                    </motion.p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Big Score counter */}
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                                                {cieVal} <span className="text-xs text-slate-500 font-normal">/50</span>
                                            </p>
                                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                                {timeElapsed < 1800 ? "Calculating..." : "Success"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* State 3: Placement Prep */}
                            {activeTab === 3 && (
                                <div className="space-y-3.5 text-left h-full">
                                    {timeElapsed < 1800 ? (
                                        <motion.div 
                                            key="companies-list"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                                                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                                    <span>💼</span> Placement Preparation
                                                </h3>
                                                <span className="text-[9px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">Top Recruiters</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5">
                                                {[
                                                    { name: "Amazon", role: "SDE Role" },
                                                    { name: "Deloitte", role: "Consulting Analyst" },
                                                    { name: "Infosys", role: "Systems Engineer" },
                                                    { name: "Accenture", role: "Associate Developer" }
                                                ].map((company, i) => {
                                                    const isAmazon = company.name === "Amazon";
                                                    const isSelected = isAmazon && timeElapsed >= 1000;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`p-3 rounded-xl border text-left transition-all duration-300 ${
                                                                isSelected 
                                                                ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(168,85,247,0.2)] scale-[1.02]' 
                                                                : 'border-white/5 bg-white/[0.01]'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-slate-100">{company.name}</span>
                                                                {isAmazon && isSelected && (
                                                                    <motion.span 
                                                                        animate={{ scale: [1, 1.2, 1] }} 
                                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                                        className="w-1.5 h-1.5 rounded-full bg-purple-500" 
                                                                    />
                                                                )}
                                                            </div>
                                                            <p className="text-[9px] text-slate-400 mt-1">{company.role}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="amazon-experience"
                                            initial={{ opacity: 0, x: 15 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-3"
                                        >
                                            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-lg bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-400">a</span>
                                                    <h3 className="text-xs font-bold text-white">Amazon Interview Experience</h3>
                                                </div>
                                                <span className="text-[8px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">SDE-1</span>
                                            </div>

                                            {/* Rounds */}
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Recruitment Rounds</p>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { round: "Round 1", name: "Aptitude", delay: 2000 },
                                                        { round: "Round 2", name: "Coding", delay: 2300 },
                                                        { round: "Round 3", name: "Technical", delay: 2600 }
                                                    ].map((r, i) => {
                                                        const isVisible = timeElapsed >= r.delay;
                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className={`p-2 rounded-xl border border-white/5 transition-all duration-300 ${
                                                                    isVisible ? 'bg-white/[0.02] opacity-100 translate-y-0' : 'bg-transparent opacity-0 translate-y-2'
                                                                }`}
                                                            >
                                                                <p className="text-[8px] text-purple-400 font-bold">{r.round}</p>
                                                                <p className="text-[9px] font-medium text-slate-200">{r.name}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Frequently Asked */}
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Frequently Asked Topics</p>
                                                <div className="space-y-1">
                                                    {[
                                                        { topic: "Two Sum", type: "Leetcode Easy", delay: 2900 },
                                                        { topic: "OOP Concepts", type: "Core CS", delay: 3200 },
                                                        { topic: "DBMS Queries", type: "SQL", delay: 3500 }
                                                    ].map((topic, i) => {
                                                        const isVisible = timeElapsed >= topic.delay;
                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className={`flex justify-between items-center px-2.5 py-1 rounded-lg bg-slate-950/20 border border-white/5 transition-all duration-300 ${
                                                                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                                                                }`}
                                                            >
                                                                <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                                    {topic.topic}
                                                                </span>
                                                                <span className="text-[8px] text-slate-500 font-mono font-medium">{topic.type}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* State 4: Ask+ AI Bot */}
                            {activeTab === 4 && (
                                <div className="space-y-3.5 text-left flex flex-col justify-between h-full min-h-[220px]">
                                    {/* Chat Header */}
                                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                                                A+
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-white leading-none">Ask+ Bot</h3>
                                                <p className="text-[8px] text-emerald-400 mt-0.5">● Online & Ready</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase">AI Companion</span>
                                    </div>

                                    {/* Messages Viewport */}
                                    <div className="flex-1 flex flex-col justify-end space-y-3 py-1">
                                        {/* User Bubble */}
                                        <div className="self-end bg-purple-600 text-white text-[11px] px-3.5 py-2 rounded-2xl rounded-tr-none max-w-[85%] shadow-md font-medium">
                                            {askQuestionTyped}
                                            {timeElapsed < 1200 && (
                                                <span className="inline-block w-1 h-3 bg-white/70 animate-pulse ml-0.5 align-middle" />
                                            )}
                                        </div>

                                        {/* AI Bubble */}
                                        {timeElapsed >= 1200 && (
                                            <div className="self-start bg-slate-950/40 border border-white/5 text-slate-300 text-[11px] px-3 py-2 rounded-2xl rounded-tl-none max-w-[90%] shadow-lg flex items-start gap-2">
                                                <span className="text-purple-400 text-xs shrink-0 mt-0.5">🤖</span>
                                                <div className="text-left leading-relaxed">
                                                    {timeElapsed >= 1200 && timeElapsed < 2000 ? (
                                                        <div className="flex gap-1 py-1 items-center h-4">
                                                            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0s' }} />
                                                            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                                                        </div>
                                                    ) : (
                                                        <p className="font-medium">
                                                            {askAnswerTyped}
                                                            {timeElapsed >= 2000 && timeElapsed < 4500 && (
                                                                <span className="inline-block w-1 h-3.5 bg-purple-400 animate-pulse ml-0.5 align-middle" />
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mock Input Form */}
                                    <div className="border-t border-white/5 pt-2 flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            placeholder="Ask anything about grades, internal rules, manuals..." 
                                            className="flex-1 bg-slate-950/40 border border-white/5 rounded-xl py-1.5 px-3 text-[9px] text-slate-500 outline-none font-medium"
                                        />
                                        <button className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/10">
                                            🚀
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Nav Bar */}
                <div className="px-3 py-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-around gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all relative ${
                                    isActive 
                                    ? 'text-white' 
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 bg-white/[0.04] border border-white/10 rounded-xl -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <Icon size={12} className={isActive ? 'text-purple-400' : 'text-slate-500'} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Floating Activity Cards */}
            
            {/* Card 1: Notes Downloaded (Top Left) */}
            <motion.div
                animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[5px] left-[-90px] w-52 bg-[#0c1228]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center gap-3 pointer-events-none z-20 hidden lg:flex"
            >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-sm shrink-0">
                    📄
                </div>
                <div className="text-left min-w-0">
                    <p className="text-[10px] text-slate-300 font-bold truncate">Srinivas downloaded DBMS Notes</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] text-slate-500 font-semibold">2 mins ago</span>
                        <span className="w-1 h-1 rounded-full bg-purple-500/40" />
                        <span className="text-[8px] text-purple-400 font-bold uppercase">Notes</span>
                    </div>
                </div>
            </motion.div>

            {/* Card 2: PYQ Opened (Bottom Left) */}
            <motion.div
                animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[20px] left-[-80px] w-52 bg-[#0c1228]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center gap-3 pointer-events-none z-20 hidden lg:flex"
            >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                    📚
                </div>
                <div className="text-left min-w-0">
                    <p className="text-[10px] text-slate-300 font-bold truncate">Rahul opened Maths III PYQs</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] text-slate-500 font-semibold">Just now</span>
                        <span className="w-1 h-1 rounded-full bg-indigo-500/40" />
                        <span className="text-[8px] text-indigo-400 font-bold uppercase">PYQs</span>
                    </div>
                </div>
            </motion.div>

            {/* Card 3: Placement Experience (Top Right) */}
            <motion.div
                animate={{ y: [0, -6, 0], x: [0, -6, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[15px] right-[-90px] w-52 bg-[#0c1228]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center gap-3 pointer-events-none z-20 hidden lg:flex"
            >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                    💼
                </div>
                <div className="text-left min-w-0">
                    <p className="text-[10px] text-slate-300 font-bold truncate">Priya viewed Amazon experience</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] text-slate-500 font-semibold">5 mins ago</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-500/40" />
                        <span className="text-[8px] text-emerald-400 font-bold uppercase">Interviews</span>
                    </div>
                </div>
            </motion.div>

            {/* Card 4: Eligibility Checker (Bottom Right) */}
            <motion.div
                animate={{ y: [0, 9, 0], x: [0, 5, 0] }}
                transition={{ duration: 5.1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[10px] right-[-80px] w-52 bg-[#0c1228]/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-xl flex items-center gap-3 pointer-events-none z-20 hidden lg:flex"
            >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    🎯
                </div>
                <div className="text-left min-w-0">
                    <p className="text-[10px] text-slate-300 font-bold truncate">Aditya checked CIE eligibility</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[8px] text-slate-500 font-semibold">1 min ago</span>
                        <span className="w-1 h-1 rounded-full bg-amber-500/40" />
                        <span className="text-[8px] text-amber-400 font-bold uppercase">Eligibility</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
