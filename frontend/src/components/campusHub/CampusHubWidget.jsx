import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campusHubAPI } from '../../services/api';
import { timeAgo } from '../campusHub/HubCard';

const PILLAR_DOT = {
    ann:  'bg-[#7C3AED]',
    mkt:  'bg-[#1D9E75]',
    lost: 'bg-[#F87171]',
};

/**
 * CampusHubWidget — compact dashboard card showing today's pinned
 * announcement and the 2 most recent marketplace/lost posts.
 */
const CampusHubWidget = () => {
    const navigate = useNavigate();
    const [items, setItems]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        campusHubAPI.getFeed({ limit: 3, sort: 'pinned' })
            .then(res => setItems(res.data.items || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pinned  = items.find(i => i.isPinned && i.pillar === 'ann');
    const theRest = items.filter(i => i !== pinned).slice(0, 2);

    return (
        <div className="bg-[#161B22] border border-[#21262D] rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#E6EDF3] uppercase tracking-wider">
                    Today in Campus Hub
                </p>
                <button
                    onClick={() => navigate('/campus-hub')}
                    className="text-[10px] text-[#A78BFA] hover:text-[#7C3AED] font-semibold transition-colors"
                >
                    Open →
                </button>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-2 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-[#21262D] mt-1.5 flex-shrink-0" />
                            <div className="flex-1 h-3 bg-[#21262D] rounded" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <p className="text-xs text-[#8B949E] text-center py-4">Nothing posted yet today</p>
            ) : (
                <div className="space-y-2">
                    {/* Pinned announcement — prominent */}
                    {pinned && (
                        <div
                            onClick={() => navigate('/campus-hub')}
                            className="cursor-pointer rounded-lg bg-[#7C3AED]/8 border border-[#7C3AED]/20 p-3 hover:border-[#7C3AED]/40 transition-colors"
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                                <span className="text-[9px] font-bold text-[#A78BFA] uppercase tracking-widest">Pinned</span>
                            </div>
                            <p className="text-xs font-semibold text-[#E6EDF3] leading-snug line-clamp-2">
                                {pinned.title}
                            </p>
                            <p className="text-[10px] text-[#8B949E] mt-1">{timeAgo(pinned.createdAt)}</p>
                        </div>
                    )}

                    {/* Rest */}
                    {theRest.map(item => (
                        <div
                            key={item._id}
                            onClick={() => navigate('/campus-hub')}
                            className="flex items-start gap-2 cursor-pointer group"
                        >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PILLAR_DOT[item.pillar] || 'bg-[#8B949E]'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#E6EDF3] group-hover:text-white transition-colors truncate">
                                    {item.title.length > 50 ? item.title.slice(0, 50) + '…' : item.title}
                                </p>
                                <p className="text-[10px] text-[#8B949E]">{timeAgo(item.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-[#21262D]">
                <button
                    onClick={() => navigate('/campus-hub')}
                    className="w-full text-center text-[11px] text-[#8B949E] hover:text-[#A78BFA] transition-colors font-medium"
                >
                    Open Campus Hub →
                </button>
            </div>
        </div>
    );
};

export default CampusHubWidget;
