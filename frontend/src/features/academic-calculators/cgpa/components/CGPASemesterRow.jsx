/* ═══════════════════════════════════════════════════════════════════
   CGPASemesterRow Component
   Responsive Desktop Row / Mobile Compact Card for Semester SGPA & Credits Input
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { X, Calendar } from 'lucide-react';

const CGPASemesterRow = ({ semester, index, onUpdate, onRemove, canRemove }) => {
    return (
        <div className="bg-[#161B22] border border-[#21262D] hover:border-[#30363D] rounded-xl p-3 transition-colors shrink-0 min-w-[250px] max-w-[280px] sm:min-w-0 sm:max-w-none sm:w-full snap-center">
            {/* Desktop View (>= sm) */}
            <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs font-bold text-[#8B949E] w-6 text-center shrink-0">
                    {index + 1}.
                </span>

                {/* Semester Label */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Semester Label (e.g. Semester 1)"
                        value={semester.name}
                        onChange={(e) => onUpdate(semester.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* SGPA Input */}
                <div className="w-32 shrink-0">
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="SGPA (0-10)"
                            value={semester.sgpa}
                            onChange={(e) => onUpdate(semester.id, 'sgpa', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm font-extrabold text-purple-300 placeholder-[#8B949E]/40 outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Credits Input */}
                <div className="w-28 shrink-0">
                    <input
                        type="number"
                        min="1"
                        max="40"
                        placeholder="Credits"
                        value={semester.credits}
                        onChange={(e) => onUpdate(semester.id, 'credits', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm font-semibold text-[#E6EDF3] placeholder-[#8B949E]/40 outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* Remove Button */}
                <button
                    type="button"
                    onClick={() => onRemove(semester.id)}
                    disabled={!canRemove}
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                        canRemove
                            ? 'text-[#8B949E] hover:text-red-400 hover:bg-red-500/10'
                            : 'text-[#8B949E]/30 cursor-not-allowed'
                    }`}
                    title="Remove Semester"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Mobile View (< sm) */}
            <div className="sm:hidden space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {index + 1}
                        </span>
                        <input
                            type="text"
                            placeholder="Semester Label"
                            value={semester.name}
                            onChange={(e) => onUpdate(semester.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none focus:border-purple-500/50"
                        />
                    </div>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(semester.id)}
                            className="p-1 text-[#8B949E] hover:text-red-400"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            SGPA (0-10)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            placeholder="e.g. 8.5"
                            value={semester.sgpa}
                            onChange={(e) => onUpdate(semester.id, 'sgpa', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs font-bold text-purple-300 placeholder-[#8B949E]/40 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Credits
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="40"
                            placeholder="e.g. 24"
                            value={semester.credits}
                            onChange={(e) => onUpdate(semester.id, 'credits', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#E6EDF3] placeholder-[#8B949E]/40 outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CGPASemesterRow;
