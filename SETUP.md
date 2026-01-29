# AskUrSenior - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Update `.env` file with your MongoDB URI and JWT secret:
```
MONGODB_URI=mongodb://localhost:27017/askursenior
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB
Make sure MongoDB is running on your system.

### 5. Start the backend server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Test Credentials

After the database is seeded, you can use the following credentials:

### Demo Student
- **USN**: VTM22CS001
- **Password**: password
- **Branch**: CSE (or any other branch)

---

## Features Overview

### Authentication
- User registration with USN validation
- Secure login with JWT tokens
- Branch-based access control

### Dashboard
- Real-time progress tracking
- Subject and module management
- Question completion tracking
- Branch switching capability

### Progress Tracking
- Overall progress percentage
- Subject-wise progress
- Module-wise progress
- Individual question tracking

---

## Database Schema

### Users Collection
- USN (unique)
- Email (unique)
- Password (hashed)
- Branch
- Current Branch
- Progress Reference

### Subjects Collection
- Name
- Code (unique)
- Branch
- Modules (nested)
  - Module Number (1-5)
  - Questions (5 per module)
    - Title
    - Description
    - Completed Status

### Progress Collection
- User ID
- Branch
- Subject Progress
  - Subject ID
  - Total Questions
  - Completed Questions
  - Module Progress
- Total Progress Percentage

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new student
- `POST /api/auth/login` - Login student
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/switch-branch` - Switch to different branch

### Subjects
- `GET /api/subjects/branch/:branch` - Get subjects by branch
- `GET /api/subjects/:subjectId` - Get subject details
- `POST /api/subjects/question/complete` - Mark question as completed

### Progress
- `GET /api/progress` - Get user progress
- `GET /api/progress/branch/:branch` - Get branch-specific progress

---

## Deployment

### Frontend
```bash
npm run build
# Deploy the dist folder to your hosting service
```

### Backend
- Use services like Heroku, Railway, or your own server
- Set environment variables on the hosting platform
- Ensure MongoDB is accessible from your server

---

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the connection string in `.env`
- Verify firewall settings allow MongoDB connections

### CORS Errors
- Ensure backend is running on the correct port
- Check API endpoint URLs in frontend

### Token Expiration
- Tokens expire after 7 days
- User needs to login again after expiration

---

## Future Enhancements

- Admin panel for question management
- Real-time notifications
- Assignment submission system
- Discussion forums
- Performance analytics
- Mobile app
- Dark mode
- Integration with college management system

---

For more information, visit the [README.md](./README.md) file.
