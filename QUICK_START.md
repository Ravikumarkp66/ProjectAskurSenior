# AskUrSenior - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 14+ installed
- MongoDB running locally or a MongoDB Atlas account
- Git (optional)

### Step 1: Clone or Download
```bash
cd AskUrSenior
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# The .env file is already configured for local development
# Make sure MongoDB is running on localhost:27017
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### Step 4: Start Both Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Step 5: Access the Application

Open your browser and go to: **http://localhost:3000**

---

## 🔑 Login Credentials

After starting the app, you'll be redirected to the login page. Use these test credentials:

**Register New Account:**
- USN: VTM22CS001 (Format: 3 letters + 2 numbers + 2 letters + 3 numbers)
- Email: student@example.com
- Branch: CSE (dropdown)
- Password: password (minimum 6 characters)

**Or Login with existing:**
- USN: VTM22CS001
- Password: password
- Branch: CSE

---

## 📊 Features to Explore

### 1. Dashboard
- View all 8 subjects for your branch
- See real-time progress percentage
- Overall completion bar at the top

### 2. Subjects
- Click any subject to expand
- View 5 modules within each subject
- Each module contains 5 questions

### 3. Progress Tracking
- Check boxes to mark questions as completed
- Progress updates in real-time
- See progress at multiple levels:
  - Overall (top bar)
  - Subject-wise (on each subject card)
  - Module-wise (inside each module)

### 4. Branch Switching
- Click your branch name in the sidebar
- Select a different branch
- Confirm the switch
- Dashboard reloads with new branch data

### 5. Profile
- Click "Profile" in sidebar
- View your USN, Email, and Current Branch
- Tips for using the app

---

## 📁 Project Structure

```
AskUrSenior/
├── backend/          ← Node.js + Express API
├── frontend/         ← React + Vite app
├── README.md         ← Project overview
├── SETUP.md         ← Detailed setup guide
├── QUICK_START.md   ← This file
└── TECHNICAL_DOCS.md ← Architecture details
```

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Make sure MongoDB is running
- Check connection string in `backend/.env`
- Default: `mongodb://localhost:27017/askursenior`

### Issue: "Port 5000 already in use"
**Solution:**
- Change PORT in `backend/.env` to 5001
- Update API URL in `frontend/src/services/api.js`

### Issue: "Port 3000 already in use"
**Solution:**
- Change port in `frontend/vite.config.js`

### Issue: API requests failing
**Solution:**
- Check backend is running on correct port
- Verify API URLs in frontend match backend
- Check browser console for detailed errors

### Issue: npm install fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📝 Testing the Application

### Test Scenario 1: New User Registration
1. Go to login page
2. Click "Register" tab
3. Fill in USN: VTM22ISE001
4. Email: student2@example.com
5. Branch: ISE
6. Password: password
7. Register and dashboard loads

### Test Scenario 2: Mark Questions Completed
1. Go to dashboard
2. Click on any subject to expand
3. Click on a module dropdown
4. Check some question boxes
5. Observe progress updating

### Test Scenario 3: Branch Switching
1. Click branch name in sidebar (e.g., "CSE")
2. Select "ECE"
3. Confirm switch
4. Dashboard reloads with ECE subjects

### Test Scenario 4: Profile Access
1. Click "Profile" in sidebar
2. View your information
3. See current branch
4. Close modal

---

## 🎨 UI/UX Highlights

- **Modern Dashboard**: Clean, professional layout
- **Real-time Updates**: Progress updates instantly
- **Responsive Design**: Works on different screen sizes
- **Smooth Animations**: Dropdown and expand animations
- **Color-coded Progress**: Visual progress indicators
- **Clear Typography**: Easy-to-read fonts and hierarchy

---

## 📚 10 Branches & Subjects

### 1. CSE (Computer Science & Engineering)
- Data Structures, DBMS, Web Development, AI, OS, Networks, Software Engineering, Cloud Computing

### 2. ISE (Information Science & Engineering)
- Software Testing, QA, System Design, Project Management, Business Analysis, Enterprise Architecture, ITSM, Data Analytics

### 3. ECE (Electronics & Communication Engineering)
- Digital Electronics, Analog Circuits, Microprocessors, Signal Processing, Electromagnetics, Communications, VLSI, Embedded Systems

### 4. EEE (Electrical & Electronics Engineering)
- Power Systems, Electric Machines, Power Electronics, Control Systems, Circuit Analysis, Switchgear, HV Engineering, Distribution

### 5. MECH (Mechanical Engineering)
- Thermodynamics, Fluid Mechanics, Machine Design, Manufacturing, Heat Transfer, CAD/CAM, Vibrations, Automotive Engineering

### 6. CIVIL (Civil Engineering)
- Structural Analysis, Building Construction, Geotechnical, Transportation, Water Resources, Environmental, Surveying, Hydraulics

### 7. AIML (Artificial Intelligence & Machine Learning)
- ML, Deep Learning, NLP, Computer Vision, Reinforcement Learning, Neural Networks, AI Ethics, Robotics

### 8. DS (Data Science)
- Big Data Analytics, Data Mining, Statistics, Visualization, Hadoop, Spark, Business Intelligence, Data Engineering

### 9. CSBS (Cybersecurity & Blockchain)
- Cybersecurity Fundamentals, Network Security, Cryptography, Ethical Hacking, Cloud Security, Blockchain, Protocols, Incident Response

### 10. IT (Information Technology)
- IT Infrastructure, System Administration, Network Administration, Database Admin, ITSM, Virtualization, Disaster Recovery, IT Security

---

## 🚀 Next Steps

1. **Explore the Codebase**
   - Check `TECHNICAL_DOCS.md` for architecture details
   - Review `backend/server.js` for API structure
   - Review `frontend/src/App.jsx` for routing

2. **Customize**
   - Change colors in `frontend/tailwind.config.js`
   - Add more subjects in `backend/utils/seedDatabase.js`
   - Modify API endpoints in `frontend/src/services/api.js`

3. **Deploy**
   - Deploy backend to Railway, Heroku, or your server
   - Deploy frontend to Vercel, Netlify, or GitHub Pages
   - See `SETUP.md` for deployment guide

4. **Extend Features**
   - Add admin panel
   - Implement real-time updates with WebSockets
   - Add discussion forums
   - Create mobile app

---

## 📖 Documentation

- **README.md** - Project overview and features
- **SETUP.md** - Detailed installation and deployment
- **TECHNICAL_DOCS.md** - Architecture and technical details
- **QUICK_START.md** - This file

---

## 💡 Tips & Tricks

- **Speed up development**: Use browser DevTools to debug
- **Test offline**: Use browser DevTools offline mode
- **Clear cache**: Use browser cache clearing for fresh load
- **Toggle dark mode**: (Future feature)
- **Export progress**: (Future feature)

---

## 🤝 Support

If you encounter any issues:
1. Check the documentation files
2. Look at console errors in browser
3. Check backend logs in terminal
4. Verify database connection

---

## 📱 Mobile Support

The app is responsive and works on mobile devices:
- Sidebar becomes hamburger menu
- Cards stack vertically
- Touch-friendly buttons
- Optimized for small screens

---

## ⚡ Performance Tips

1. **Browser**: Use Chrome/Edge for best performance
2. **MongoDB**: Keep database indexed
3. **Frontend**: Clear browser cache if experiencing issues
4. **Backend**: Restart if experiencing slow responses

---

**Happy Learning! 🎓**

For more information, visit the main [README.md](./README.md)
