# Environment Setup & Troubleshooting Guide

## 🔧 Environment Configuration

### Backend .env File
Located at: `backend/.env`

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/askursenior

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Environment Variables Explanation

| Variable | Purpose | Default | Production |
|----------|---------|---------|------------|
| `MONGODB_URI` | Database connection string | `mongodb://localhost:27017/askursenior` | Cloud MongoDB URI |
| `JWT_SECRET` | Secret key for JWT signing | Development key | Strong random string (min 32 chars) |
| `PORT` | Server port | 5000 | 3000 or configured port |
| `NODE_ENV` | Environment type | `development` | `production` |

---

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 14.0.0 or higher
- **npm**: 6.0.0 or higher
- **MongoDB**: 4.4 or higher
- **RAM**: 2 GB minimum
- **Disk Space**: 500 MB minimum

### Recommended Requirements
- **Node.js**: 18.0.0 or higher (LTS)
- **npm**: 8.0.0 or higher
- **MongoDB**: 5.0 or higher
- **RAM**: 4 GB or more
- **Disk Space**: 1 GB or more
- **Processor**: Dual-core or higher

---

## 🔍 Verification Commands

### Check Node.js Installation
```bash
node --version
# Expected: v14.0.0 or higher
```

### Check npm Installation
```bash
npm --version
# Expected: 6.0.0 or higher
```

### Check MongoDB Installation
```bash
mongod --version
# Expected: 4.4 or higher
```

### Check MongoDB Connection
```bash
mongosh
# If connected: Successfully connected to MongoDB
# Type: exit
```

---

## 🚀 Installation Steps

### Step 1: Download & Extract
```bash
# Clone from GitHub or download ZIP
cd AskUrSenior
```

### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Make sure MongoDB is running in another terminal
mongod

# Start backend server
npm run dev
# Expected output: Server running on port 5000
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
# Expected output: Local: http://localhost:3000
```

### Step 4: Verify Installation
- Open browser: `http://localhost:3000`
- You should see the login page
- Try registering or logging in

---

## 🐛 Troubleshooting Guide

### Issue 1: MongoDB Connection Error
**Error Message**: `MongooseError: Cannot connect to MongoDB`

**Solutions**:
1. **Start MongoDB**
   ```bash
   # On Windows
   mongod
   
   # On macOS
   brew services start mongodb-community
   
   # On Linux
   sudo service mongod start
   ```

2. **Check MongoDB is Running**
   ```bash
   mongosh
   # Should connect successfully
   ```

3. **Verify Connection String**
   - Check `backend/.env` file
   - Default: `mongodb://localhost:27017/askursenior`
   - Port 27017 is standard MongoDB port

4. **Check Firewall**
   - Allow MongoDB port 27017
   - Disable firewall temporarily for testing

### Issue 2: Port Already in Use

**Error Message**: `EADDRINUSE: address already in use :::5000`

**Solutions**:
1. **Change Port in backend/.env**
   ```env
   PORT=5001
   ```

2. **Find Process Using Port**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -i :5000
   kill -9 <PID>
   ```

3. **Use Different Port**
   ```bash
   PORT=5001 npm run dev
   ```

### Issue 3: npm install Fails

**Error Message**: `npm ERR! code ERESOLVE`

**Solutions**:
1. **Clear npm Cache**
   ```bash
   npm cache clean --force
   ```

2. **Use Legacy Peer Deps** (Last Resort)
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Delete and Reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Update npm**
   ```bash
   npm install -g npm@latest
   ```

### Issue 4: Module Not Found

**Error Message**: `Cannot find module 'express'`

**Solutions**:
1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Check package.json**
   - Ensure all dependencies are listed
   - Run `npm install` again

3. **Verify Directory**
   - Make sure you're in correct directory
   - Check `package.json` exists

### Issue 5: API Connection Error

**Error Message**: `Failed to fetch from http://localhost:5000/api/...`

**Solutions**:
1. **Verify Backend is Running**
   - Check if `npm run dev` is running in terminal
   - Look for "Server running on port 5000"

2. **Check API URL in Frontend**
   - File: `frontend/src/services/api.js`
   - Base URL should match: `http://localhost:5000/api`

3. **Check CORS Configuration**
   - Backend should have CORS enabled
   - Check `backend/server.js` has `cors()` middleware

4. **Check Network Connection**
   - Ensure both services running on same machine
   - Check firewall isn't blocking connection

### Issue 6: Login Not Working

**Error Message**: `Invalid credentials` or `User not found`

