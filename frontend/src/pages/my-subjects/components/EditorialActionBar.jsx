import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Check, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * EditorialActionBar
 * 
 * Unified single-row footer toolbar matching CS study-sheet aesthetic.
 * - Prev & Next navigation arrows only
 * - "Mark as completed" toggle box
 * - Like / Dislike reaction icons
 * All in one row!
 */
const getTopicBaseLikes = (topicSlug) => {
    const map = {
        'before-you-start': 24,
        'why-programming': 31,
        'common-myths': 42,
        'no-coding-background': 37,
        'how-to-learn': 29,
        'how-to-practice': 35,
        'using-askursenior': 26
    };
    if (topicSlug && map[topicSlug]) return map[topicSlug];
    let hash = 0;
    const str = String(topicSlug || 'topic');
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return 15 + Math.abs(hash % 25);
};

const EditorialActionBar = ({
    subjectSlug = '',
    moduleSlug = '',
    topicSlug = '',
    topicTitle = '',
    prevTopic = null,
    nextTopic = null,
    onSelectPrevTopic = null,
    onSelectNextTopic = null,
    isCompleted = false,
    onToggleCompletion = null,
    isDark = false
}) => {
    const storageKey = `ask_editorial_${subjectSlug}_${moduleSlug}_${topicSlug}`;

    const c = isDark ? {
        barBg: '#222222',
        barBorder: '#2F2F2F',
        barShadow: '0 1px 4px rgba(0, 0, 0, 0.2)',
        btnColor: '#858585',
        btnHoverColor: '#EDEDED',
        likeColor: '#4ADE80',
        likeBg: 'rgba(74, 222, 128, 0.1)',
        dislikeColor: '#F87171',
        dislikeBg: 'rgba(248, 113, 113, 0.1)',
        toastBg: '#242424',
        toastColor: '#E0E0E0',
        toastBorder: '#383838'
    } : {
        barBg: '#FFFFFF',
        barBorder: '#E2E4E8',
        barShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        btnColor: '#57606A',
        btnHoverColor: '#1F242D',
        likeColor: '#059669',
        likeBg: 'rgba(16, 185, 129, 0.12)',
        dislikeColor: '#DC2626',
        dislikeBg: 'rgba(239, 68, 68, 0.12)',
        toastBg: '#FFFFFF',
        toastColor: '#1F242D',
        toastBorder: '#E5E7EB'
    };

    // Persistent reaction state (like, dislike, or null)
    const [reaction, setReaction] = useState(() => {
        try {
            const saved = localStorage.getItem(`${storageKey}_reaction`);
            return saved || null;
        } catch (e) {
            return null;
        }
    });

    // Like count state (increments when liked, no increment for dislike)
    const [likeCount, setLikeCount] = useState(() => {
        const base = getTopicBaseLikes(topicSlug);
        try {
            const saved = localStorage.getItem(`${storageKey}_reaction`);
            return base + (saved === 'like' ? 1 : 0);
        } catch (e) {
            return base;
        }
    });

    // Sync reaction and like count when topic changes
    useEffect(() => {
        const base = getTopicBaseLikes(topicSlug);
        try {
            const savedReaction = localStorage.getItem(`${storageKey}_reaction`);
            setReaction(savedReaction || null);
            setLikeCount(base + (savedReaction === 'like' ? 1 : 0));
        } catch (e) {
            setReaction(null);
            setLikeCount(base);
        }
    }, [storageKey, topicSlug]);

    const handleReaction = (type) => {
        if (type === 'like') {
            if (reaction === 'like') {
                // Untoggle like
                setReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
                try {
                    localStorage.removeItem(`${storageKey}_reaction`);
                } catch (e) {}
            } else {
                // Like clicked
                setReaction('like');
                setLikeCount(prev => prev + 1);
                try {
                    localStorage.setItem(`${storageKey}_reaction`, 'like');
                } catch (e) {}
                toast.success('Thanks for your feedback!', {
                    duration: 2000,
                    style: {
                        background: c.toastBg,
                        color: c.toastColor,
                        border: `1px solid ${c.toastBorder}`,
                        fontSize: '12px'
                    }
                });
            }
        } else if (type === 'dislike') {
            // Dislike clicked: "don't increment for dislike button!! just take it!!"
            if (reaction === 'dislike') {
                // Untoggle dislike
                setReaction(null);
                try {
                    localStorage.removeItem(`${storageKey}_reaction`);
                } catch (e) {}
            } else {
                // If user was previously liking, decrement that like back
                if (reaction === 'like') {
                    setLikeCount(prev => Math.max(0, prev - 1));
                }
                setReaction('dislike');
                try {
                    localStorage.setItem(`${storageKey}_reaction`, 'dislike');
                } catch (e) {}
                toast.success('Feedback noted.', {
                    duration: 2000,
                    style: {
                        background: c.toastBg,
                        color: c.toastColor,
                        border: `1px solid ${c.toastBorder}`,
                        fontSize: '12px'
                    }
                });
            }
        }
    };

    return (
        <div 
            className="w-full max-w-[760px] min-h-[40px] px-2 sm:px-3 py-1 rounded-md flex items-center justify-between select-none text-xs font-mono gap-1 sm:gap-2"
            style={{
                background: c.barBg,
                border: `1px solid ${c.barBorder}`,
                boxShadow: c.barShadow
            }}
        >
            {/* ── Left: Like (with count) / Dislike (icon only) ── */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Thumbs Up + Like Count */}
                <button
                    type="button"
                    onClick={() => handleReaction('like')}
                    className="px-1.5 sm:px-2 py-1 rounded transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5"
                    style={{
                        color: reaction === 'like' ? c.likeColor : c.btnColor,
                        background: reaction === 'like' ? c.likeBg : 'transparent'
                    }}
                    title="Helpful"
                >
                    <ThumbsUp size={14} className={reaction === 'like' ? 'fill-current' : ''} />
                    <span className="text-[11px] sm:text-[11.5px] font-sans font-medium tabular-nums select-none">
                        {likeCount}
                    </span>
                </button>

                {/* Thumbs Down (No count displayed or incremented - just take feedback) */}
                <button
                    type="button"
                    onClick={() => handleReaction('dislike')}
                    className="p-1 sm:p-1.5 rounded transition-colors cursor-pointer flex items-center justify-center"
                    style={{
                        color: reaction === 'dislike' ? c.dislikeColor : c.btnColor,
                        background: reaction === 'dislike' ? c.dislikeBg : 'transparent'
                    }}
                    title="Not helpful"
                >
                    <ThumbsDown size={14} className={reaction === 'dislike' ? 'fill-current' : ''} />
                </button>
            </div>

            {/* ── Center: Mark as Completed Box ── */}
            {onToggleCompletion && (
                <button
                    type="button"
                    onClick={onToggleCompletion}
                    className="px-2.5 sm:px-3 py-1 rounded text-[11px] sm:text-[12.5px] font-sans font-medium transition-all cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 border select-none shrink-0"
                    style={{
                        background: isCompleted 
                            ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5') 
                            : (isDark ? '#262626' : '#F6F7F9'),
                        borderColor: isCompleted 
                            ? (isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0') 
                            : (isDark ? '#383838' : '#D1D5DB'),
                        color: isCompleted 
                            ? (isDark ? '#34D399' : '#065F46') 
                            : (isDark ? '#C8C8C8' : '#374151')
                    }}
                    title={isCompleted ? "Click to mark as incomplete" : "Mark topic as completed"}
                >
                    {isCompleted ? (
                        <>
                            <Check size={12} strokeWidth={2.5} style={{ color: isDark ? '#34D399' : '#059669' }} />
                            <span>Completed</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={12} style={{ color: isDark ? '#888888' : '#6B7280' }} />
                            <span>Mark as completed</span>
                        </>
                    )}
                </button>
            )}

            {/* ── Right: Prev & Next Arrows Only ── */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                    type="button"
                    onClick={() => {
                        if (prevTopic && onSelectPrevTopic) {
                            onSelectPrevTopic();
                            const mainEl = document.querySelector('main');
                            if (mainEl) mainEl.scrollTop = 0;
                            window.scrollTo(0, 0);
                        }
                    }}
                    disabled={!prevTopic || !onSelectPrevTopic}
                    className={`p-1.5 rounded transition-colors flex items-center justify-center ${
                        prevTopic && onSelectPrevTopic 
                            ? (isDark ? 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-white/5 cursor-pointer' : 'text-[#57606A] hover:text-[#1F242D] hover:bg-black/5 cursor-pointer')
                            : (isDark ? 'text-[#555555] opacity-35 cursor-not-allowed' : 'text-[#CBD5E1] opacity-40 cursor-not-allowed')
                    }`}
                    title={prevTopic ? `Previous: ${prevTopic.displayLabel || prevTopic.title}` : 'No previous topic'}
                >
                    <ChevronLeft size={16} strokeWidth={2.2} />
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (nextTopic && onSelectNextTopic) {
                            onSelectNextTopic();
                            const mainEl = document.querySelector('main');
                            if (mainEl) mainEl.scrollTop = 0;
                            window.scrollTo(0, 0);
                        }
                    }}
                    disabled={!nextTopic || !onSelectNextTopic}
                    className={`p-1.5 rounded transition-colors flex items-center justify-center ${
                        nextTopic && onSelectNextTopic 
                            ? (isDark ? 'text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-white/5 cursor-pointer' : 'text-[#57606A] hover:text-[#1F242D] hover:bg-black/5 cursor-pointer')
                            : (isDark ? 'text-[#555555] opacity-35 cursor-not-allowed' : 'text-[#CBD5E1] opacity-40 cursor-not-allowed')
                    }`}
                    title={nextTopic ? `Next: ${nextTopic.displayLabel || nextTopic.title}` : 'No next topic'}
                >
                    <ChevronRight size={16} strokeWidth={2.2} />
                </button>
            </div>
        </div>
    );
};

export default EditorialActionBar;
