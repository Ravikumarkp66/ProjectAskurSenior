/* ═══════════════════════════════════════════════════════════════════
   MarketplaceGrid Component
   Responsive Product Grid (4/3-col Desktop, 2-col Tablet, 1-col Mobile)
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import MarketplaceCard from './MarketplaceCard';
import EmptyMarketplaceState from './EmptyMarketplaceState';

const MarketplaceGrid = ({
    items = [],
    isLoading = false,
    hasSearchQuery,
    onClearFilters,
    onSellClick,
    isMyListings,
    onSelectItem
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 py-1 sm:py-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="bg-[#161B22] border border-[#21262D] rounded-xl sm:rounded-2xl h-64 sm:h-84 animate-pulse p-2.5 sm:p-4 flex flex-col justify-between">
                        <div className="w-full h-28 sm:h-40 bg-[#21262D] rounded-lg sm:rounded-xl" />
                        <div className="space-y-2 mt-2">
                            <div className="h-3 sm:h-4 bg-[#21262D] rounded w-3/4" />
                            <div className="h-2.5 sm:h-3 bg-[#21262D] rounded w-1/2" />
                        </div>
                        <div className="h-6 sm:h-8 bg-[#21262D] rounded-lg sm:rounded-xl w-full mt-3" />
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <EmptyMarketplaceState
                hasSearchQuery={hasSearchQuery}
                onClearFilters={onClearFilters}
                onSellClick={onSellClick}
                isMyListings={isMyListings}
            />
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 py-1 sm:py-2">
            {items.map(item => (
                <MarketplaceCard
                    key={item.id}
                    item={item}
                    onClick={() => onSelectItem(item.id)}
                />
            ))}
        </div>
    );
};

export default MarketplaceGrid;
