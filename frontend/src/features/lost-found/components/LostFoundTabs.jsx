/* ═══════════════════════════════════════════════════════════════════
   LostFoundTabs Component
   [ Lost ] [ Found ] [ Resolved ] Tab Controls with Active Accent States
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { TABS, TAB_TYPES } from '../constants/lostFound.constants';

const LostFoundTabs = ({ activeTab, onTabChange, counts = { lost: 0, found: 0, resolved: 0 } }) => {
    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const count = counts[tab.id] || 0;

                let activeStyle = '';
                if (isActive) {
                    if (tab.id === TAB_TYPES.LOST) {
                        activeStyle = 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
                    } else if (tab.id === TAB_TYPES.FOUND) {
                        activeStyle = 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20';
                    } else {
                        activeStyle = 'bg-blue-600 text-white shadow-lg shadow-blue-600/20';
                    }
                } else {
                    activeStyle = 'bg-[#161B22] text-[#8B949E] hover:text-[#E6EDF3] border border-[#21262D] hover:border-[#30363D]';
                }

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${activeStyle}`}
                    >
                        <span>{tab.label}</span>
                        <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isActive
                                    ? 'bg-black/25 text-white'
                                    : 'bg-[#21262D] text-[#8B949E]'
                            }`}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default LostFoundTabs;
