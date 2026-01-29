# AskUrSenior - Technical Documentation

## Project Overview

AskUrSenior is a comprehensive academic tracking platform designed for college students to manage their coursework across different engineering branches. It provides real-time progress tracking, subject management, and multi-branch support.

## Architecture

### Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

### Project Structure

```
AskUrSenior/
├── backend/
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Subject.js
│   │   └── Progress.js
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── subjectController.js
│   │   └── progressController.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── subjectRoutes.js
│   │   └── progressRoutes.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   ├── utils/           # Utility functions
│   │   └── seedDatabase.js
│   ├── server.js        # Express app
│   ├── .env            # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SubjectCard.jsx
│   │   │   ├── ModuleAccordion.jsx
│   │   │   └── TopBar.jsx
│   │   ├── pages/      # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── context/    # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   └── DashboardContext.jsx
│   │   ├── services/   # API services
│   │   │   └── api.js
│   │   ├── utils/      # Utility functions
│   │   │   ├── hooks.js
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── README.md
└── SETUP.md
```

## Backend Documentation

### Database Models

#### User Schema
```javascript
{
  usn: String (Unique, Uppercase, Pattern: /^[A-Z]{1,3}\d{2}[A-Z]{2}\d{3}$/),
  email: String (Unique, Lowercase),
  password: String (Hashed with bcryptjs),
  branch: String (Enum: [CSE, ISE, ECE, EEE, MECH, CIVIL, AIML, DS, CSBS, IT]),
  currentBranch: String (Same enum),
  progress: ObjectId (Reference to Progress),
  timestamps: true
}
```

#### Subject Schema
```javascript
{
  name: String,
  code: String (Unique),
  branch: String (Enum),
  modules: [{
    moduleNumber: Number (1-5),
    title: String,
    questions: [{
      title: String,
      description: String,
      completed: Boolean
    }]
  }],
  timestamps: true
}
```

#### Progress Schema
```javascript
{
  userId: ObjectId (Reference to User),
  branch: String,
  subjectProgress: [{
    subjectId: ObjectId,
    subjectName: String,
    totalQuestions: Number,
    completedQuestions: Number,
    modules: [{
      moduleNumber: Number,
      totalQuestions: Number,
      completedQuestions: Number
    }]
  }],
  totalProgress: Number (0-100),
  lastUpdated: Date
}
```

### API Endpoints

#### Authentication Routes (`/api/auth`)
- `POST /register` - Register new student
  - Body: `{ usn, email, password, branch }`
  - Returns: `{ token, user }`

- `POST /login` - Login student
  - Body: `{ usn, password, branch }`
  - Returns: `{ token, user }`

- `GET /profile` - Get user profile (Protected)
  - Returns: User object

- `POST /switch-branch` - Switch branch (Protected)
  - Body: `{ newBranch }`
  - Returns: `{ token, user }`

#### Subject Routes (`/api/subjects`)
- `GET /branch/:branch` - Get subjects by branch (Protected)
  - Returns: Array of subjects

- `GET /:subjectId` - Get subject details (Protected)
  - Returns: Subject object with all modules

- `POST /question/complete` - Toggle question completion (Protected)
  - Body: `{ subjectId, moduleNumber, questionId }`
  - Returns: Updated question

#### Progress Routes (`/api/progress`)
- `GET /` - Get user progress (Protected)
  - Returns: Progress object

- `GET /branch/:branch` - Get branch progress (Protected)
  - Returns: Branch-specific progress

### Middleware

#### Authentication Middleware (`auth.js`)
- Validates JWT tokens
- Extracts user info from token
- Attaches `userId`, `userBranch`, `currentBranch` to request

### Utility Functions

#### Database Seeding (`seedDatabase.js`)
- Creates sample data for all 10 branches
- 8 subjects per branch
- 5 modules per subject
- 5 questions per module

## Frontend Documentation

### Context Providers

#### AuthContext
- Manages authentication state
- Stores user and token
- Provides login, logout, switchBranch methods
- Persists auth data to localStorage

#### DashboardContext
- Manages dashboard state
- Stores subjects, progress, expandedSubjects
- Provides update methods

### Custom Hooks

#### useAuth()
- Access authentication context
- Use in protected components

#### useDashboard()
- Access dashboard context
- Use in dashboard components

### Components

#### ProgressBar
- Displays overall progress
- Shows percentage and visual progress bar
- Styled with gradient

#### Sidebar
- Left navigation panel
- Branch selection dropdown
- Profile link
- Logout button

#### TopBar
- Top navigation with branch name
- Main progress bar
- Overall completion percentage

