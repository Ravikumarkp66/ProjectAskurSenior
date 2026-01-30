const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
    if (redisClient && isConnected) {
        return redisClient;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
            isConnected = true;
        });

        redisClient.on('disconnect', () => {
            console.log('Redis disconnected');
            isConnected = false;
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.error('Failed to connect to Redis:', error.message);
        return null;
    }
};

const getRedisClient = () => {
    return isConnected ? redisClient : null;
};

// Cache helper functions
const CACHE_TTL = {
    SUBJECTS_BY_BRANCH: 86400, // 24 hours
    SUBJECT_DETAIL: 86400,     // 24 hours
    FEEDBACK_STATS: 3600       // 1 hour
};

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
const getCache = async (key) => {
    const client = getRedisClient();
    if (!client) return null;

    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis GET error:', error.message);
        return null;
    }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
const setCache = async (key, data, ttl = 3600) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
        await client.setEx(key, ttl, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Redis SET error:', error.message);
        return false;
    }
};

/**
 * Delete cache by key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
const deleteCache = async (key) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
        await client.del(key);
        return true;
    } catch (error) {
        console.error('Redis DEL error:', error.message);
        return false;
    }
};

/**
 * Delete cache by pattern (e.g., 'subjects:*')
 * @param {string} pattern - Key pattern
 * @returns {Promise<boolean>} - Success status
 */
const deleteCacheByPattern = async (pattern) => {
    const client = getRedisClient();
    if (!client) return false;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
        return true;
    } catch (error) {
        console.error('Redis DEL pattern error:', error.message);
        return false;
    }
};

// Cache key generators
const cacheKeys = {
    subjectsByBranch: (branch, cycle) => `subjects:${branch}:${cycle || 'all'}`,
    subjectDetail: (subjectId) => `subject:${subjectId}`,
    feedbackStats: () => 'feedback:stats',
    allFeedback: () => 'feedback:all'
};

module.exports = {
    connectRedis,
    getRedisClient,
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
    cacheKeys,
    CACHE_TTL
};
