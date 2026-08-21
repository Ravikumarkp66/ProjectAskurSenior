import React, { memo } from 'react';
import { Search, Filter, X, Bookmark, UserCheck, ShieldCheck } from 'lucide-react';
import { BRANCHES } from '../../utils/constants';

const AskSearchFilters = memo(({
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    selectedPaperType,
    setSelectedPaperType,
    selectedYearLevel,
    setSelectedYearLevel,
    selectedDocType,
    setSelectedDocType,
    currentBranch,
    handleBranchOverrideChange,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
    bookmarksOnly,
    setBookmarksOnly,
    subjects,
    paperTypes,
    isAdmin,
    pendingUploadsCount,
    isLightMode
}) => {
    return (
        <div className={`p-4 sm:p-6 rounded-2xl border transition-colors ${
            isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#121316] border-slate-800/80 text-white'
        }`}>
            {/* Top Bar Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-400" />
                    <h2 className="font-semibold text-lg">Filters</h2>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    {/* Bookmarks Toggle */}
                    <button
                        onClick={() => setBookmarksOnly(!bookmarksOnly)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            bookmarksOnly
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                : isLightMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        <Bookmark className="w-3.5 h-3.5" />
                        Saved
                    </button>

                    {/* Admin Pending Toggle */}
                    {isAdmin && (
                        <button
                            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                statusFilter === 'pending'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : isLightMode ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Pending Review
                            {pendingUploadsCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
                                    {pendingUploadsCount}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Year Level Select */}
                <select
                    value={selectedYearLevel}
                    onChange={(e) => setSelectedYearLevel(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                        isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                            : 'bg-[#18191c] border-slate-800 text-slate-200 focus:border-purple-500'
                    }`}
                >
                    <option value="">All Academic Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                </select>

                {/* Branch Select */}
                <select
                    value={currentBranch}
                    onChange={(e) => handleBranchOverrideChange(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                        isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                            : 'bg-[#18191c] border-slate-800 text-slate-200 focus:border-purple-500'
                    }`}
                >
                    {BRANCHES.map(b => (
                        <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                    ))}
                </select>

                {/* Document Type Select */}
                <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                        isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                            : 'bg-[#18191c] border-slate-800 text-slate-200 focus:border-purple-500'
                    }`}
                >
                    <option value="">All Document Types</option>
                    <option value="notes">Notes</option>
                    <option value="pyq">Previous Year Questions</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="lab">Lab Manuals</option>
                </select>

                {/* Sort Order */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none transition-colors ${
                        isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500'
                            : 'bg-[#18191c] border-slate-800 text-slate-200 focus:border-purple-500'
                    }`}
                >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="downloads">Most Downloaded</option>
                </select>
            </div>
        </div>
    );
});

AskSearchFilters.displayName = 'AskSearchFilters';

export default AskSearchFilters;
