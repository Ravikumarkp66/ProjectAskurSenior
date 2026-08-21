import React from 'react';

/* ── helpers ───────────────────────────────────────────────────────── */
export const timeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(date).toLocaleDateString();
};

const PILLAR_STYLES = {
    ann: {
        bg: 'bg-[#7C3AED]/15',
        border: 'border-[#7C3AED]/30',
        text: 'text-[#A78BFA]',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ),
        label: 'Announcement',
    },
    mkt: {
        bg: 'bg-[#1D9E75]/15',
        border: 'border-[#1D9E75]/30',
        text: 'text-[#34D399]',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
        ),
        label: 'Marketplace',
    },
    lost: {
        bg: 'bg-[#F87171]/15',
        border: 'border-[#F87171]/30',
        text: 'text-[#F87171]',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        label: 'Lost & Found',
    },
};

const CATEGORY_COLORS = {
    exam:      'bg-red-500/10 text-red-400 border-red-500/20',
    placement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    circular:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    update:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sell:      'bg-teal-500/10 text-teal-400 border-teal-500/20',
    buy:       'bg-sky-500/10 text-sky-400 border-sky-500/20',
    service:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    room:      'bg-orange-500/10 text-orange-400 border-orange-500/20',
    lost:      'bg-red-500/10 text-red-400 border-red-500/20',
    found:     'bg-green-500/10 text-green-400 border-green-500/20',
};

const PRIORITY_DOT = {
    high:   'bg-red-400',
    medium: 'bg-amber-400',
    low:    'bg-slate-500',
};

/**
 * HubCard — a single Campus Hub feed item card.
 */
const HubCard = ({ item, onClick }) => {
    const pillar = item.pillar || 'ann';
    const style  = PILLAR_STYLES[pillar] || PILLAR_STYLES.ann;
    const isPinned = item.isPinned;
    const hasPrice = ['sell', 'service', 'room'].includes(item.type) && item.price;
    const createdByName = item.createdBy?.name || 'Unknown';
    const categoryLabel = item.category || item.type || '';

    return (
        <button
            onClick={() => onClick(item)}
            className={[
                'w-full text-left rounded-lg bg-[#161B22] border transition-all duration-150 group',
                'hover:border-[#7C3AED]/40 hover:bg-[#161B22]/80',
                isPinned
                    ? 'border-l-2 border-l-[#7C3AED] border-[#21262D] rounded-l-none'
                    : 'border-[#21262D]',
            ].join(' ')}
        >
            <div className="flex items-start gap-3 p-3.5">
                {/* Icon box */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${style.bg} ${style.border} ${style.text} mt-0.5`}>
                    {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {isPinned && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#A78BFA] bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded px-1.5 py-0.5">
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                                    </svg>
                                    Pinned
                                </span>
                            )}
                            {item.priority && item.priority !== 'medium' && (
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${PRIORITY_DOT[item.priority] || 'bg-slate-500'}`} />
                            )}
                        </div>
                        {hasPrice && (
                            <span className="flex-shrink-0 text-sm font-bold text-[#34D399]">
                                ₹{item.price.toLocaleString()}
                            </span>
                        )}
                    </div>

                    <p className="text-sm font-semibold text-[#E6EDF3] leading-snug truncate mt-0.5">
                        {item.title}
                    </p>

                    <p className="text-xs text-[#8B949E] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>

                    {/* Tag row */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                            {style.label}
                        </span>
                        {categoryLabel && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[categoryLabel] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                {categoryLabel}
                            </span>
                        )}
                        <span className="text-[10px] text-[#8B949E]">{timeAgo(item.createdAt)}</span>
                        <span className="text-[10px] text-[#8B949E]">· {createdByName}</span>
                    </div>
                </div>
            </div>
        </button>
    );
};

export default HubCard;
