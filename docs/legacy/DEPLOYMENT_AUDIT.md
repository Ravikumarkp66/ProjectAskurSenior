# 🔍 MERN Deployment Readiness Audit Report

**Date:** January 29, 2026  
**Project:** AskUrSenior  
**Target:** Frontend (Vercel) + Backend (Render) + DB (MongoDB Atlas)

---

## Executive Summary

| Category | Status | Critical |
|----------|--------|----------|
| Environment Variables | ✅ Fixed | No |
| Hardcoded URLs | ✅ Fixed | Yes |
| CORS Configuration | ✅ Fixed | Yes |
| Error Handling | ✅ Good | No |
| Logging (Dev-only) | ✅ Good | No |
| Build Compatibility | ✅ Good | No |
| Secrets Management | ✅ Fixed | Yes |
| API Configuration | ✅ Fixed | Yes |

---

## Detailed Findings

### 1. ❌ HARDCODED API BASE URL → ✅ FIXED

**Issue:** Frontend had hardcoded `http://localhost:5000/api`  
**Impact:** 404 errors in production (Vercel → Render)

**Before:**
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**After:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**Why it matters:** 
- In development, `/api` works via Vite proxy
- In production, `VITE_API_BASE_URL` env var must point to Render backend
- Without it, frontend calls go to same origin, resulting in 404s

**Action:** Set in Vercel env vars:
```
VITE_API_BASE_URL=https://your-render-url.onrender.com/api
```

---

### 2. ❌ CORS NOT CONFIGURED FOR PRODUCTION → ✅ FIXED

**Issue:** Backend allowed all origins in dev; prod needs explicit `FRONTEND_URL`

**Before:**
```javascript
app.use(cors()); // allows all origins
```

**After:**
```javascript
const corsOptions = process.env.NODE_ENV === 'production'
    ? { origin: process.env.FRONTEND_URL }
    : undefined; // allow all in dev
app.use(cors(corsOptions));
```

**Why it matters:**
- Security: restricts API calls to your frontend origin
- Prevents CORS blocks when Vercel calls Render
- Must set `FRONTEND_URL` in Render env vars

