import React, { useEffect, useState } from 'react';
import { campusHubAPI } from '../../services/api';

/**
 * HubNavDot — a purple dot shown next to "Campus Hub" nav text
 * when there are pinned announcements the user hasn't viewed.
 * Refetches every 5 minutes.
 */
const HubNavDot = () => {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try {
            const res = await campusHubAPI.getUnreadCount();
            setCount(res.data.count || 0);
        } catch {
            // silently fail — nav dot is non-critical
        }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-[#7C3AED] ml-1 align-middle"
            title={`${count} unread pinned announcement${count !== 1 ? 's' : ''}`}
        />
    );
};

export default HubNavDot;
