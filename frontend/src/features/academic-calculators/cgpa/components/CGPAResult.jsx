/* ═══════════════════════════════════════════════════════════════════
   CGPAResult Component
   Visually strong Result Card for calculated Overall CGPA
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Award, Layers, Sparkles } from 'lucide-react';

const CGPAResult = ({ result }) => {
    if (!result) return null;

    const { cgpa, totalCredits, totalSemesters, totalWeightedPoints } = result;

    const progressPercentage = Math.min(Math.max((cgpa / 10) * 100, 0), 100);

    return (
        <div className="bg-[#161B22] border border-purple-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl shadow-purple-500/5 relative overflow-hidden animate-fadeIn">
            {/* Background Glow Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8B949E]">
                    Calculated Overall CGPA
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    Based on {totalSemesters} {totalSemesters === 1 ? 'Semester' : 'Semesters'}
                </span>
            </div>

            {/* CGPA Main Display */}
            <div className="flex items-baseline justify-between pt-1">
                <div>
                    <div className="text-4xl sm:text-5xl font-black text-[#E6EDF3] tracking-tight flex items-baseline gap-1">
                        <span>{cgpa.toFixed(2)}</span>
                        <span className="text-sm font-bold text-[#8B949E]">/ 10.0</span>
                    </div>
                    <p className="text-xs text-[#8B949E] mt-1">
                        Cumulative Grade Point Average
                    </p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Award size={32} className="stroke-[2]" />
                </div>
            </div>

            {/* Progress Bar Indicator */}
            <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-[#8B949E]">
                    <span>CGPA Scale</span>
                    <span className="text-purple-300">{progressPercentage.toFixed(0)}% Score</span>
                </div>
                <div className="w-full h-2.5 bg-[#0D1117] rounded-full overflow-hidden border border-[#21262D] p-0.5">
                    <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                            width: `${progressPercentage}%`,
                            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
                            boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)'
                        }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#21262D]">
                <div className="bg-[#0D1117] p-3 rounded-xl border border-[#21262D]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
                        Total Semesters
                    </span>
                    <p className="text-lg font-black text-[#E6EDF3] mt-0.5">
                        {totalSemesters}
                    </p>
                </div>

                <div className="bg-[#0D1117] p-3 rounded-xl border border-[#21262D]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
                        Completed Credits
                    </span>
                    <p className="text-lg font-black text-purple-400 mt-0.5">
                        {totalCredits}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CGPAResult;
