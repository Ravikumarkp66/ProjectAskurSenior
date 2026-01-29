# Production Deployment Guide

## Overview
- **Frontend:** Vercel (https://vercel.com)
- **Backend:** Render (https://render.com)
- **Database:** MongoDB Atlas (https://www.mongodb.com/cloud/atlas)

---

## Backend Deployment (Render)

### Prerequisites
1. MongoDB Atlas account with a cluster and connection string
2. GitHub repo (Render auto-deploys on push)

### Steps

1. **Create a Render Web Service**
   - Go to https://dashboard.render.com
   - Click "New Web Service"
   - Connect your GitHub repo
   - Select the repo and main branch

2. **Set Environment Variables in Render**
   In Render's environment settings, add:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/askursenior
   JWT_SECRET=<strong-random-string-at-least-32-chars>
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

3. **Configure Build & Start Commands**
   - Build: `npm install`
   - Start: `npm start`

4. **Deploy**
   - Render auto-deploys on push to main
   - Copy the deployed URL (e.g., `https://askursenior-api.onrender.com`)

---

## Frontend Deployment (Vercel)

### Prerequisites
1. GitHub repo connected to Vercel
2. Backend URL from Render

### Steps

1. **Import Project to Vercel**
   - Go to https://vercel.com/new
   - Select your GitHub repo
   - Select "Next.js" framework (Vite still works)

2. **Set Environment Variables**
   In Vercel project settings → "Environment Variables", add:
   ```
   VITE_API_BASE_URL=https://your-backend-render-url.onrender.com/api
   ```
   Example:
   ```
   VITE_API_BASE_URL=https://askursenior-api.onrender.com/api
   ```

3. **Configure Build Settings**
   - Framework Preset: Other (since it's Vite, not Next.js)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Vercel auto-deploys on push
   - Copy the deployed URL (e.g., `https://askursenior.vercel.app`)

5. **Update Backend FRONTEND_URL**
   Go back to Render and update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
   (This enables CORS from your Vercel domain)

---

## Verify Deployment

1. **Backend Health Check**
   ```
   curl https://your-backend-render-url.onrender.com/api/health
   ```
   Should return: `{"message":"Server is running","timestamp":"..."}`

2. **Test API Endpoint**
   ```bash
   curl -X POST https://your-backend-render-url.onrender.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "usn": "TEST001",
       "email": "test@example.com",
       "password": "test1234",
       "branch": "CS"
     }'
   ```

3. **Frontend Test**
   - Open https://your-vercel-url.vercel.app
   - Check browser DevTools → Network tab
   - Try logging in or registering
   - API calls should succeed (no 404 errors)

---

## Troubleshooting

### 404 on API Calls
- **Check:** Is `VITE_API_BASE_URL` set in Vercel?
- **Check:** Is backend URL correct and reachable?
- **Check:** Render backend running? (free tier spins down after 15 min inactivity)

### CORS Errors
- **Check:** Is `FRONTEND_URL` set correctly in Render?
- **Check:** Vercel domain matches `FRONTEND_URL` exactly

### Database Connection Fails
- **Check:** MongoDB Atlas IP whitelist includes Render IP
- **Check:** `MONGODB_URI` has correct username/password

### Cold Start Delays (Render Free Tier)
- Free tier spins down after 15 min. First request takes 30-60 seconds.
- Upgrade to paid tier to avoid this.

---

## Production Secrets Checklist

- [ ] `JWT_SECRET` is a strong random string (min 32 chars)
- [ ] `MONGODB_URI` has secure password
- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded URLs in code
- [ ] `FRONTEND_URL` matches Vercel domain
- [ ] `VITE_API_BASE_URL` matches Render domain

---

## Rollback

If deployment breaks:

### Vercel
- Go to Deployments tab
- Click a previous successful build
- Click "Redeploy"

### Render
- Go to Deploys tab
- Click a previous successful deploy
- Click "Deploy" button

---

## Next Steps (Optional)

- Set up domain name (custom domain for both)
- Enable auto-redeploy on git push
- Set up monitoring/logging
- Configure email notifications for failed deploys
