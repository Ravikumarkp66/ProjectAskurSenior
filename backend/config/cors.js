/**
 * Centralized CORS Configuration
 * 
 * Dynamically resolves allowed origins from environment variables:
 * - process.env.FRONTEND_URL (supports single URL or comma-separated list of URLs)
 * - process.env.ALLOWED_ORIGINS (optional additional comma-separated list)
 * - Retains standard localhost/127.0.0.1 ports for local development
 * 
 * Deployment domains (production/staging/preview) are managed strictly via FRONTEND_URL.
 */

const LOCAL_DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:4173'
];

/**
 * Dynamically compute allowed origins array from environment variables
 * @returns {string[]} Normalized list of allowed origins
 */
function getAllowedOrigins() {
    const envFrontendUrl = process.env.FRONTEND_URL || '';
    const envAllowedOrigins = process.env.ALLOWED_ORIGINS || '';

    // Split comma-separated URLs, strip quotes, trim whitespace and trailing slashes
    const parsedFromEnv = [envFrontendUrl, envAllowedOrigins]
        .join(',')
        .split(',')
        .map(url => url.replace(/['"]/g, '').trim().replace(/\/+$/, ''))
        .filter(Boolean);

    // Combine environment origins with local development origins (deduplicated)
    const combined = new Set([
        ...parsedFromEnv,
        ...LOCAL_DEVELOPMENT_ORIGINS
    ]);

    return Array.from(combined);
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, Postman)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/+$/, '');
        const allowed = getAllowedOrigins();

        if (allowed.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // In non-production environments, allow origin for flexible local testing
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // In production / staging mode, reject unapproved origins
        console.warn(`[CORS] Blocked unauthorized origin: "${origin}". Configured allowed origins: [${allowed.join(', ')}]`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Disposition'],
    optionsSuccessStatus: 200
};

module.exports = {
    getAllowedOrigins,
    get allowedOrigins() {
        return getAllowedOrigins();
    },
    corsOptions
};
