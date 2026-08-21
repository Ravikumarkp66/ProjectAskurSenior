// Helper utilities for AskFinder & Study Materials

export const formatFileSize = (bytes) => {
    if (!bytes) return '0.00 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export const getTimeAgo = (date) => {
    if (!date) return 'Recently';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};
