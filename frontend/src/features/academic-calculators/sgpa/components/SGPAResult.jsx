/* ═══════════════════════════════════════════════════════════════════
   SGPAResult Component
   Visually strong Result Card for calculated SGPA
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Award, BookOpen, AlertTriangle, Sparkles } from 'lucide-react';

const SGPAResult = ({ result }) => {
    if (!result) return null;

    const { sgpa, totalCredits, totalGradePoints, hasFailingGrade, performance } = result;

    return (
        <div className="bg-[#161B22] border border-purple-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl shadow-purple-500/5 relative overflow-hidden animate-fadeIn">
            {/* Background Glow Overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8B949E]">
                    Calculated SGPA Result
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${performance.bg} ${performance.color}`}>
                    {performance.label}
                </span>
            </div>

            {/* SGPA Main Display */}
            <div className="flex items-baseline justify-between pt-1">
                <div>
                    <div className="text-4xl sm:text-5xl font-black text-[#E6EDF3] tracking-tight flex items-baseline gap-1">
                        <span>{sgpa.toFixed(2)}</span>
                        <span className="text-sm font-bold text-[#8B949E]">/ 10.0</span>
                    </div>
                    <p className="text-xs text-[#8B949E] mt-1">
                        Semester Grade Point Average
                    </p>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Award size={32} className="stroke-[2]" />
                </div>
            </div>

            {/* Warning if failing grade */}
            {hasFailingGrade && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Includes 1 or more subjects with 'F' grade (0 grade points).</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#21262D]">
                <div className="bg-[#0D1117] p-3 rounded-xl border border-[#21262D]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
                        Total Credits
                    </span>
                    <p className="text-lg font-black text-[#E6EDF3] mt-0.5">
                        {totalCredits}
                    </p>
                </div>

                <div className="bg-[#0D1117] p-3 rounded-xl border border-[#21262D]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E]">
                        Grade Points
                    </span>
                    <p className="text-lg font-black text-purple-400 mt-0.5">
                        {totalGradePoints}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SGPAResult;
