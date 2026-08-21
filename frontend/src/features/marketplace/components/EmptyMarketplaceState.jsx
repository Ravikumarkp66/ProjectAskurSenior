/* ═══════════════════════════════════════════════════════════════════
   EmptyMarketplaceState Component
   Friendly empty states for search/filters or empty listings
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { ShoppingBag, Search, Plus, Tag } from 'lucide-react';

const EmptyMarketplaceState = ({ hasSearchQuery, onClearFilters, onSellClick, isMyListings }) => {
    if (hasSearchQuery) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#E6EDF3]">No items match your search</h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                    Try changing your search terms, adjusting price filters, or switching category tabs.
                </p>
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] transition-colors"
                >
                    Clear search & filters
                </button>
            </div>
        );
    }

    if (isMyListings) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Tag size={28} />
                </div>
                <h3 className="text-lg font-bold text-[#E6EDF3]">You haven't listed any items yet</h3>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                    Got old textbooks, calculators, or gadgets? Turn them into cash by selling to fellow students.
                </p>
                <button
                    type="button"
                    onClick={onSellClick}
                    className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                >
                    <Plus size={16} />
                    Post Your First Listing
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#161B22]/40 rounded-2xl border border-[#21262D] my-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-bold text-[#E6EDF3]">No campus listings yet</h3>
            <p className="text-xs sm:text-sm text-[#8B949E] mt-1 max-w-md">
                Be the first student to post an item for sale in this section.
            </p>
            <button
                type="button"
                onClick={onSellClick}
                className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
            >
                <Plus size={16} />
                Sell Something
            </button>
        </div>
    );
};

export default EmptyMarketplaceState;
