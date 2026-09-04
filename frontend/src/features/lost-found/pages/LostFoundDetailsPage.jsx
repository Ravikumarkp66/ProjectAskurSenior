/* ═══════════════════════════════════════════════════════════════════
   LostFoundDetailsPage Component
   Dedicated Item Details View for Lost & Found Queries
═══════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, Calendar, User, Edit3, Trash2, CheckCircle2,
    MessageSquare, ShieldAlert, ImageOff, Lock, Sparkles, Send
} from 'lucide-react';
import { formatRelativeTime, formatDateString, getStatusStyle, getImageFallback } from '../utils/lostFound.utils';
import LostFoundChat from '../components/LostFoundChat';

const LostFoundDetailsPage = ({
    item,
    currentUser,
    onBack,
    onEdit,
    onDelete,
    onResolve,
    onClaim,
    onSendMessage
}) => {
    const [imgError, setImgError] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);

    if (!item) return null;

    const statusStyle = getStatusStyle(item.type, item.isResolved || item.status === 'resolved');
    const displayImage = imgError
        ? getImageFallback(item.category)
        : (item.image || getImageFallback(item.category));

    // Permission checks
    const isOwner = item.postedBy?.id === currentUser?.id || currentUser?.id === 'user-ravi' && item.postedBy?.name === 'Ravi Kumar';

    // Has user claimed this item?
    const hasClaimed = (item.claims || []).some(c => c.userId === currentUser?.id);
    const canAccessChat = isOwner || hasClaimed;

    const isResolved = item.isResolved || item.status === 'resolved';

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fadeIn">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161B22] border border-[#21262D] hover:border-[#30363D] text-[#E6EDF3] text-xs sm:text-sm font-semibold transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Lost & Found</span>
                </button>

                {/* Status indicator badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${statusStyle.badgeBg} ${statusStyle.badgeText} ${statusStyle.badgeBorder}`}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusStyle.dotColor }} />
                    {statusStyle.label}
                </span>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left 2 Cols: Image & Description Details */}
                <div className="md:col-span-2 space-y-5">
                    {/* Hero Item Image */}
                    <div
                        onClick={() => displayImage && setShowLightbox(true)}
                        className="relative w-full h-72 sm:h-96 bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden cursor-pointer group"
                    >
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={item.title}
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#8B949E]">
                                <ImageOff size={36} className="mb-2" />
                                <span className="text-xs">No image provided</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold backdrop-blur-xs">
                            Click to enlarge photo
                        </div>
                    </div>

                    {/* Title & Key Attributes */}
                    <div className="space-y-3 bg-[#161B22] p-5 rounded-2xl border border-[#21262D]">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[#E6EDF3] leading-snug">
                            {item.title}
                        </h1>

                        <div className="flex items-center gap-4 text-xs text-[#8B949E] flex-wrap">
                            <div className="flex items-center gap-1.5 text-[#E6EDF3]">
                                <MapPin size={15} className="text-orange-400 shrink-0" />
                                <span>{item.location}</span>
                            </div>
                            <span>•</span>
                            <div className="flex items-center gap-1.5 text-[#E6EDF3]">
                                <Calendar size={15} className="text-orange-400 shrink-0" />
                                <span>{formatDateString(item.date)}</span>
                            </div>
                        </div>

                        <hr className="border-[#21262D] my-3" />

                        {/* Full Description */}
                        <div>
                            <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">
                                Description
                            </h3>
                            <p className="text-sm text-[#E6EDF3] leading-relaxed whitespace-pre-line">
                                {item.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Poster Profile, Actions & Controls */}
                <div className="space-y-5">
                    {/* Poster Card */}
                    <div className="bg-[#161B22] p-4 sm:p-5 rounded-2xl border border-[#21262D] space-y-4">
                        <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                            Posted By
                        </h3>

                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-base shadow-md">
                                {item.postedBy?.name ? item.postedBy.name.charAt(0) : 'S'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#E6EDF3] truncate">
                                    {item.postedBy?.name || 'Student Poster'}
                                </h4>
                                <p className="text-xs text-[#8B949E] truncate">
                                    {item.postedBy?.branch || 'Campus Student'}
                                </p>
                                <p className="text-[11px] text-[#8B949E]/70 mt-0.5">
                                    {formatRelativeTime(item.createdAt || item.date)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="bg-[#161B22] p-4 sm:p-5 rounded-2xl border border-[#21262D] space-y-3">
                        <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">
                            Actions
                        </h3>

                        {isResolved ? (
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} />
                                <span>This item query has been RESOLVED</span>
                            </div>
                        ) : (
                            <>
                                {/* Non-Owner Action: Claim / Contact */}
                                {!isOwner && (
                                    <button
                                        type="button"
                                        onClick={onClaim}
                                        className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        style={{
                                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                                            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)'
                                        }}
                                    >
                                        <Sparkles size={16} />
                                        <span>{item.type === 'found' ? 'This might be mine' : 'I found this item'}</span>
                                    </button>
                                )}

                                {/* Owner Controls */}
                                {isOwner && (
                                    <div className="space-y-2">
                                        <button
                                            type="button"
                                            onClick={onResolve}
                                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                                        >
                                            <CheckCircle2 size={15} />
                                            <span>Mark as Resolved</span>
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
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Private Item Chat Section */}
            <div className="pt-4">
                {canAccessChat ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-[#E6EDF3] flex items-center gap-2">
                                <MessageSquare size={18} className="text-orange-400" />
                                <span>Private Handoff Chat</span>
                            </h3>
                            <span className="text-xs text-[#8B949E]">
                                Restricted 1-on-1 Conversation
                            </span>
                        </div>

                        <LostFoundChat
                            item={item}
                            currentUser={currentUser}
                            onSendMessage={onSendMessage}
                        />
                    </div>
                ) : (
                    <div className="p-5 bg-[#161B22] border border-[#21262D] rounded-2xl text-center space-y-2">
                        <Lock size={24} className="text-orange-400 mx-auto" />
                        <h4 className="text-sm font-bold text-[#E6EDF3]">Private Conversation</h4>
                        <p className="text-xs text-[#8B949E] max-w-md mx-auto">
                            The private chat for this item is available exclusively to the poster and student claimant. Click <span className="text-orange-400 font-semibold">"{item.type === 'found' ? 'This might be mine' : 'I found this item'}"</span> to initiate a claim.
                        </p>
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {showLightbox && displayImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
                    <img src={displayImage} alt={item.title} className="max-w-full max-h-[90vh] object-contain rounded-xl" />
                </div>
            )}

            {/* Mobile Sticky Bottom Bar (< md) for Quick Primary Action */}
            {!isResolved && !isOwner && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#161B22]/95 backdrop-blur-xl border-t border-[#21262D] z-40 md:hidden flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-[#8B949E] uppercase font-bold">Location</div>
                        <div className="text-xs font-bold text-[#E6EDF3] truncate">{item.location}</div>
                    </div>
                    <button
                        type="button"
                        onClick={onClaim}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            boxShadow: '0 4px 16px rgba(249, 115, 22, 0.35)'
                        }}
                    >
                        <Sparkles size={15} />
                        <span>{item.type === 'found' ? 'Claim Item' : 'I Found This'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LostFoundDetailsPage;
