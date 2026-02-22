const https = require('https');

/**
 * Self-ping utility for Render free tier
 * Keeps the instance awake by pinging its own health endpoint
 */
const startSelfPing = (url) => {
    if (!url) return;

    console.log(`Self-ping started for: ${url}`);

    // Ping every 14 minutes (Render sleeps after 15)
    setInterval(() => {
        https.get(url, (res) => {
            console.log(`Self-ping status: ${res.statusCode} at ${new Date().toISOString()}`);
        }).on('error', (err) => {
            console.error('Self-ping error:', err.message);
        });
    }, 840000);
};

module.exports = { startSelfPing };
