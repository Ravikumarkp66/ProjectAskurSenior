/* ═══════════════════════════════════════════════════════════════════
   SGPAForm Component
   Form container for branch selection, subject inputs, and triggers
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus, RotateCcw, AlertCircle, BookOpen, Layers } from 'lucide-react';
import SGPASubjectRow from './SGPASubjectRow';

const BRANCH_OPTIONS = [
    { value: '', label: 'Custom / General' },
    { value: 'CSE', label: 'Computer Science & Engg (CSE)' },
    { value: 'ISE', label: 'Information Science & Engg (ISE)' },
];

const SEMESTER_OPTIONS = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' },
];

const SGPAForm = ({
    branch,
    semester,
    subjects,
    validationError,
    showResetConfirm,
    onPrefillCurriculum,
    onAddSubject,
    onRemoveSubject,
    onUpdateSubject,
    onCalculate,
    onRequestReset,
    onConfirmReset,
    onCancelReset
}) => {
    return (
        <div className="space-y-5">
            {/* Top Toolbar: Branch & Semester Prefill Selectors */}
            <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                        Semester Curriculum Prefill
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Branch
                        </label>
                        <select
                            value={branch}
                            onChange={(e) => onPrefillCurriculum(e.target.value, semester)}
                            className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs font-medium text-[#E6EDF3] outline-none focus:border-purple-500/50 cursor-pointer"
                        >
                            {BRANCH_OPTIONS.map(b => (
                                <option key={b.value} value={b.value} className="bg-[#161B22]">
                                    {b.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Semester
                        </label>
                        <select
                            value={semester}
                            onChange={(e) => onPrefillCurriculum(branch, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs font-medium text-[#E6EDF3] outline-none focus:border-purple-500/50 cursor-pointer"
                        >
                            {SEMESTER_OPTIONS.map(s => (
                                <option key={s.value} value={s.value} className="bg-[#161B22]">
                                    {s.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Validation Error Alert */}
            {validationError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{validationError}</span>
                </div>
            )}

            {/* Subjects Header */}
            <div className="flex items-center justify-between pt-1">
                <h3 className="text-sm font-extrabold text-[#E6EDF3] flex items-center gap-2">
                    <BookOpen size={16} className="text-purple-400" />
                    <span>Subjects ({subjects.length})</span>
                </h3>

                <button
                    type="button"
                    onClick={onAddSubject}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all active:scale-95"
                >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Add Subject</span>
                </button>
            </div>

            {/* Subject Rows List */}
            <div className="space-y-2.5">
                {subjects.map((sub, idx) => (
                    <SGPASubjectRow
                        key={sub.id}
                        subject={sub}
                        index={idx}
                        onUpdate={onUpdateSubject}
                        onRemove={onRemoveSubject}
                        canRemove={subjects.length > 1}
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
                    <span>Calculate SGPA</span>
                </button>
            </div>

            {/* Reset Confirmation Dialog */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
                        <h4 className="text-sm font-bold text-[#E6EDF3]">Reset Calculator?</h4>
                        <p className="text-xs text-[#8B949E]">
                            This will restore the initial default subjects and clear your current inputs.
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

export default SGPAForm;
