/* ═══════════════════════════════════════════════════════════════════
   EmptyLostFoundState Component
   Friendly, clear empty states for empty search results or tabs
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Search, PackageX, CheckCircle2, Plus } from 'lucide-react';
import { TAB_TYPES } from '../constants/lostFound.constants';

const EmptyLostFoundState = ({ activeTab, hasSearchQuery, onClearSearch, onRaiseQuery }) => {
    if (hasSearchQuery) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                    <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#E6EDF3]">No items match your search</h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                    Try changing your search terms or check the other section tabs.
                </p>
                <button
                    type="button"
                    onClick={onClearSearch}
                    className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] transition-colors"
                >
                    Clear search query
                </button>
            </div>
        );
    }

    if (activeTab === TAB_TYPES.RESOLVED) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <CheckCircle2 size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#E6EDF3]">No resolved queries yet</h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                    When lost or found queries are successfully completed and marked resolved by owners or admins, they will appear here.
                </p>
            </div>
        );
    }

    if (activeTab === TAB_TYPES.FOUND) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <PackageX size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#E6EDF3]">No active found items</h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                    Have you found something on campus? Be a helpful student and report it here.
                </p>
                <button
                    type="button"
                    onClick={onRaiseQuery}
                    className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-600/20"
                >
                    <Plus size={14} />
                    Report a Found Item
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                <PackageX size={28} />
            </div>
            <h3 className="text-lg font-bold text-[#E6EDF3]">No active lost items reported</h3>
            <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                No active lost items in this view. If you lost something on campus, raise a query to notify students.
            </p>
            <button
                type="button"
                onClick={onRaiseQuery}
                className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors shadow-lg shadow-orange-500/20"
            >
                <Plus size={14} />
                Report a Lost Item
            </button>
        </div>
    );
};

export default EmptyLostFoundState;
