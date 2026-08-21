/* ═══════════════════════════════════════════════════════════════════
   LostFoundSearch Component
   Search Input, Sort Select, and Results Counter
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { SORT_OPTIONS } from '../constants/lostFound.constants';

const LostFoundSearch = ({
    searchQuery,
    onSearchChange,
    sortOption,
    onSortChange,
    totalCount
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#161B22]/60 p-2.5 rounded-2xl border border-[#21262D]">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                <input
                    type="text"
                    placeholder="Search by title, location, description, or student name..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#0D1117] border border-[#21262D] text-[#E6EDF3] placeholder-[#8B949E]/60 text-xs sm:text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 outline-none transition-colors"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-[#E6EDF3] p-0.5"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Sort Order Selector */}
                <div className="relative flex-1 sm:flex-initial">
                    <select
                        value={sortOption}
                        onChange={e => onSortChange(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 pl-8 rounded-xl bg-[#0D1117] border border-[#21262D] text-[#E6EDF3] text-xs sm:text-sm outline-none focus:border-orange-500/50 cursor-pointer transition-colors appearance-none"
                    >
                        {SORT_OPTIONS.map(sort => (
                            <option key={sort.value} value={sort.value} className="bg-[#161B22]">
                                {sort.label}
                            </option>
                        ))}
                    </select>
                    <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B949E] pointer-events-none" />
                </div>
            </div>

            {/* Results Count */}
            <div className="text-xs text-[#8B949E] font-medium px-2 py-1 self-end sm:self-center">
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </div>
        </div>
    );
};

export default LostFoundSearch;
