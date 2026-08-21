/* ═══════════════════════════════════════════════════════════════════
   CGPAForm Component
   Form container for semester SGPA inputs, calculate action, & reset
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus, RotateCcw, AlertCircle, Calendar } from 'lucide-react';
import CGPASemesterRow from './CGPASemesterRow';

const CGPAForm = ({
    semesters,
    validationError,
    showResetConfirm,
    onAddSemester,
    onRemoveSemester,
    onUpdateSemester,
    onCalculate,
    onRequestReset,
    onConfirmReset,
    onCancelReset
}) => {
    return (
        <div className="space-y-5">
            {/* Validation Error Alert */}
            {validationError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{validationError}</span>
                </div>
            )}

            {/* Semesters Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#E6EDF3] flex items-center gap-2">
                    <Calendar size={16} className="text-purple-400" />
                    <span>Semester Performance ({semesters.length})</span>
                </h3>

                <button
                    type="button"
                    onClick={onAddSemester}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all active:scale-95"
                >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Add Semester</span>
                </button>
            </div>

            {/* Semester Rows List - Horizontal scroll row on mobile, stacked list on desktop */}
            <div className="flex sm:block flex-row overflow-x-auto flex-nowrap gap-3 pb-3 sm:pb-0 sm:space-y-2.5 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-500/20">
                {semesters.map((sem, idx) => (
                    <CGPASemesterRow
                        key={sem.id}
                        semester={sem}
                        index={idx}
                        onUpdate={onUpdateSemester}
                        onRemove={onRemoveSemester}
                        canRemove={semesters.length > 1}
                    />
                ))}
            </div>

            {/* Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#21262D]">
                <button
                    type="button"
                    onClick={onRequestReset}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] bg-[#161B22] hover:bg-[#21262D] border border-[#21262D] transition-colors"
                >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                </button>

                <button
                    type="button"
                    onClick={onCalculate}
                    className="flex-1 max-w-xs py-2.5 px-5 rounded-xl text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)'
                    }}
                >
                    <span>Calculate CGPA</span>
                </button>
            </div>

            {/* Reset Confirmation Dialog */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
                        <h4 className="text-sm font-bold text-[#E6EDF3]">Reset Calculator?</h4>
                        <p className="text-xs text-[#8B949E]">
                            This will clear your entered semester data and restore the initial state.
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onCancelReset}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#8B949E] hover:bg-[#21262D]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirmReset}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500"
                            >
                                Reset Form
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CGPAForm;
