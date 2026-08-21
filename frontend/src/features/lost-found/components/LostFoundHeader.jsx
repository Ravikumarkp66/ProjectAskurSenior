/* ═══════════════════════════════════════════════════════════════════
   LostFoundHeader Component
   Page Title, Subtitle, and Primary "+ Raise Query" CTA Button
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus, Search } from 'lucide-react';

const LostFoundHeader = ({ onRaiseQuery }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 pb-4 md:pb-5 border-b border-[#21262D]">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
                        Lost & Found
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        <Search size={11} className="stroke-[2.5]" />
                        Campus Utility
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-0.5 md:mt-1 max-w-xl">
                    Report lost or found items across campus to quickly reconnect missing belongings with their owners.
                </p>
            </div>

            {/* Top "+ Raise Query" CTA — Hidden on mobile (< md) as handled by mobile FAB, visible on desktop (md+) */}
            <div className="hidden md:flex items-center gap-3 self-start md:self-auto">
                <button
                    type="button"
                    onClick={onRaiseQuery}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                        boxShadow: '0 4px 20px rgba(249, 115, 22, 0.35)'
                    }}
                >
                    <Plus size={18} className="stroke-[2.5]" />
                    <span>Raise Query</span>
                </button>
            </div>
        </div>
    );
};

export default LostFoundHeader;
