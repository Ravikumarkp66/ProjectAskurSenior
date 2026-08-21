/* ═══════════════════════════════════════════════════════════════════
   MarketplaceDetailsPage Component
   Dedicated Item Details Page for Marketplace Listings
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, Calendar, Edit3, Trash2, CheckCircle2,
    MessageSquare, ShieldAlert, Tag
} from 'lucide-react';
import { formatPrice, formatDateString, formatRelativeTime, getConditionStyle } from '../utils/marketplace.utils';
import ProductImageGallery from '../components/ProductImageGallery';
import SellerCard from '../components/SellerCard';
import MarketplaceChat from '../components/MarketplaceChat';
import { LISTING_STATUS } from '../constants/marketplace.constants';

const MarketplaceDetailsPage = ({
    item,
    currentUser,
    onBack,
    onEdit,
    onDelete,
    onMarkSold,
    onSendMessage
}) => {
    const [showChat, setShowChat] = useState(false);

    if (!item) return null;

    const isSold = item.status === LISTING_STATUS.SOLD;
    const conditionStyle = getConditionStyle(item.condition);

    // Permission checks
    const isSeller = item.seller?.id === currentUser?.id || currentUser?.id === 'user-ravi' && item.seller?.name === 'Ravi Kumar';
    const isAdmin = currentUser?.isAdmin || false;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161B22] border border-[#21262D] hover:border-[#30363D] text-[#E6EDF3] text-xs sm:text-sm font-semibold transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Marketplace</span>
                </button>

                {/* Condition / Sold Badge */}
                {isSold ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-red-600/20 text-red-400 border border-red-500/30 uppercase tracking-widest">
                        <CheckCircle2 size={14} />
                        SOLD
                    </span>
                ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${conditionStyle.badgeBg} ${conditionStyle.badgeText} ${conditionStyle.badgeBorder}`}>
                        {conditionStyle.label} CONDITION
                    </span>
                )}
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left 6 or 7 Cols: Image Gallery */}
                <div className="md:col-span-6 lg:col-span-7">
                    <ProductImageGallery
                        images={item.images}
                        category={item.category}
                        title={item.title}
                    />
                </div>

                {/* Right 6 or 5 Cols: Item Info, Seller & CTAs */}
                <div className="md:col-span-6 lg:col-span-5 space-y-5">
                    {/* Main Title & Price Box */}
                    <div className="bg-[#161B22] p-5 rounded-2xl border border-[#21262D] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#0D1117] text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                {item.category}
                            </span>
                            <span className="text-xs text-[#8B949E]">
                                {formatRelativeTime(item.createdAt || item.date)}
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-extrabold text-[#E6EDF3] leading-snug">
                            {item.title}
                        </h1>

                        <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                            {formatPrice(item.price)}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#8B949E] pt-1">
                            <MapPin size={14} className="text-emerald-400 shrink-0" />
                            <span>{item.location || 'SIT Campus'}</span>
                        </div>

                        <hr className="border-[#21262D] my-3" />

                        {/* Description */}
                        <div>
                            <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1">
                                Description
                            </h3>
                            <p className="text-xs sm:text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-line">
                                {item.description}
                            </p>
                        </div>
                    </div>

                    {/* Seller Card */}
                    <SellerCard seller={item.seller} />

                    {/* Action Controls Box */}
                    <div className="bg-[#161B22] p-4 sm:p-5 rounded-2xl border border-[#21262D] space-y-3">
                        <h4 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                            Actions
                        </h4>

                        {isSold ? (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} />
                                <span>This item has been SOLD</span>
                            </div>
                        ) : (
                            <>
                                {/* Buyer Action: Message Seller */}
                                {!isSeller && !isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setShowChat(prev => !prev)}
                                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <MessageSquare size={16} />
                                        <span>{showChat ? 'Hide Chat' : 'Message Seller'}</span>
                                    </button>
                                )}

                                {/* Seller Controls */}
                                {isSeller && (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={onMarkSold}
                                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>Mark as Sold</span>
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={onEdit}
                                                className="py-2 px-3 rounded-xl text-xs font-semibold bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Edit3 size={13} />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={onDelete}
                                                className="py-2 px-3 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Trash2 size={13} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Controls */}
                                {isAdmin && (
                                    <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-xl space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                                            <ShieldAlert size={14} />
                                            <span>Admin Override Controls</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={onMarkSold}
                                                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-1.5"
                                            >
                                                <CheckCircle2 size={13} />
                                                Admin Mark Sold
                                            </button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={onEdit}
                                                    className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-[#21262D] text-[#E6EDF3] hover:bg-[#30363D]"
                                                >
                                                    Admin Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={onDelete}
                                                    className="py-1.5 px-2 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30"
                                                >
                                                    Admin Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Private 1-on-1 Chat Section */}
            {(showChat || isSeller || isAdmin) && (
                <div className="pt-4 space-y-3">
                    <h3 className="text-base font-bold text-[#E6EDF3] flex items-center gap-2">
                        <MessageSquare size={18} className="text-emerald-400" />
                        <span>Private Buyer & Seller Handoff Chat</span>
                    </h3>

                    <MarketplaceChat
                        item={item}
                        currentUser={currentUser}
                        onSendMessage={onSendMessage}
                    />
                </div>
            )}

            {/* Mobile Sticky Bottom Bar (< md) for Quick Primary Action */}
            {!isSold && !isSeller && !isAdmin && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#161B22]/95 backdrop-blur-xl border-t border-[#21262D] z-40 md:hidden flex items-center justify-between gap-3">
                    <div>
                        <div className="text-[10px] text-[#8B949E] uppercase font-bold">Price</div>
                        <div className="text-base font-extrabold text-emerald-400">{formatPrice(item.price)}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowChat(prev => !prev)}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2"
                        style={{
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                        }}
                    >
                        <MessageSquare size={15} />
                        <span>{showChat ? 'Hide Chat' : 'Message Seller'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MarketplaceDetailsPage;
