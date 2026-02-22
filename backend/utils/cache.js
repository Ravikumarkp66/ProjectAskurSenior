const redis = require('redis');

let redisClient = null;

/**
 * Optimized Redis Initialization for Vercel Serverless
 * Ensures singleton connection across function invocations
 */
const getRedisClient = async () => {
    if (process.env.REDIS_ENABLED !== 'true') return null;

    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
            }
        });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));

        await redisClient.connect();
        console.log('Connected to Redis (Serverless Singleton)');
        return redisClient;
    } catch (err) {
        console.error('Redis connection failed:', err.message);
        redisClient = null;
        return null;
    }
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
