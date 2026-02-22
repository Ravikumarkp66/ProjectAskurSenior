const EventEmitter = require('events');
const { delCache } = require('./cache');
const CACHE_KEYS = require('./cacheKeys');

class CacheInvalidator extends EventEmitter { }

const cacheInvalidator = new CacheInvalidator();

/**
 * Cache Invalidation Mapping
 * Defines which keys should be cleared for each event
 */
const INVALIDATION_MAP = {
    'NOTE_UPLOADED': (data) => [
        CACHE_KEYS.NOTES_SUBJECT(data.subjectId),
        CACHE_KEYS.DASHBOARD_SUMMARY
    ],
    'NOTE_DELETED': (data) => [
        CACHE_KEYS.NOTES_SUBJECT(data.subjectId),
        CACHE_KEYS.DASHBOARD_SUMMARY
    ],
    'SUBJECT_UPDATED': (data) => [
        CACHE_KEYS.SUBJECTS_ALL,
        data.branch ? CACHE_KEYS.SUBJECTS_BRANCH(data.branch) : null,
        CACHE_KEYS.DASHBOARD_SUMMARY
    ].filter(Boolean),
    'NOTIFICATION_CREATED': (data) => [
        data.userId ? CACHE_KEYS.NOTIFICATIONS_USER(data.userId) : null,
        CACHE_KEYS.DASHBOARD_SUMMARY
    ].filter(Boolean),
    'FEEDBACK_UPDATED': () => [
        CACHE_KEYS.DASHBOARD_SUMMARY
    ],
    'USER_UPLOAD_APPROVED': (data) => [
        CACHE_KEYS.NOTES_SUBJECT(data.subjectId),
        CACHE_KEYS.DASHBOARD_SUMMARY
    ]
};

// Global Listener for Invalidation Events
Object.keys(INVALIDATION_MAP).forEach(event => {
    cacheInvalidator.on(event, async (data) => {
        const keysToClear = INVALIDATION_MAP[event](data);
        console.log(`[Cache Invalidator] Event: ${event}, Clearing keys:`, keysToClear);

        await Promise.all(keysToClear.map(key => delCache(key)));
    });
});

module.exports = cacheInvalidator;
