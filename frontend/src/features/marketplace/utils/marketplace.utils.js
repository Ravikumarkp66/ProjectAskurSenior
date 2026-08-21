/* ═══════════════════════════════════════════════════════════════════
   MARKETPLACE UTILS
═══════════════════════════════════════════════════════════════════ */

import { CONDITIONS, SAMPLE_MARKETPLACE_IMAGES } from '../constants/marketplace.constants';

/**
 * Format Indian Rupee Currency String (e.g. 250 -> ₹250, 1200 -> ₹1,200)
 */
export const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price);
};

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
 * Get condition badge styling config
 */
export const getConditionStyle = (conditionId) => {
    return CONDITIONS.find(c => c.id === conditionId) || CONDITIONS[2]; // Default GOOD
};

/**
 * Fallback image helper
 */
export const getImageFallback = (category) => {
    return SAMPLE_MARKETPLACE_IMAGES[category] || SAMPLE_MARKETPLACE_IMAGES.default;
};

/**
 * Filter marketplace items by active category, search query, condition, price range, and sort
 */
export const filterMarketplaceItems = (items = [], { category, search, conditions = [], minPrice = 0, maxPrice = Infinity, sort }) => {
    return items.filter(item => {
        // Category filter
        if (category && category !== 'all') {
            if (item.category !== category) return false;
        }

        // Condition filter
        if (conditions.length > 0) {
            if (!conditions.includes(item.condition)) return false;
        }

        // Price range filter
        const price = Number(item.price) || 0;
        if (price < minPrice || price > maxPrice) return false;

        // Search query filter
        if (search && search.trim() !== '') {
            const query = search.toLowerCase().trim();
            const titleMatch = item.title?.toLowerCase().includes(query);
            const descMatch = item.description?.toLowerCase().includes(query);
            const catMatch = item.category?.toLowerCase().includes(query);
            const sellerMatch = item.seller?.name?.toLowerCase().includes(query);
            const locMatch = item.location?.toLowerCase().includes(query);
            if (!titleMatch && !descMatch && !catMatch && !sellerMatch && !locMatch) return false;
        }

        return true;
    }).sort((a, b) => {
        if (sort === 'price_low') {
            return (Number(a.price) || 0) - (Number(b.price) || 0);
        }
        if (sort === 'price_high') {
            return (Number(b.price) || 0) - (Number(a.price) || 0);
        }
        // Default newest
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB - dateA;
    });
};
