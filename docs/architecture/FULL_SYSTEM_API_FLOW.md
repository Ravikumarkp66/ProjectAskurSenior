# 🗺️ Master End-to-End API Call Flow & System Architecture Map

## 🌐 Executive Overview & System Architecture

```mermaid
graph TD
    Client["🌐 React Frontend (Client Port 3000 / 5173)"]
    
    subgraph "Landing & Onboarding Journey"
        Landing["/ (Landing Page)"]
        Auth["/login, /signup, /complete-profile"]
    end
    
    subgraph "Main Application Features"
        Home["/home (Academics & Tools)"]
        Plus["/plus (Semester & Productivity)"]
        Profile["/profile (Identity & Heatmap)"]
        Materials["/plus/materials & /ask-finder"]
    end
    
    subgraph "Platform Control"
        Admin["/admin (Admin Panel)"]
    end
    
    Gateway["⚡ Express API Gateway (server.js - Port 5000)"]
    
    Landing -->|GET /api/hero-stats, /api/testimonials| Gateway
    Auth -->|POST /api/v2/auth/login, /api/v2/auth/verify-otp| Gateway
    Home -->|GET /api/academic/dashboard (ADR-001)| Gateway
    Plus -->|GET /api/v2/auth/profile/attendance| Gateway
    Profile -->|GET /api/v2/auth/me, /api/academic/events| Gateway
    Materials -->|GET /api/materials, /api/subjects| Gateway
    Admin -->|GET /api/admin/analytics/overview| Gateway
    
    subgraph "Database & Storage"
        MongoDB[("🍃 MongoDB Atlas")]
        S3[("📦 AWS S3 / CloudFront CDN")]
    end
    
    Gateway --> MongoDB
    Gateway --> S3
```

---

## 1. 🚀 Stage 1: Public Landing Page (`/`)

### 📍 Client View Component: `HomePage.jsx`
| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Mount** | `heroAPI.getStats()` | `GET /api/hero-stats` | Inline `server.js` route | `Document`, `User` | 🟢 Active |
| **Hero Banners** | `landingPageAPI.getHero()` | `GET /api/landing-page/hero` | `landingPageController.js` | `LandingPageConfig` | 🟢 Active |
| **Testimonials Carousel**| `testimonialAPI.getAll()` | `GET /api/testimonials` | `testimonialController.js` | `Testimonial` | 🟢 Active |
| **FAQs Accordion** | `faqAPI.getAll()` | `GET /api/faqs` | `faqController.js` | `Faq` | 🟢 Active |
| **Top Contributors** | `contributorAPI.getAll()` | `GET /api/contributors` | `contributorController.js` | `Contributor` | 🟢 Active |

---

## 2. 🔐 Stage 2: Authentication & Onboarding (`/login`, `/signup`, `/complete-profile`)

### 📍 Client View Component: `LoginPage.jsx` & `CompleteProfilePage.jsx`
| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google OAuth Tap** | `apiV2.loginGoogle(idToken)` | `POST /api/v2/auth/login/google` | `authV2.controller.js` | `StudentAccount` | 🟢 Active |
| **Email Login Submit** | `apiV2.loginEmail(email)` | `POST /api/v2/auth/login/email` | `authV2.controller.js` | `StudentAccount`, `OTP` | 🟢 Active |
| **Verify Email OTP** | `apiV2.verifyOtp(email, otp)` | `POST /api/v2/auth/verify-otp` | `authV2.controller.js` | `StudentAccount`, `OTP` | 🟢 Active |
| **Student Registration** | `apiV2.register(name, usn)` | `POST /api/v2/auth/register` | `authV2.controller.js` | `StudentAccount` | 🟢 Active |
| **Complete Profile Setup**| `authAPI.updateProfile(data)` | `PUT /api/auth/update-profile` | `authController.js` | `User`, `StudentAccount` | 🟢 Active |
| *Legacy Login* | `authAPI.login(data)` | `POST /api/auth/login` | `authController.js` | `User` | 🟡 Legacy Fallback |

---

## 3. 🏠 Stage 3: Home Page (`/home`)

### 📍 Client View Component: `UserHomePage.jsx`
> **ADR-001 Single Gateway Pattern:** `/home` fetches 100% of its required academic data in **1 single gateway call**!

| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home Page Mount** | `academicAPI.getDashboard()` | `GET /api/academic/dashboard` | `academic.controller.js` | `AcademicConfig`, `Subject`, `Timetable`, `User`, `AttendanceRecord` | 🟢 Active (Primary) |
| **Heartbeat Keep-Alive** | `authAPI.heartbeat()` | `POST /api/auth/heartbeat` | `authController.js` | `User` (Updates `lastActiveAt`) | 🟢 Active (Background) |

---

## 4. ⚡ Stage 4: Plus Page (`/plus`)

### 📍 Client View Component: `DashboardPage.jsx`
| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Plus Dashboard Mount** | `apiV2.getAttendanceDashboard()` | `GET /api/v2/auth/profile/attendance` | `authV2.controller.js` | `StudentAttendanceHistory`, `StudentAccount` | 🟢 Active |
| **Materials Overview Widget** | `documentsAPI.getMaterialsOverview()` | `GET /api/documents/materials-overview` | `documentController.js` | `AcademicMaterial`, `Document` | 🟢 Active |
| **Branch Subjects List** | `subjectAPI.getSubjectsByBranch()` | `GET /api/subjects/branch/:branch` | `subjectController.js` | `Subject` | 🟢 Active |

