/* ═══════════════════════════════════════════════════════════════════
   MarketplaceFilters Component
   Filter Drawer / Modal for Condition & Price Range
═══════════════════════════════════════════════════════════════════ */

import React from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { CONDITIONS } from '../constants/marketplace.constants';
import { formatPrice } from '../utils/marketplace.utils';

const MarketplaceFilters = ({
    isOpen,
    onClose,
    selectedConditions,
    onToggleCondition,
    minPrice,
    maxPrice,
    onPriceChange,
    onResetFilters
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Slide-over / Modal content — Bottom Sheet on Mobile (< sm), Centered Modal on Desktop (>= sm) */}
            <div className="relative w-full max-w-md max-h-[85vh] sm:max-h-[90vh] bg-[#161B22] border-t sm:border border-[#21262D] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-0 sm:my-auto p-4 sm:p-5 text-[#E6EDF3] animate-slideUp sm:animate-fadeIn">
                {/* Mobile Drag Indicator Handle */}
                <div className="w-10 h-1 bg-[#30363D] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#21262D]">
                    <h3 className="text-sm sm:text-base font-bold text-[#E6EDF3]">Filter Items</h3>
                    <button type="button" onClick={onClose} className="p-1 text-[#8B949E] hover:text-[#E6EDF3]">
                        <X size={18} />
                    </button>
                </div>

                <div className="py-4 space-y-6 flex-1 overflow-y-auto">
                    {/* Condition checkboxes */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#8B949E] mb-3">
                            Item Condition
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {CONDITIONS.map(cond => {
                                const isChecked = selectedConditions.includes(cond.id);
                                return (
                                    <button
                                        key={cond.id}
                                        type="button"
                                        onClick={() => onToggleCondition(cond.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                                            isChecked
                                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                                                : 'bg-[#0D1117] border-[#21262D] text-[#8B949E] hover:border-[#30363D]'
                                        }`}
                                    >
                                        <span>{cond.label}</span>
                                        {isChecked && <Check size={14} className="text-emerald-400 stroke-[2.5]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Price Range Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-[#8B949E]">
                                Price Range
                            </label>
                            <span className="text-xs font-bold text-emerald-400">
                                {formatPrice(minPrice)} — {maxPrice === Infinity || maxPrice >= 25000 ? 'Any Price' : formatPrice(maxPrice)}
                            </span>
                        </div>

                        <div className="space-y-3 bg-[#0D1117] p-4 rounded-xl border border-[#21262D]">
                            <div>
                                <span className="text-[11px] text-[#8B949E]">Max Price: {formatPrice(maxPrice)}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={25000}
                                    step={100}
                                    value={maxPrice === Infinity ? 25000 : maxPrice}
                                    onChange={e => onPriceChange(minPrice, Number(e.target.value))}
                                    className="w-full accent-emerald-500 cursor-pointer mt-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#21262D]">
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] bg-[#0D1117] border border-[#21262D]"
                    >
                        <RotateCcw size={13} />
                        Reset Filters
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceFilters;
