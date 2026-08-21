/* ═══════════════════════════════════════════════════════════════════
   CGPAInfoModal Component
   Guidelines & Formula explanation for CGPA Calculator
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { X, Info, Award } from 'lucide-react';

const CGPAInfoModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#161B22] border-t sm:border border-[#21262D] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 my-0 sm:my-auto p-4 sm:p-6 text-[#E6EDF3] space-y-4">
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-[#30363D] rounded-full mx-auto sm:hidden shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#21262D]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                            <Info size={18} />
                        </div>
                        <h3 className="text-base font-extrabold text-[#E6EDF3]">CGPA Calculation Guidelines</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#E6EDF3] p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Formula Explanation */}
                <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D] space-y-1.5 text-xs text-[#8B949E]">
                    <p className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">Credit-Weighted Formula</p>
                    <p className="font-mono text-[#E6EDF3]">CGPA = Σ (Semester SGPA × Semester Credits) / Total Credits</p>
                    <p className="pt-1 leading-relaxed">
                        Overall CGPA accounts for the total credits of each semester. Semesters with higher credit counts have a proportionately higher impact on your cumulative CGPA.
                    </p>
                </div>

                {/* Example Breakdown */}
                <div className="space-y-2 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-[#8B949E]">Calculation Example</h4>
                    <div className="p-3 rounded-xl bg-[#0D1117] border border-[#21262D] space-y-1 text-[#8B949E]">
                        <div className="flex justify-between text-[#E6EDF3]">
                            <span>Sem 1 (24 Credits, 8.20 SGPA)</span>
                            <span className="font-mono">196.8 Points</span>
                        </div>
                        <div className="flex justify-between text-[#E6EDF3]">
                            <span>Sem 2 (22 Credits, 8.60 SGPA)</span>
                            <span className="font-mono">189.2 Points</span>
                        </div>
                        <div className="pt-1.5 border-t border-[#21262D] flex justify-between font-bold text-purple-300">
                            <span>CGPA (386.0 / 46 Credits)</span>
                            <span>8.39 CGPA</span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-[#21262D] flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CGPAInfoModal;