---

## 5. 👤 Stage 5: Profile Page & Edit Settings (`/profile` & `/profile/edit/*`)

### 📍 Client View Component: `ProfilePage.jsx` & `ProfileSettingsLayout.jsx`
> **Instant Render Standard:** Profile data initializes from `sessionStorage` cache (**< 25 ms**), with 1 background refresh.

| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Profile Mount (Identity)**| `apiV2.getMe()` | `GET /api/v2/auth/me` | `authV2.controller.js` | `StudentAccount` | 🟢 Active |
| **CGPA Progress Card** | `apiV2.getSemesters()` | `GET /api/v2/auth/profile/semesters` | `authV2.controller.js` | `StudentAccount` | 🟢 Active |
| **Placement Cutoffs** | `apiV2.getCompanies()` | `GET /api/v2/auth/companies` | `authV2.controller.js` | `Company` | 🟢 Active |
| **Today Classes Card** | `apiV2.getAttendanceToday()` | `GET /api/v2/auth/profile/attendance/today` | `authV2.controller.js` | `StudentAttendanceHistory` | 🟢 Active |
| **Attendance Mark Click** | `apiV2.updateAttendanceHistoryV2()`| `POST /api/v2/auth/profile/attendance/history` | `authV2.controller.js` | `StudentAttendanceHistory` | 🟢 Active (Optimistic UI) |
| **Academic Heatmap Grid** | `academicAPI.getCalendarEvents()` | `GET /api/events` | `eventController.js` | `Event` | 🟢 Active |
| **Avatar Photo Upload** | `authAPI.uploadProfilePicture()` | `POST /api/auth/upload-profile-picture` | `profileController.js` | S3 Storage + `StudentAccount` | 🟢 Active |

---

## 6. 📚 Stage 6: Materials & Search (`/plus/materials` & `/ask-finder`)

### 📍 Client View Component: `AskFinderPage.jsx` & `SubjectsPage.jsx`
| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ask+ Vector AI Search** | `knowledgeBaseAPI.search()` | `POST /api/knowledge-base/search` | `knowledgeBaseController.js` | `KnowledgeChunk` (Gemini Embeddings) | 🟢 Active |
| **Search Notes & PYQs** | `materialAPI.searchMaterials()`| `GET /api/materials` | `materialController.js` | `AcademicMaterial` | 🟢 Active |
| **Download PDF File** | `downloadAPI.trackDownload()` | `POST /api/download/:id` | `downloadController.js` | `AcademicMaterial` | 🟢 Active |
| **Upload Student Notes** | `userUploadAPI.createUpload()`| `POST /api/user-uploads` | `userUploadController.js` | `UserUpload` + S3 Bucket | 🟢 Active |

---

## 7. 👑 Stage 7: Admin Control Panel (`/admin/*`)

### 📍 Client View Component: `AdminPanel.jsx`
| User Action / Trigger | Client API Function | HTTP Method & Route | Backend Controller | DB Model / Resource | API Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin Overview Mount** | `analyticsAPI.getOverview()` | `GET /api/admin/analytics/overview` | `analyticsController.js` | Parallel Counts (`User`, `AcademicMaterial`, `Subject`) | 🟢 Active |
| **Dashboard Summary** | `analyticsAPI.getDashboardSummary()` | `GET /api/admin/dashboard-summary` | `analyticsController.js` | Aggregate pipeline analytics | 🟢 Active |
| **Manage Subjects** | `adminCmsAPI.getSubjects()` | `GET /api/admin/subjects` | `adminCmsSubjectController.js` | `AcademicSubject` | 🟢 Active |
| **Approve / Reject Notes** | `adminCmsAPI.getUploads()` | `GET /api/admin/materials` | `adminCmsMaterialController.js` | `UserUpload`, `AcademicMaterial` | 🟢 Active |

---

## 🚫 8. What is NOT Used in this Flow (Unused / Legacy / Backup APIs)

| File / Route Path | Status | Reason | Recommendation |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/login` | 🟡 Legacy | Superseded by V2 Auth (`POST /api/v2/auth/login/email`) | Retained strictly for legacy mobile client backwards compatibility |
| `GET /api/documents` | 🟡 Legacy | Replaced by new SSOT `AcademicMaterial` (`GET /api/materials`) | Retain for legacy document URL redirects |
| `backend/routes/subscriptionConfigRoutes.js` | 🟠 WIP | Enterprise subscription config endpoints (not yet mounted in `server.js`) | Mount when enterprise billing module is launched |
| `utils/redisClient.js.backup` | ⚪ Backup | Backup Redis driver (currently using 5-minute memory cache in `utils/cache.js`) | Keep as driver setup for future Redis deployment |

---

📄 Complete End-to-End API Flow Documented in 📄 **[FULL_SYSTEM_API_FLOW.md](file:///c:/AskUrSenior/docs/architecture/FULL_SYSTEM_API_FLOW.md)**.
