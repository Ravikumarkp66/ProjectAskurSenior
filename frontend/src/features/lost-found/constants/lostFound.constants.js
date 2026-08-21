/* ═══════════════════════════════════════════════════════════════════
   LOST & FOUND CONSTANTS
   AskUrSenior Design Tokens & Constants
═══════════════════════════════════════════════════════════════════ */

export const TAB_TYPES = {
    LOST: 'lost',
    FOUND: 'found',
    RESOLVED: 'resolved',
};

export const TABS = [
    { id: TAB_TYPES.LOST, label: 'Lost Items', shortLabel: 'Lost' },
    { id: TAB_TYPES.FOUND, label: 'Found Items', shortLabel: 'Found' },
    { id: TAB_TYPES.RESOLVED, label: 'Resolved Queries', shortLabel: 'Resolved' },
];

export const STATUS_CONFIG = {
    lost: {
        label: 'LOST',
        badgeBg: 'bg-orange-500/10',
        badgeText: 'text-orange-400',
        badgeBorder: 'border-orange-500/25',
        dotColor: '#f97316',
        accentColor: '#f97316',
    },
    found: {
        label: 'FOUND',
        badgeBg: 'bg-emerald-500/10',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/25',
        dotColor: '#10b981',
        accentColor: '#10b981',
    },
    resolved: {
        label: 'RESOLVED',
        badgeBg: 'bg-blue-500/10',
        badgeText: 'text-blue-400',
        badgeBorder: 'border-blue-500/25',
        dotColor: '#3b82f6',
        accentColor: '#3b82f6',
    },
};

export const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
];

export const MOCK_USER_ROLES = {
    STUDENT: 'student',
    POSTER: 'poster',
    ADMIN: 'admin',
};

// Default high quality Unsplash placeholders for campus items
export const SAMPLE_ITEM_IMAGES = {
    default: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80',
};
