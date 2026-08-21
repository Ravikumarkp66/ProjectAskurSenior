/* ═══════════════════════════════════════════════════════════════════
   LOST & FOUND UTILS
═══════════════════════════════════════════════════════════════════ */

import { STATUS_CONFIG, SAMPLE_ITEM_IMAGES } from '../constants/lostFound.constants';

/**
 * Format relative time (e.g. "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (dateInput) => {
    if (!dateInput) return 'Recently';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);

    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format full human readable date string (e.g. "08 Aug 2026")
 */
export const formatDateString = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

/**
 * Helper to get badge styling props based on item type/status
 */
export const getStatusStyle = (type, isResolved = false) => {
    if (isResolved || type === 'resolved') {
        return STATUS_CONFIG.resolved;
    }
    return STATUS_CONFIG[type] || STATUS_CONFIG.lost;
};

/**
 * Get fallback sample image if custom image fails or is missing
 */
export const getImageFallback = () => {
    return SAMPLE_ITEM_IMAGES.default;
};

/**
 * Filter items by active tab, search query, and sort order
 */
export const filterLostFoundItems = (items = [], { tab, search, sort }) => {
    return items.filter(item => {
        // Tab filtering
        if (tab === 'resolved') {
            if (item.status !== 'resolved' && !item.isResolved) return false;
        } else if (tab === 'lost') {
            if (item.type !== 'lost' || item.status === 'resolved' || item.isResolved) return false;
        } else if (tab === 'found') {
            if (item.type !== 'found' || item.status === 'resolved' || item.isResolved) return false;
        }

        // Search query filtering
        if (search && search.trim() !== '') {
            const query = search.toLowerCase().trim();
            const titleMatch = item.title?.toLowerCase().includes(query);
            const descMatch = item.description?.toLowerCase().includes(query);
            const locMatch = item.location?.toLowerCase().includes(query);
            const userMatch = item.postedBy?.name?.toLowerCase().includes(query);
            if (!titleMatch && !descMatch && !locMatch && !userMatch) return false;
        }

        return true;
    }).sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return sort === 'oldest' ? dateA - dateB : dateB - dateA;
    });
};
