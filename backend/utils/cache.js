const redis = require('redis');

let redisClient = null;

/**
 * Optimized Redis Initialization for Vercel Serverless
 * Ensures singleton connection across function invocations
 */
const getRedisClient = async () => {
    // Redis disabled to resolve UX failure/latency issues
    return null;
};

const getCache = async (key) => {
    const client = await getRedisClient();
    if (!client) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        return null;
    }
};

const setCache = async (key, value, duration = 3600) => {
    const client = await getRedisClient();
    if (!client) return;
    try {
        await client.set(key, JSON.stringify(value), { EX: duration });
    } catch (err) {
        console.error('Redis set error:', err);
    }
};

const delCache = async (key) => {
    const client = await getRedisClient();
    if (!client) return;
    try {
        await client.del(key);
    } catch (err) {
        console.error('Redis del error:', err);
    }
};

module.exports = { initRedis: getRedisClient, getCache, setCache, delCache };
