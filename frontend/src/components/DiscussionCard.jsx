import React from 'react';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
    Question: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
    Doubt: { bg: 'rgba(167,139,250,0.1)', text: '#A78BFA', border: 'rgba(167,139,250,0.2)' },
    Exam: { bg: 'rgba(245,158,11,0.1)', text: '#FBBF24', border: 'rgba(245,158,11,0.2)' },
    Resource: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', border: 'rgba(16,185,129,0.2)' },
    Notes: { bg: 'rgba(236,72,153,0.1)', text: '#F472B6', border: 'rgba(236,72,153,0.2)' },
    General: { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', border: 'rgba(148,163,184,0.2)' }
};

const DiscussionCard = ({ discussion, onClick }) => {
    const { title, category, repliesCount, createdAt, pinned, isAnswered } = discussion;
    const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} Hour${hours > 1 ? 's' : ''} Ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return `${days} Days Ago`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, background: 'rgba(255,255,255,0.03)' }}
            onClick={onClick}
            className="cursor-pointer border p-4 rounded-xl flex flex-col gap-3 transition-all duration-200"
            style={{ 
                background: 'rgba(255,255,255,0.01)', 
                borderColor: pinned ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)' 
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {pinned && (
                        <span className="text-[12px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-purple-500/30">
                            📌 Pinned
                        </span>
                    )}
                    {isAnswered && (
                        <span className="text-[12px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-500/30">
                            ✓ Answered
                        </span>
                    )}
                    <span 
                        className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                        style={{ background: catColor.bg, color: catColor.text, borderColor: catColor.border }}
                    >
                        {category}
                    </span>
                </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">
                {title}
            </h3>

            <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <span>{repliesCount} Repl{repliesCount === 1 ? 'y' : 'ies'}</span>
                </div>
                <span className="text-[11px] text-slate-500">{timeAgo(createdAt)}</span>
            </div>
        </motion.div>
    );
};

export default DiscussionCard;
