/* ═══════════════════════════════════════════════════════════════════
   SGPAInfoModal Component
   Guidelines and VTU / University Grading Rules Modal
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { X, Info, HelpCircle } from 'lucide-react';
import { GRADE_SCALE } from '../utils/calculateSGPA';

const SGPAInfoModal = ({ isOpen, onClose }) => {
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
                        <h3 className="text-base font-extrabold text-[#E6EDF3]">SGPA Calculation Rules</h3>
                    </div>
                    <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#E6EDF3] p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Formula Explanation */}
                <div className="bg-[#0D1117] p-3.5 rounded-xl border border-[#21262D] space-y-1.5 text-xs text-[#8B949E]">
                    <p className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">Formula</p>
                    <p className="font-mono text-[#E6EDF3]">SGPA = Σ (Subject Credits × Grade Points) / Total Credits</p>
                    <p className="pt-1 leading-relaxed">
                        Each subject's grade is converted to grade points (O=10, A+=9, A=8, etc.), multiplied by its credit value, summed together, and divided by total semester credits.
                    </p>
                </div>

                {/* Grade Scale Table */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-2">
                        Grade Point Scale
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {GRADE_SCALE.map(g => (
                            <div key={g.value} className="flex items-center justify-between p-2 rounded-lg bg-[#0D1117] border border-[#21262D]">
                                <span className="font-bold text-[#E6EDF3]">{g.value}</span>
                                <span className="text-[#8B949E]">{g.points} Grade Points</span>
                            </div>
                        ))}
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

export default SGPAInfoModal;
