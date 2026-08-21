# Deployment Optimization Guide

## 1️⃣ Eliminate Render Cold Starts
Render's free tier spins down after 15 minutes of inactivity. Use a "Keep-Alive" ping to prevent this.

### Option A: Cron Job (Recommended)
Set up a free cron job on [cron-job.org](https://cron-job.org/) or [healthchecks.io](https://healthchecks.io/) to ping your health check endpoint every 10 minutes:
`https://your-api-url.onrender.com/api/health`

### Option B: Self-Ping (server.js)
Add this to your `server.js` (Note: This only works if the server is already awake):
```javascript
setInterval(() => {
  https.get('https://your-api-url.onrender.com/api/health');
}, 600000); // Every 10 minutes
```

## 2️⃣ Backend Region Pinning
Ensure your Backend and MongoDB are in the same region (e.g., `us-east-1` for Render and MongoDB Atlas). This reduces latency by 50-100ms.

## 3️⃣ Cloudflare CDN Setup
Adding Cloudflare in front of your Render backend provides:
- Edge Caching (Reduced latency for static assets/API responses)
- Automatic SSL/TLS optimization
- DDoS Protection

### Steps:
1. Point your domain to Cloudflare Nameservers.
2. In Cloudflare Dashboard, set **SSL/TLS** to "Full (Strict)".
3. Add a **Page Rule** for `/api/*` to set "Cache Level" to "Bypass" (for dynamic data) or "Cache Everything" with a low TTL for semi-static data.
4. Enable **Brotli** and **Rocket Loader** in the Speed tab.

## 4️⃣ Production Configuration Checklist
- [ ] `NODE_ENV=production`
- [ ] `REDIS_ENABLED=true` (if using Redis)
- [ ] `COMPRESSION_LEVEL=6` (default for compression middleware)
- [ ] MongoDB Indexes Applied (run `node utils/createIndexes.js`)