**Action:** Set in Render env vars:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
```

---

### 3. ❌ NO ENV VAR DOCUMENTATION → ✅ FIXED

**Files created:**
- `backend/.env.example` — Backend required vars
- `frontend/.env.example` — Frontend required vars  
- `DEPLOYMENT_GUIDE.md` — Step-by-step deploy instructions

**Why it matters:** Deployers know exactly what env vars to set.

---

### 4. ❌ BACKEND `.env` TRACKED IN GIT → ✅ VERIFIED

**Status:** ✅ Already in `.gitignore`  
**Action:** Keep `.env` locally, never commit (already correct)

---

### 5. ✅ MONGODB CONNECTION HANDLING — GOOD

**Status:** ✅ Uses `process.env.MONGODB_URI`  
**Error handling:** ✅ Exits on connection failure  
**Indexing:** ✅ Proper seed/index handling

No changes needed.

---

### 6. ✅ ERROR HANDLING — GOOD

**Status:** ✅ Try/catch in all controllers  
**Response codes:** ✅ Proper 400/404/500 responses  
**Messages:** ✅ Descriptive error messages

Example:
```javascript
try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
} catch (error) {
    res.status(500).json({ error: error.message });
}
```

No changes needed.

---

### 7. ❌ SEEDING DATABASE ON EVERY STARTUP → ✅ FIXED

**Issue:** `seedDatabase()` ran on every startup, wiping data

**Before:**
```javascript
.then(() => {
    seedDatabase().catch(...); // ALWAYS runs
})
```

**After:**
```javascript
.then(() => {
    if (process.env.NODE_ENV !== 'production') {
        seedDatabase().catch(...); // only in dev
    }
})
```

**Why it matters:** Production won't reset data on each deployment.

---

### 8. ✅ VITE DEV PROXY CONFIGURED — GOOD

**Status:** ✅ Vite proxy routes `/api` to backend  
**Flexibility:** ✅ Can override via `API_PROXY_TARGET` env var

```javascript
proxy: {
    '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true
    }
}
```

No changes needed.

---

### 9. ✅ JWT TOKEN HANDLING — GOOD

**Status:** ✅ Uses `process.env.JWT_SECRET`  
**Expiration:** ✅ 7-day token lifetime  
**Storage:** ✅ Token in `localStorage` (frontend)  
**Transmission:** ✅ Authorization header Bearer token

No changes needed.

---

### 10. ✅ BUILD COMPATIBILITY — GOOD

**Backend:**
- ✅ Uses Node (no build needed)
- ✅ Proper `package.json` with `start` script
- ✅ Entry point: `server.js`

**Frontend:**
- ✅ Vite build: `npm run build`
- ✅ Output directory: `dist/` (Vercel-compatible)
- ✅ No hardcoded asset paths

---

### 11. ✅ LOGGING — GOOD

**Status:** ✅ Minimal `console.log` (only for startup info)

Current console logs:
- `'MongoDB connected successfully'` — ✅ OK (dev/prod)
- `'Server running on port ${PORT}'` — ✅ OK (startup info)
- `'Database seeded successfully!'` — ✅ OK (dev-only)

No excessive logging that would clutter production. ✅

---

### 12. ✅ PROCESS.ENV USAGE — GOOD

All required values use env vars:
- ✅ `PORT` → process.env.PORT || 5000
- ✅ `MONGODB_URI` → process.env.MONGODB_URI
- ✅ `JWT_SECRET` → process.env.JWT_SECRET
- ✅ `FRONTEND_URL` → process.env.FRONTEND_URL
- ✅ `NODE_ENV` → process.env.NODE_ENV
- ✅ `VITE_API_BASE_URL` → import.meta.env.VITE_API_BASE_URL

---

## ✅ Changes Made

### Backend
1. **server.js**
   - Added CORS filtering for production
   - Conditional database seeding (dev-only)

2. **.env.example** (new)
   - Documents required environment variables

### Frontend
1. **src/services/api.js**
   - Use `import.meta.env.VITE_API_BASE_URL` with `/api` fallback
   - Enables dynamic API URL in production

2. **vite.config.js**
   - Allow override of dev proxy target via env var

3. **.env.example** (new)
   - Documents Vercel env var setup

### Documentation
1. **DEPLOYMENT_GUIDE.md** (new)
   - Step-by-step Vercel & Render deployment
   - Environment variable setup for each platform
   - Troubleshooting guide

---

## 🚀 Deployment Checklist

### Before Deploying to Render (Backend)

- [ ] `.env` has valid `MONGODB_URI` (MongoDB Atlas connection string)
- [ ] `.env` has strong `JWT_SECRET` (min 32 chars, random)
- [ ] `.env` has `NODE_ENV=production`
- [ ] `.env` has `FRONTEND_URL=https://your-vercel-url.vercel.app` (after frontend deployed)
- [ ] `npm install` runs without errors
- [ ] `npm start` runs without errors locally

### Before Deploying to Vercel (Frontend)

- [ ] Vercel env var `VITE_API_BASE_URL=https://your-render-url.onrender.com/api`
- [ ] `npm install` runs without errors
- [ ] `npm run build` produces `dist/` folder
- [ ] `npm run preview` works locally (simulates production build)
- [ ] Backend already deployed to Render

### After Deployment

- [ ] Test `/api/health` endpoint on Render
- [ ] Test login/register on Vercel frontend
- [ ] Check browser DevTools Network tab (no 404 on API calls)
- [ ] Update Render `FRONTEND_URL` with Vercel domain (for CORS)
- [ ] Verify CORS works (login should succeed)

---

## 🔐 Security Notes

1. **JWT_SECRET** must be unique, strong, and >= 32 characters
2. **MONGODB_URI** should use Atlas user with minimal privileges
3. **Never commit `.env` files** (already in .gitignore ✅)
4. **CORS restricts to your domain only** in production ✅
5. **Rotate secrets periodically** (quarterly recommended)

---

## ⚡ Performance Notes

- **Render Free Tier:** Spins down after 15 min inactivity. First request takes 30-60 sec.
  - Consider upgrading to paid tier ($7/month) for instant requests.
- **MongoDB Atlas:** Check indexes on `User`, `Subject`, `Progress` collections.
- **Vercel:** Extremely fast globally distributed. No issues expected.

---

## ✅ Conclusion

**Status: READY FOR DEPLOYMENT** 

All critical issues fixed:
- ✅ API URL dynamic (env var)
- ✅ CORS production-safe
- ✅ No hardcoded secrets
- ✅ Database seeding controlled
- ✅ Error handling robust

Follow the **DEPLOYMENT_GUIDE.md** for step-by-step instructions.
