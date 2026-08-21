/* ═══════════════════════════════════════════════════════════════════
   MarketplaceCard Component
   Reusable Card representing a Marketplace Listing (ACTIVE or SOLD)
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { MapPin, ArrowRight, User, ImageOff, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatRelativeTime, getConditionStyle, getImageFallback } from '../utils/marketplace.utils';
import { LISTING_STATUS } from '../constants/marketplace.constants';

const MarketplaceCard = ({ item, onClick }) => {
    const [imgError, setImgError] = useState(false);

    const isSold = item.status === LISTING_STATUS.SOLD;
    const conditionStyle = getConditionStyle(item.condition);

    const primaryImage = (item.images && item.images.length > 0)
        ? item.images[0]
        : getImageFallback(item.category);

    const displayImage = imgError ? getImageFallback(item.category) : primaryImage;

    return (
        <div
            onClick={onClick}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`group flex flex-col bg-[#161B22] border rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm hover:shadow-md h-full active:scale-[0.98] ${
                isSold
                    ? 'border-[#21262D] opacity-75 grayscale-[20%]'
                    : 'hover:bg-[#1C2129] border-[#21262D] hover:border-[#30363D]'
            }`}
        >
            {/* Product Image Container */}
            <div className="relative w-full h-32 sm:h-48 bg-[#0D1117] overflow-hidden shrink-0">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={item.title}
                        onError={() => setImgError(true)}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                            isSold ? '' : 'group-hover:scale-105'
                        }`}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E] bg-[#0D1117]">
                        <ImageOff size={22} className="stroke-[1.5] mb-1" />
                        <span className="text-[10px] sm:text-xs">No image provided</span>
                    </div>
                )}

                {/* SOLD Badge Overlay if sold */}
                {isSold ? (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black bg-red-600/90 text-white uppercase tracking-widest shadow-xl border border-red-400/40">
                            <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5" />
                            SOLD
                        </span>
                    </div>
                ) : (
                    /* Condition Badge */
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md shadow-md ${conditionStyle.badgeBg} ${conditionStyle.badgeText} ${conditionStyle.badgeBorder}`}>
                            {conditionStyle.label}
                        </span>
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
                <div className="space-y-1">
                    {/* Item Title */}
                    <h3 className={`text-xs sm:text-base font-bold transition-colors line-clamp-1 ${
                        isSold ? 'text-[#8B949E] line-through' : 'text-[#E6EDF3] group-hover:text-emerald-400'
                    }`}>
                        {item.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-[11px] sm:text-xs text-[#8B949E] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                        {item.description}
                    </p>
                </div>

                {/* Price Section */}
                <div className="pt-0.5">
                    <span className={`text-sm sm:text-xl font-extrabold ${isSold ? 'text-[#8B949E]' : 'text-emerald-400'}`}>
                        {formatPrice(item.price)}
                    </span>
                </div>

                <div className="pt-1.5 sm:pt-2 border-t border-[#21262D]/60 space-y-1 text-[10px] sm:text-xs text-[#8B949E]">
                    {/* Seller name & Location */}
                    <div className="flex items-center gap-1.5 truncate text-[#E6EDF3]">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">
                            {item.seller?.name ? item.seller.name.charAt(0) : <User size={9} />}
                        </div>
                        <span className="truncate">{item.seller?.name || 'Campus Student'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#8B949E]">
                        <MapPin size={11} className="text-emerald-400 shrink-0" />
                        <span className="truncate">{item.location || 'SIT Campus'}</span>
                        <span>·</span>
                        <span className="truncate">{formatRelativeTime(item.createdAt || item.date)}</span>
                    </div>
                </div>

                {/* View Details Action Link */}
                <div className="flex items-center justify-end text-[11px] sm:text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform pt-0.5">
                    <span>{isSold ? 'View' : 'Details'}</span>
                    <ArrowRight size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
                </div>
            </div>
        </div>
    );
};

export default MarketplaceCard;
