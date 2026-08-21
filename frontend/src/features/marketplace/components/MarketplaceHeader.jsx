/* ═══════════════════════════════════════════════════════════════════
   MarketplaceHeader Component
   Page Title, Subtitle, and "+ Sell Something" Primary CTA
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { Plus, ShoppingBag, Store, User } from 'lucide-react';

const MarketplaceHeader = ({ onSellClick, myListingsOnly, onToggleMyListings }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 pb-4 md:pb-5 border-b border-[#21262D]">
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#E6EDF3] tracking-tight">
                        Marketplace
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShoppingBag size={11} className="stroke-[2.5]" />
                        Campus Store
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-[#8B949E] mt-0.5 md:mt-1 max-w-xl">
                    Buy and sell useful things within your campus. Peer-to-peer student deals.
                </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap pt-1 md:pt-0">
                {/* All vs My Listings Toggle — Full width on mobile (< md) */}
                <div className="flex items-center bg-[#161B22] border border-[#21262D] rounded-xl p-1 text-xs w-full md:w-auto">
                    <button
                        type="button"
                        onClick={() => onToggleMyListings(false)}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                            !myListingsOnly
                                ? 'bg-[#21262D] text-[#E6EDF3] shadow-sm'
                                : 'text-[#8B949E] hover:text-[#E6EDF3]'
                        }`}
                    >
                        <Store size={13} />
                        <span>Browse All</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggleMyListings(true)}
                        className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                            myListingsOnly
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                                : 'text-[#8B949E] hover:text-emerald-400'
                        }`}
                    >
                        <User size={13} />
                        <span>My Listings</span>
                    </button>
                </div>

                {/* Primary "+ Sell Something" CTA (Hidden on mobile < md as handled by FAB, visible on md+) */}
                <button
                    type="button"
                    onClick={onSellClick}
                    className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)'
                    }}
                >
                    <Plus size={18} className="stroke-[2.5]" />
                    <span>Sell Something</span>
                </button>
            </div>
        </div>
    );
};

export default MarketplaceHeader;
