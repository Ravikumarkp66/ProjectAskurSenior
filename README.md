# AskUrSenior - Academic Tracking Platform 🎓

A comprehensive student academic tracking platform for college students to manage their coursework across different engineering branches with real-time progress monitoring.

## ✨ Key Features

### 🔐 Secure Authentication
- Student registration with USN validation
- Secure JWT-based authentication
- Branch-based access control
- Session management with 7-day token expiry

### 📊 Academic Tracking
- **10 Engineering Branches**: CSE, ISE, ECE, EEE, MECH, CIVIL, AIML, DS, CSBS, IT
- **8 Subjects per Branch**: Each with specific course content
- **5 Modules per Subject**: Organized curriculum structure
- **25 Questions per Subject**: Practice and assessment

### 📈 Real-time Progress Monitoring
- **Overall Progress Bar**: Track completion percentage across all subjects
- **Subject-wise Progress**: Individual progress for each subject
- **Module-wise Tracking**: Progress within each module
- **Question-level Completion**: Mark questions as completed
- **Live Updates**: Progress updates instantly as you work

### 🔄 Branch Management
- Switch between branches anytime
- Maintain separate progress for each branch
- Confirmation dialog prevents accidental switches
- Data persists across sessions

### 🎨 Professional Dashboard
- Modern, clean UI with Tailwind CSS
- Responsive design for all devices
- Smooth animations and transitions
- Intuitive navigation
- Dark theme ready

## 📁 Project Structure

```
AskUrSenior/
├── backend/                    # Node.js + Express API
│   ├── models/                # MongoDB schemas
│   ├── controllers/           # Business logic
│   ├── routes/               # API endpoints
│   ├── middleware/           # Authentication & validation
│   ├── utils/                # Helper functions
│   ├── server.js             # Express setup
│   └── package.json
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context
│   │   ├── services/        # API services
│   │   ├── utils/           # Utilities & hooks
│   │   └── App.jsx
│   └── package.json
│
├── README.md                  # This file
├── SETUP.md                  # Setup instructions
├── QUICK_START.md           # 5-minute quick start
└── TECHNICAL_DOCS.md        # Architecture documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MongoDB (local or cloud)
- npm or yarn

### 5-Minute Setup

**Backend:**
```bash
cd backend
npm install
npm run dev  # Starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

Then open http://localhost:3000 in your browser!

### Test Credentials
- **USN**: VTM22CS001
- **Password**: password
- **Branch**: CSE (or any branch)

For detailed setup, see [QUICK_START.md](./QUICK_START.md)

## 💻 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🔧 Features in Detail

### Authentication System
```javascript
// Register
POST /api/auth/register
{ usn, email, password, branch }

// Login
POST /api/auth/login
{ usn, password, branch }

// Get Profile
GET /api/auth/profile (Protected)

// Switch Branch
POST /api/auth/switch-branch (Protected)
{ newBranch }
```

### Subject Management
```javascript
// Get Subjects by Branch
GET /api/subjects/branch/:branch

// Get Subject Details
GET /api/subjects/:subjectId

// Mark Question Complete
POST /api/subjects/question/complete
{ subjectId, moduleNumber, questionId }
```

### Progress Tracking
```javascript
// Get Overall Progress
GET /api/progress

// Get Branch Progress
GET /api/progress/branch/:branch
```

## 📚 Branch Information

### Engineering Branches (10 Total)

| Branch | Specialization | Example Subjects |
|--------|---|---|
| **CSE** | Computer Science | Data Structures, DBMS, Web Dev, AI |
| **ISE** | Information Science | Software Testing, Business Analysis |
| **ECE** | Electronics | Digital Electronics, Signal Processing |
| **EEE** | Electrical | Power Systems, Control Systems |
| **MECH** | Mechanical | Thermodynamics, Machine Design |
| **CIVIL** | Civil | Structural Analysis, Water Resources |
| **AIML** | AI & ML | ML, Deep Learning, NLP, Computer Vision |
| **DS** | Data Science | Big Data, Data Mining, Visualization |
| **CSBS** | Cybersecurity | Network Security, Cryptography, Blockchain |
| **IT** | Information Technology | Infrastructure, System Admin, Network Admin |

## 🏗️ Architecture

### Authentication Flow
1. User registers with USN, Email, Password, Branch
2. Password hashed with bcryptjs
3. JWT token generated on login
4. Token stored in localStorage
5. All API requests include Authorization header

### Progress Calculation
1. Questions tracked at module level
2. Module progress calculated from questions
3. Subject progress aggregated from modules
4. Overall progress is sum of all subject progress
5. Real-time updates via optimistic UI updates

### Data Persistence
- MongoDB stores all user data
- Progress syncs in real-time
- Branch-specific progress maintained separately
- Historical data preserved across sessions

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **USN Validation**: Regex pattern validation
- **CORS**: Cross-origin resource sharing configured
- **Environment Variables**: Sensitive data in .env
- **Protected Routes**: Frontend and backend validation

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1366px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

## 📊 Database Schema

### Users Collection
- USN (Unique, Indexed)
- Email (Unique, Indexed)
- Password (Hashed)
- Branch
- Current Branch
- Progress Reference

### Subjects Collection
- Name
- Code (Unique)
- Branch (Indexed)
- Modules with Questions

### Progress Collection
- User ID (Indexed)
- Branch
- Subject Progress Array
- Overall Progress %

## 🚀 Deployment

### Production Ready
This project is fully configured for production deployment:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

### Deployment Guide
For complete step-by-step instructions:
- 📖 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete production deployment
- 🔍 **[DEPLOYMENT_AUDIT.md](./DEPLOYMENT_AUDIT.md)** - Security & readiness audit

### Quick Deploy
```bash
# Frontend (Vercel)
npm run build  # Creates 'dist' folder
# Set VITE_API_BASE_URL env var in Vercel

# Backend (Render)
# Set MONGODB_URI, JWT_SECRET, FRONTEND_URL env vars in Render
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[SETUP.md](./SETUP.md)** - Detailed setup & deployment
- **[TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)** - Architecture & API details

## 🎯 Future Enhancements

- [ ] Admin panel for content management
- [ ] Real-time notifications
- [ ] Discussion forums
- [ ] Assignment submission system
- [ ] Performance analytics
- [ ] Mobile app (React Native)
- [ ] Dark mode support
- [ ] Offline support
- [ ] WebSocket for real-time updates
- [ ] Video lecture integration

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 💡 Tips

- Use Chrome/Firefox for best experience
- Clear browser cache if experiencing issues
- Check browser console for error messages
- Verify MongoDB connection if API fails
- See [QUICK_START.md](./QUICK_START.md) for troubleshooting

## 📞 Support

- Check documentation files
- Review [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) for architecture
- Verify MongoDB and Node.js versions
- Check console logs for detailed errors

## 🌟 Highlights

✨ **Professional Grade** - Production-ready code  
⚡ **Fast Performance** - Optimized rendering and queries  
🔒 **Secure** - JWT authentication, password hashing  
📱 **Responsive** - Works on all devices  
🎨 **Modern UI** - Tailwind CSS with smooth animations  
📚 **Well Documented** - Comprehensive docs included  

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Production Ready

Start tracking your academic progress today! 🚀
