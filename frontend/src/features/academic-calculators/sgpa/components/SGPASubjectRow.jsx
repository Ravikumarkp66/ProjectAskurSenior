/* ═══════════════════════════════════════════════════════════════════
   SGPASubjectRow Component
   Responsive Desktop Row / Mobile Compact Card for Subject Input
   ═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { GRADE_SCALE } from '../utils/calculateSGPA';

const SGPASubjectRow = ({ subject, index, onUpdate, onRemove, canRemove }) => {
    return (
        <div className="bg-[#161B22] border border-[#21262D] hover:border-[#30363D] rounded-xl p-3 transition-colors">
            {/* Desktop View (>= sm) */}
            <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs font-bold text-[#8B949E] w-6 text-center shrink-0">
                    {index + 1}.
                </span>

                {/* Subject Name Input */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Subject Name (e.g. Mathematics)"
                        value={subject.name}
                        onChange={(e) => onUpdate(subject.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* Subject Code (Optional) */}
                <div className="w-24 shrink-0">
                    <input
                        type="text"
                        placeholder="Code"
                        value={subject.code || ''}
                        onChange={(e) => onUpdate(subject.id, 'code', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs text-[#E6EDF3] uppercase placeholder-[#8B949E]/40 outline-none focus:border-purple-500/50 transition-colors"
                    />
                </div>

                {/* Credits Input */}
                <div className="w-20 shrink-0">
                    <select
                        value={subject.credits}
                        onChange={(e) => onUpdate(subject.id, 'credits', parseFloat(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs font-semibold text-[#E6EDF3] outline-none focus:border-purple-500/50 cursor-pointer transition-colors"
                    >
                        {[1, 2, 3, 4, 5, 6].map(cr => (
                            <option key={cr} value={cr} className="bg-[#161B22]">
                                {cr} {cr === 1 ? 'Credit' : 'Credits'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Grade Selector */}
                <div className="w-28 shrink-0">
                    <select
                        value={subject.grade}
                        onChange={(e) => onUpdate(subject.id, 'grade', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-xs font-bold text-purple-300 outline-none focus:border-purple-500/50 cursor-pointer transition-colors"
                    >
                        {GRADE_SCALE.map(g => (
                            <option key={g.value} value={g.value} className="bg-[#161B22]">
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Remove Button */}
                <button
                    type="button"
                    onClick={() => onRemove(subject.id)}
                    disabled={!canRemove}
                    className={`p-2 rounded-xl transition-colors shrink-0 ${
                        canRemove
                            ? 'text-[#8B949E] hover:text-red-400 hover:bg-red-500/10'
                            : 'text-[#8B949E]/30 cursor-not-allowed'
                    }`}
                    title="Remove Subject"
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
                            placeholder="Subject Name"
                            value={subject.name}
                            onChange={(e) => onUpdate(subject.id, 'name', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#E6EDF3] placeholder-[#8B949E]/50 outline-none focus:border-purple-500/50"
                        />
                    </div>
                    {canRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(subject.id)}
                            className="p-1 text-[#8B949E] hover:text-red-400"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Credits
                        </label>
                        <select
                            value={subject.credits}
                            onChange={(e) => onUpdate(subject.id, 'credits', parseFloat(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs text-[#E6EDF3] outline-none"
                        >
                            {[1, 2, 3, 4, 5, 6].map(cr => (
                                <option key={cr} value={cr} className="bg-[#161B22]">
                                    {cr} {cr === 1 ? 'Credit' : 'Credits'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B949E] mb-1">
                            Grade
                        </label>
                        <select
                            value={subject.grade}
                            onChange={(e) => onUpdate(subject.id, 'grade', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0D1117] border border-[#21262D] text-xs font-bold text-purple-300 outline-none"
                        >
                            {GRADE_SCALE.map(g => (
                                <option key={g.value} value={g.value} className="bg-[#161B22]">
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SGPASubjectRow;
