import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Sparkles, 
    Building2, 
    Layers, 
    GraduationCap, 
    PlusCircle, 
    AlertTriangle, 
    ChevronDown 
} from 'lucide-react';

const InterviewHero = ({ totalCompanies = 0, totalStories = 0, batches = [] }) => {
    const [disclaimerOpen, setDisclaimerOpen] = useState(false);

    return (
        <div className="w-full pt-8 pb-6 relative">
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] bg-purple-600/10 blur-[100px] pointer-events-none rounded-full" aria-hidden="true" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
                {/* Title & Brand Intro */}
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
                        <Sparkles size={13} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-300">
                            Placement Intelligence
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-2">
                        ASK+ <span className="text-purple-400 font-extrabold">EXPERIENCES</span>
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-xl">
                        Verified interview rounds, actual coding questions, and recruitment insights directly from senior peers.
                    </p>

                    {/* Live Stats Pills */}
                    <div className="flex flex-wrap items-center gap-2.5 mt-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] font-semibold">
                            <Building2 size={13} className="text-purple-400" />
                            <span><strong className="text-white font-bold">{totalCompanies}</strong> Companies</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] font-semibold">
                            <Layers size={13} className="text-emerald-400" />
                            <span><strong className="text-white font-bold">{totalStories}</strong> Senior Stories</span>
                        </div>
                        {batches.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 text-[11px] font-semibold">
                                <GraduationCap size={13} className="text-indigo-400" />
                                <span>Batches <strong className="text-white font-bold">{batches.join(', ')}</strong></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Share Experience Action & Secondary Disclaimer Button */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                        onClick={() => setDisclaimerOpen(prev => !prev)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/10 transition-colors"
                        title="Placement disclaimer & senior guidelines"
                    >
                        <AlertTriangle size={14} className="text-amber-400" />
                        <span>Recruitment Notes</span>
                        <ChevronDown 
                            size={14} 
                            className={`transition-transform duration-200 ${disclaimerOpen ? 'rotate-180' : ''}`} 
                        />
                    </button>

                    <Link
                        to="/home/interview/share"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all active:scale-[0.98]"
                    >
                        <PlusCircle size={15} />
                        <span>Share Experience</span>
                    </Link>
                </div>
            </div>

            {/* Collapsible Recruitment Disclaimer Accordion */}
            <AnimatePresence>
                {disclaimerOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] backdrop-blur-sm text-xs text-slate-400 leading-relaxed">
                            <p className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertTriangle size={13} />
                                Senior Peer Submission Guidelines:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <span className="font-bold text-slate-200 block mb-1">Authentic Experiences</span>
                                    Experiences are submitted directly by seniors and vetted for clarity. Interview questions and rounds may vary across hiring seasons.
                                </div>
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <span className="font-bold text-slate-200 block mb-1">CTC Disclosures</span>
                                    Package figures typically represent full-time conversion CTC. Internship stipends may differ.
                                </div>
                                <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
                                    <span className="font-bold text-slate-200 block mb-1">Eligibility Criteria</span>
                                    Cutoffs represent minimum CGPA thresholds specified by companies during campus recruitment drives.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InterviewHero;
