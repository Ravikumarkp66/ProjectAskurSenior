/* ═══════════════════════════════════════════════════════════════════
   LostFoundCard Component
   Reusable Card representing a Lost, Found, or Resolved item
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { MapPin, ArrowRight, User, ImageOff, MessageSquare } from 'lucide-react';
import { formatRelativeTime, getStatusStyle, getImageFallback } from '../utils/lostFound.utils';

const LostFoundCard = ({ item, onClick }) => {
    const [imgError, setImgError] = useState(false);
    const statusStyle = getStatusStyle(item.type, item.isResolved || item.status === 'resolved');

    const displayImage = imgError
        ? getImageFallback()
        : (item.image || getImageFallback());

    const claimCount = item.claims?.length || 0;
    const msgCount = item.messages?.length || 0;

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
            className="group flex flex-col bg-[#161B22] hover:bg-[#1C2129] border border-[#21262D] hover:border-[#30363D] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm hover:shadow-md h-full active:scale-[0.98]"
        >
            {/* Image Container */}
            <div className="relative w-full h-32 sm:h-44 bg-[#0D1117] overflow-hidden shrink-0">
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt={item.title}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E] bg-[#0D1117]">
                        <ImageOff size={22} className="stroke-[1.5] mb-1" />
                        <span className="text-[10px] sm:text-xs">No image provided</span>
                    </div>
                )}

                {/* Status Badge overlay */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider border backdrop-blur-md shadow-md ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}>
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statusStyle.dotColor }}
                        />
                        {statusStyle.label}
                    </span>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
                <div className="space-y-1">
                    {/* Item Title */}
                    <h3 className="text-xs sm:text-base font-bold text-[#E6EDF3] group-hover:text-orange-400 transition-colors line-clamp-1">
                        {item.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-[11px] sm:text-xs text-[#8B949E] line-clamp-1 sm:line-clamp-2 leading-tight sm:leading-relaxed">
                        {item.description}
                    </p>
                </div>

                <div className="pt-1.5 sm:pt-2 border-t border-[#21262D]/60 space-y-1 text-[10px] sm:text-xs text-[#8B949E]">
                    {/* Location */}
                    <div className="flex items-center gap-1 text-[#E6EDF3]">
                        <MapPin size={11} className="text-orange-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                    </div>

                    {/* Poster info & timestamp */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                        <div className="flex items-center gap-1 truncate text-[#8B949E]">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">
                                {item.postedBy?.name ? item.postedBy.name.charAt(0) : <User size={9} />}
                            </div>
                            <span className="truncate">{item.postedBy?.name || 'Poster'}</span>
                        </div>

                        {/* Activity badges */}
                        {(claimCount > 0 || msgCount > 0) && (
                            <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded shrink-0">
                                <MessageSquare size={10} />
                                <span>{msgCount || claimCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* View Details Action Link */}
                <div className="flex items-center justify-end text-[11px] sm:text-xs font-semibold text-orange-400 group-hover:translate-x-0.5 transition-transform pt-0.5">
                    <span>Details</span>
                    <ArrowRight size={12} className="ml-1 sm:w-3.5 sm:h-3.5" />
                </div>
            </div>
        </div>
    );
};

export default LostFoundCard;
