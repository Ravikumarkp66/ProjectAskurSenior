// Lightweight In-Memory Map Cache (Zero external dependencies)
const memoryCache = new Map();

const getCache = async (key) => {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
        memoryCache.delete(key);
        return null;
    }
    return cached.value;
};

const setCache = async (key, value, durationSeconds = 300) => {
    memoryCache.set(key, {
        value,
        expiry: Date.now() + (durationSeconds * 1000)
    });
};

const delCache = async (key) => {
    memoryCache.delete(key);
};

module.exports = {
    initRedis: async () => null,
    getCache,
    setCache,
    delCache
};
