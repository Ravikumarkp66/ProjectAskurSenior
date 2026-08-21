/* ═══════════════════════════════════════════════════════════════════
   MarketplaceCategories Component
   Horizontally Scrollable Category Pill Navigation
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { CATEGORIES } from '../constants/marketplace.constants';

const MarketplaceCategories = ({ activeCategory, onSelectCategory, counts = {} }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                const count = counts[cat.id] || 0;

                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelectCategory(cat.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                            isActive
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'bg-[#161B22] text-[#8B949E] hover:text-[#E6EDF3] border border-[#21262D] hover:border-[#30363D]'
                        }`}
                    >
                        <span>{cat.label}</span>
                        {count > 0 && (
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    isActive
                                        ? 'bg-black/25 text-white'
                                        : 'bg-[#21262D] text-[#8B949E]'
                                }`}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default MarketplaceCategories;