**Solutions**:
1. **Verify Database is Seeded**
   - Check MongoDB has data
   - Database seeding happens on first backend startup
   - Create a new account using Register

2. **Check USN Format**
   - Format: `[A-Z]{1,3}\d{2}[A-Z]{2}\d{3}`
   - Example: `VTM22CS001`
   - First 3 chars: letters
   - Next 2 chars: numbers
   - Next 2 chars: letters
   - Last 3 chars: numbers

3. **Verify Credentials**
   - Default USN: `VTM22CS001`
   - Default Password: `password`
   - Select a branch (e.g., CSE)

### Issue 7: Progress Not Updating

**Error Message**: Questions marked but progress doesn't change

**Solutions**:
1. **Check Backend Logs**
   - Look for errors in backend terminal
   - Check database operations

2. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   ```

3. **Refresh Page**
   ```
   F5 or Ctrl+R
   ```

4. **Check Network**
   - Open DevTools (F12)
   - Go to Network tab
   - Mark a question and check request
   - Should return 200 status

### Issue 8: Frontend Won't Start

**Error Message**: `vite compilation error`

**Solutions**:
1. **Clear Cache**
   ```bash
   rm -rf node_modules/.vite
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Node Version**
   ```bash
   node --version  # Should be 14+
   ```

4. **Check Port 3000**
   ```bash
   # Kill process on port 3000
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -i :3000
   kill -9 <PID>
   ```

---

## 📱 Development Workflow

### Terminal Setup (Recommended)
1. **Terminal 1**: MongoDB
   ```bash
   mongod
   ```

2. **Terminal 2**: Backend
   ```bash
   cd backend
   npm run dev
   ```

3. **Terminal 3**: Frontend
   ```bash
   cd frontend
   npm run dev
   ```

4. **Browser**: Open `http://localhost:3000`

---

## 🧪 Testing Your Setup

### Test 1: Backend API
```bash
curl http://localhost:5000/api/health
# Expected: { "message": "Server is running", "timestamp": "..." }
```

### Test 2: MongoDB Connection
```bash
mongosh
show dbs
use askursenior
show collections
```

### Test 3: Frontend Load
```
Open http://localhost:3000 in browser
Should show login page without errors
```

### Test 4: User Registration
1. Go to login page
2. Click "Register"
3. Fill in form:
   - USN: VTM22CS002
   - Email: test@example.com
   - Branch: CSE
   - Password: password
4. Should register and redirect to dashboard

### Test 5: Progress Tracking
1. Login to dashboard
2. Click any subject to expand
3. Click any module to expand
4. Check a question
5. Progress should update in real-time

---

## 🔐 Production Environment Setup

### Backend Production .env
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/askursenior
JWT_SECRET=generate_long_random_string_at_least_32_characters_long
PORT=3000
NODE_ENV=production
```

### Frontend Production
```bash
npm run build
# Creates optimized build in 'dist' folder
```

### Environment Variables Best Practices
- Never commit `.env` to git
- Use strong random strings for JWT_SECRET
- Use different keys for dev and production
- Update variables before deploying
- Use environment management services

---

## 📊 Performance Optimization

### Backend Optimization
- Enable MongoDB indexing
- Use connection pooling
- Implement caching
- Compress responses
- Limit request size

### Frontend Optimization
- Use production build
- Enable gzip compression
- Minify CSS and JavaScript
- Lazy load components
- Cache static assets

---

## 🛡️ Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Update MongoDB connection string
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for frontend domain
- [ ] Enable password requirements
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Regular backups
- [ ] Monitor error logs

---

## 📞 Getting Help

### Check These Files
- [README.md](../README.md) - Feature overview
- [QUICK_START.md](../QUICK_START.md) - Quick setup
- [SETUP.md](../SETUP.md) - Detailed setup
- [TECHNICAL_DOCS.md](../TECHNICAL_DOCS.md) - Technical reference

### Common Fixes
1. Restart MongoDB: `mongod`
2. Restart backend: `npm run dev`
3. Restart frontend: `npm run dev`
4. Clear browser cache: `Ctrl+Shift+Delete`
5. Check port availability: `netstat -ano`

### Error Logs Location
- Backend logs: Terminal where `npm run dev` runs
- Frontend logs: Browser console (F12)
- MongoDB logs: MongoDB terminal
- API logs: Network tab in DevTools (F12)

---

## ✅ Final Verification Checklist

Before deploying, verify:
- [ ] Node.js and npm installed and updated
- [ ] MongoDB installed and running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] .env file configured
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials
- [ ] Progress tracking works
- [ ] Branch switching works
- [ ] No console errors

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: Complete & Ready
