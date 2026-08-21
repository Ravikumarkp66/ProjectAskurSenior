/* ═══════════════════════════════════════════════════════════════════
   LostFoundGrid Component
   Responsive Card Grid (3-col Desktop, 2-col Tablet, 1-col Mobile)
   Skeletons & Empty States Integration
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import LostFoundCard from './LostFoundCard';
import EmptyLostFoundState from './EmptyLostFoundState';

const LostFoundGrid = ({
    items = [],
    isLoading = false,
    activeTab,
    hasSearchQuery,
    onClearSearch,
    onRaiseQuery,
    onSelectItem
}) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 py-1 sm:py-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-[#161B22] border border-[#21262D] rounded-xl sm:rounded-2xl h-64 sm:h-80 animate-pulse p-2.5 sm:p-4 flex flex-col justify-between">
                        <div className="w-full h-28 sm:h-36 bg-[#21262D] rounded-lg sm:rounded-xl" />
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
            <EmptyLostFoundState
                activeTab={activeTab}
                hasSearchQuery={hasSearchQuery}
                onClearSearch={onClearSearch}
                onRaiseQuery={onRaiseQuery}
            />
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5 py-1 sm:py-2">
            {items.map(item => (
                <LostFoundCard
                    key={item.id}
                    item={item}
                    onClick={() => onSelectItem(item.id)}
                />
            ))}
        </div>
    );
};

export default LostFoundGrid;
