import React, { useEffect, useRef } from 'react';
import { 
    Search, 
    X, 
    SlidersHorizontal, 
    ArrowUpDown, 
    RotateCcw,
    Layers
} from 'lucide-react';

const CATEGORIES = [
    { id: 'all', label: 'All Companies' },
    { id: 'Product', label: 'Product' },
    { id: 'Service', label: 'Service / Consulting' }
];

const BATCHES = ['all', '2027', '2026', '2025'];

const CTC_TIERS = [
    { id: 'all', label: 'All Packages' },
    { id: 'tier-high', label: '> 20 LPA' },
    { id: 'tier-mid', label: '10 - 20 LPA' },
    { id: 'tier-base', label: '< 10 LPA' }
];

const SORT_OPTIONS = [
    { id: 'most-stories', label: 'Most Stories' },
    { id: 'latest-batch', label: 'Latest Batch' },
    { id: 'a-z', label: 'Company A–Z' },
    { id: 'ctc-high', label: 'Highest Package' }
];

const InterviewToolbar = ({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBatch,
    setSelectedBatch,
    selectedCtcTier,
    setSelectedCtcTier,
    sortBy,
    setSortBy,
    totalResults,
    onResetFilters,
    hasActiveFilters
}) => {
    const searchInputRef = useRef(null);

    // Keyboard shortcut '/' to focus search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                const targetTag = document.activeElement?.tagName?.toLowerCase();
                if (targetTag !== 'input' && targetTag !== 'textarea') {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="w-full my-6 flex flex-col gap-3.5">
            {/* Main Bar: Search + Category Tabs + Quick Filter Badges */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 rounded-2xl bg-[#0f1117] border border-white/[0.08] shadow-xl">
                
                {/* 1. Instant Search Input */}
                <div className="relative flex-1 min-w-[260px]">
                    <Search 
                        size={16} 
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                    />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search company, role, batch (e.g. Amazon, SDE, 2026)..."
                        className="w-full h-10 pl-9 pr-16 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-black/40 border border-white/[0.06] focus:border-purple-500/50 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none transition-all font-medium"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
                                title="Clear search"
                            >
                                <X size={13} />
                            </button>
                        ) : (
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-[9px] font-mono text-slate-400">
                                /
                            </kbd>
                        )}
                    </div>
                </div>

                {/* 2. Category Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.05] overflow-x-auto no-scrollbar shrink-0">
                    {CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                                    active
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* 3. Secondary Dropdowns: Batch + CTC + Sort */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    {/* Batch Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="h-9 px-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl outline-none cursor-pointer pr-6"
                        >
                            <option value="all" className="bg-[#13161f] text-white">All Batches</option>
                            {BATCHES.filter(b => b !== 'all').map(batch => (
                                <option key={batch} value={batch} className="bg-[#13161f] text-white">
                                    Batch {batch}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* CTC Tier Dropdown */}
                    <div className="relative">
                        <select
                            value={selectedCtcTier}
                            onChange={(e) => setSelectedCtcTier(e.target.value)}
                            className="h-9 px-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl outline-none cursor-pointer pr-6"
                        >
                            {CTC_TIERS.map(tier => (
                                <option key={tier.id} value={tier.id} className="bg-[#13161f] text-white">
                                    {tier.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative flex items-center gap-1.5 pl-2 border-l border-white/[0.08]">
                        <ArrowUpDown size={13} className="text-purple-400 hidden sm:inline" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-9 px-3 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-xl outline-none cursor-pointer pr-6"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.id} value={opt.id} className="bg-[#13161f] text-white">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Reset Button (only shown when any filter is active) */}
                    {hasActiveFilters && (
                        <button
                            onClick={onResetFilters}
                            className="h-9 px-2.5 flex items-center gap-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-colors shrink-0"
                            title="Reset all filters"
                        >
                            <RotateCcw size={12} />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Results Count & Filter Status Header */}
            <div className="flex items-center justify-between px-2 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Showing <strong className="text-white font-bold">{totalResults}</strong> placement track{totalResults === 1 ? '' : 's'}</span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Click any company to explore specific interview rounds & questions
                </span>
            </div>
        </div>
    );
};

export default InterviewToolbar;