#### SubjectCard
- Displays subject with progress
- Expandable to show modules
- Shows subject code and progress percentage

#### ModuleAccordion
- Shows module details
- Expandable list of questions
- Checkboxes for question completion
- Completion indicators

### Pages

#### LoginPage
- Dual mode: Login and Register
- USN validation
- Branch selection (required)
- Email field (register only)
- Password validation
- Error handling

#### DashboardPage
- Main dashboard after login
- Sidebar integration
- Subject list with progress
- Real-time progress updates
- Profile modal
- Branch switching with confirmation

### Services

#### API Service (api.js)
- Axios instance with interceptors
- Automatic token injection
- API methods organized by feature

### Utilities

#### Constants
- BRANCHES array
- USN validation regex
- Progress calculation functions
- Module progress calculation

#### Hooks
- Custom React hooks for context access
- Error handling

## Authentication Flow

1. **Registration**
   - User provides USN, Email, Password, Branch
   - Backend validates and hashes password
   - Creates User and Progress documents
   - Returns JWT token

2. **Login**
   - User provides USN, Password, Branch
   - Backend verifies credentials
   - Returns JWT token
   - Frontend stores token and user data

3. **Protected Routes**
   - Frontend checks authentication before rendering
   - Backend validates token on each request
   - Token includes branch information

4. **Branch Switching**
   - User selects new branch from sidebar
   - Confirmation dialog appears
   - Backend updates user's currentBranch
   - Frontend reloads subject data
   - New token issued with updated branch

## Data Flow

### Loading Subjects
1. User views dashboard
2. Frontend fetches subjects for currentBranch
3. API filters subjects by branch
4. Frontend stores in state
5. Components render subject cards

### Completing Questions
1. User clicks checkbox on question
2. Frontend calls `markQuestionCompleted`
3. Backend toggles completion status
4. Frontend updates local state
5. Progress recalculates automatically
6. UI updates with new progress

### Progress Calculation
1. For each subject, sum all questions
2. Count completed questions
3. Calculate percentage: (completed / total) * 100
4. Aggregate all subjects for overall progress
5. Update UI components

## Security Considerations

1. **Password Security**
   - Hashed using bcryptjs with salt rounds
   - Never sent in responses

2. **JWT Token**
   - Signed with secret key
   - Expires after 7 days
   - Stored in localStorage (consider httpOnly for production)

3. **USN Validation**
   - Regex pattern ensures valid format
   - Prevents SQL injection

4. **Environment Variables**
   - Sensitive data never hardcoded
   - .env file git-ignored

## Performance Optimizations

1. **Frontend**
   - React Context for state management
   - Conditional rendering
   - Lazy loading of modules
   - Memoization of functions

2. **Backend**
   - Indexed MongoDB fields
   - Pagination-ready structure
   - Efficient query selection

3. **API**
   - Axios interceptors for token handling
   - Proper error handling

## Error Handling

### Frontend
- Try-catch blocks in API calls
- User-friendly error messages
- Loading states during API calls

### Backend
- Input validation
- Error middleware
- Proper HTTP status codes
- Detailed error messages

## Deployment Checklist

### Backend
- [ ] Update MongoDB URI to production
- [ ] Change JWT_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for frontend domain
- [ ] Set up logging
- [ ] Enable HTTPS
- [ ] Configure rate limiting

### Frontend
- [ ] Update API_BASE_URL
- [ ] Build optimization
- [ ] Remove console logs
- [ ] Enable production sourcemaps
- [ ] Configure CDN
- [ ] Set up caching headers

## Future Enhancements

1. **Features**
   - Admin dashboard
   - Teacher/admin user roles
   - Assignment submission
   - Real-time notifications
   - Discussion forums
   - File uploads

2. **Technical**
   - WebSocket for real-time updates
   - Caching layer (Redis)
   - Message queue (Bull/RabbitMQ)
   - GraphQL API
   - Testing (Jest, React Testing Library)
   - CI/CD pipeline
   - Docker containerization

3. **UI/UX**
   - Dark mode
   - Mobile app
   - Offline support
   - Accessibility improvements
   - Performance monitoring

## Testing Strategy

### Unit Tests
- API endpoint tests
- Context provider tests
- Component render tests

### Integration Tests
- Authentication flow
- Data persistence
- Progress calculation

### E2E Tests
- Full user journey
- Cross-browser testing
- Performance testing

## Monitoring & Logging

### Frontend
- Error tracking (Sentry)
- Performance monitoring
- User analytics

### Backend
- Application logging
- Error logging
- Request/response logging
- Database monitoring

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: AskUrSenior Team
