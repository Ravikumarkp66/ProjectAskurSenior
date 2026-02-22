/**
 * Centralized Cache Key Registry
 * Prevents magic strings and ensures consistency across the app
 */

const CACHE_KEYS = {
    // Subject related
    SUBJECTS_ALL: 'subjects:all',
    SUBJECTS_BRANCH: (branch) => `subjects:branch:${branch}`,

    // Notes/Content related
    NOTES_SUBJECT: (subjectId) => `notes:${subjectId}`,

    // Admin/Dashboard related
    DASHBOARD_SUMMARY: 'dashboard:summary',
    ANALYTICS_OVERVIEW: 'analytics:overview',

    // User/Notification related
    NOTIFICATIONS_USER: (userId) => `notifications:${userId}`,
    USER_PROFILE: (userId) => `user:profile:${userId}`
};

module.exports = CACHE_KEYS;
