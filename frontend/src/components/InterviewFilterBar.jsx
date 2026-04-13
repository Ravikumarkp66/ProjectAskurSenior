import React from 'react';
import { Filter, ChevronDown, Award, Bookmark, Plus, X } from 'lucide-react';

const InterviewFilterBar = ({ 
    onAddClick, 
    onFilterToggle, 
    onSortChange, 
    sortBy,
    filters,
    setFilters,
    isLightMode 
}) => {
    return (
        <div className={`mb-10 p-5 rounded-3xl border transition-all ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141416]/60 border-white/5 backdrop-blur-sm'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Side: Main Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={onFilterToggle}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'}`}
                    >
                        <Filter size={14} />
                        Detailed Filters
                    </button>

                    <div className="h-4 w-[1px] bg-white/5 hidden lg:block" />

                    {/* Role Filter Pills */}
                    <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                        {['All', 'SDE', 'Intern'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setFilters(prev => ({ ...prev, role: role === 'All' ? '' : role }))}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    (filters.role === role || (role === 'All' && !filters.role))
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    {/* Difficulty Pill */}
                    <select 
                        value={filters.difficulty || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                        className={`px-4 py-2.5 rounded-xl border appearance-none outline-none text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400'}`}
                    >
                        <option value="">Difficulty: All</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                {/* Right Side: Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <select 
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className={`pl-4 pr-10 py-3 rounded-2xl border appearance-none outline-none text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <option value="latest">Sort: Latest</option>
                            <option value="upvoted">Sort: Most Upvoted</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>

                    <button className={`p-3 rounded-2xl border transition-all ${isLightMode ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-400'}`}>
                        <Bookmark size={16} />
                    </button>

                    <button className={`p-3 rounded-2xl border transition-all ${isLightMode ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400'}`}>
                        <Award size={16} />
                    </button>

                    <button 
                        onClick={onAddClick}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-xl shadow-purple-900/20 active:scale-95"
                    >
                        <Plus size={16} />
                        Add Experience
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewFilterBar;
