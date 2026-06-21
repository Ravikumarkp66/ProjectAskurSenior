import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_COLORS = {
    Question: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
    Doubt: { bg: 'rgba(167,139,250,0.1)', text: '#A78BFA', border: 'rgba(167,139,250,0.2)' },
    Exam: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', border: 'rgba(245,158,11,0.2)' },
    Resource: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', border: 'rgba(16,185,129,0.2)' },
    Notes: { bg: 'rgba(236,72,153,0.1)', text: '#F472B6', border: 'rgba(236,72,153,0.2)' },
    General: { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', border: 'rgba(148,163,184,0.2)' }
};

const DiscussionDetailModal = ({ isOpen, onClose, discussion, onReply, currentUser }) => {
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !discussion) return null;

    const catColor = CATEGORY_COLORS[discussion.category] || CATEGORY_COLORS.General;

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setIsSubmitting(true);
        await onReply(discussion._id, replyContent);
        setIsSubmitting(false);
        setReplyContent('');
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getProfileInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                    className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm" 
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#111113] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-slate-800 shrink-0">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                {discussion.pinned && (
                                    <span className="text-[12px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/30 font-medium">
                                        📌 Pinned
                                    </span>
                                )}
                                {discussion.isAnswered && (
                                    <span className="text-[12px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30 font-medium">
                                        ✓ Answered
                                    </span>
                                )}
                                <span 
                                    className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                                    style={{ background: catColor.bg, color: catColor.text, borderColor: catColor.border }}
                                >
                                    {discussion.category}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white leading-snug">{discussion.title}</h2>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden shrink-0">
                                    {discussion.author?.profilePicture ? (
                                        <img src={discussion.author.profilePicture} alt="author" className="w-full h-full object-cover" />
                                    ) : (
                                        getProfileInitial(discussion.author?.name)
                                    )}
                                </div>
                                <span className="font-medium text-slate-300">{discussion.author?.name || 'Unknown User'}</span>
                                <span>•</span>
                                <span>{formatDate(discussion.createdAt)}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-4 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-premium">
                        {discussion.description && (
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-8">
                                {discussion.description}
                            </div>
                        )}

                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-400">Replies</h3>
                            <div className="h-px bg-slate-800 flex-1"></div>
                            <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                                {discussion.replies?.length || 0}
                            </span>
                        </div>

                        {(!discussion.replies || discussion.replies.length === 0) ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-slate-500">No replies yet. Be the first to answer!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {discussion.replies.map((reply, index) => (
                                    <div key={reply._id || index} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0 mt-1 border border-slate-700">
                                            {reply.author?.profilePicture ? (
                                                <img src={reply.author.profilePicture} alt="author" className="w-full h-full object-cover" />
                                            ) : (
                                                getProfileInitial(reply.author?.name)
                                            )}
                                        </div>
                                        <div className="flex-1 bg-white/[0.02] border border-slate-800/60 rounded-2xl rounded-tl-sm p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-200">
                                                        {reply.author?.name || 'Unknown User'}
                                                    </span>
                                                    {reply.author?.role === 'admin' && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500">
                                                    {formatDate(reply.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                {reply.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reply Input */}
                    <div className="p-4 sm:p-6 border-t border-slate-800 bg-[#0a0a0b]/50 rounded-b-2xl shrink-0">
                        <form onSubmit={handleSubmitReply} className="flex gap-3">
                            <input
                                type="text"
                                required
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 bg-[#111113] border border-slate-700/50 rounded-full px-5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !replyContent.trim()}
                                className="w-10 h-10 shrink-0 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20"
                            >
                                {isSubmitting ? (
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DiscussionDetailModal;
