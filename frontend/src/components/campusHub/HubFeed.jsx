import React, { useEffect, useRef, useState, useCallback } from 'react';
import { campusHubAPI } from '../../services/api';
import HubCard from './HubCard';

/**
 * HubFeed — paginated, searchable, sortable list of Campus Hub items.
 */
const HubFeed = ({ tab, search, sort, onSelect, refreshKey }) => {
    const [items, setItems]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [hasMore, setHasMore]   = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError]       = useState('');

    const fetchFeed = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        setError('');
        try {
            const res = await campusHubAPI.getFeed({ tab, search, sort, page: pageNum, limit: 20 });
            const { items: newItems, hasMore: more } = res.data;
            setItems(prev => append ? [...prev, ...newItems] : newItems);
            setHasMore(more);
        } catch {
            setError('Failed to load feed. Please try again.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [tab, search, sort]);

    // Re-fetch when tab/search/sort changes
    useEffect(() => {
        setPage(1);
        fetchFeed(1, false);
    }, [fetchFeed, refreshKey]);

    const loadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchFeed(next, true);
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg bg-[#161B22] border border-[#21262D] p-3.5 flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-lg bg-[#21262D] flex-shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-[#21262D] rounded w-3/4" />
                            <div className="h-3 bg-[#21262D] rounded w-full" />
                            <div className="h-3 bg-[#21262D] rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <p className="text-[#8B949E] text-sm">{error}</p>
                <button
                    onClick={() => fetchFeed(1)}
                    className="mt-3 text-xs text-[#A78BFA] hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-[#161B22] border border-[#21262D] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#8B949E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <p className="text-[#8B949E] text-sm font-medium">Nothing here yet</p>
                <p className="text-[#8B949E]/60 text-xs mt-1">Be the first to post in this section</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {items.map(item => (
                <HubCard key={item._id} item={item} onClick={onSelect} />
            ))}

            {hasMore && (
                <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 text-sm text-[#8B949E] hover:text-[#E6EDF3] bg-[#161B22] border border-[#21262D] rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                    {loadingMore ? 'Loading…' : 'Load more'}
                </button>
            )}
        </div>
    );
};

export default HubFeed;
