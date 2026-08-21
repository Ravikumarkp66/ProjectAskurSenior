# Frontend Service Layer Single Source of Truth Mappings

## Architecture Overview
All HTTP communication with the backend is managed by single-owner feature services built on top of centralized HTTP client gateways.

## Service Ownership & Mappings

| Service | Owner Feature | Used By | Status |
| :--- | :--- | :--- | :--- |
| `authAPI` (`api.js`) | Authentication | Login, SignUp, CompleteProfile | ✅ Source of Truth (V1 Auth) |
| `subjectAPI` (`api.js`) | Materials | Home, SubjectContent, Plus | ✅ Source of Truth (Subjects) |
| `uploadAPI` (`api.js`) | Materials / Admin | AdminPanel, AdminMaterials | ✅ Source of Truth (Admin Uploads) |
| `userUploadAPI` (`api.js`) | Materials / Ask+ | AskFinder, MaterialUpload | ✅ Source of Truth (Student Uploads) |
| `academicAPI` (`academicService.js`) | Home / Setup | Dashboard, AcademicSetup, Calendar | ✅ Source of Truth (Academic Setup) |
| `apiV2` (`apiV2.js`) | Settings / Profile | Settings, Timetable, Attendance | ✅ Source of Truth (Attendance Engine) |
| `articleAPI` (`articleAPI.js`) | Blog | GuidesPage, ArticlePage, AdminCreateArticle | ✅ Source of Truth (Articles & Comments) |
| `analyticsAPI` (`analyticsAPI.js`) | Admin | AdminPanel, UserManagement | ✅ Source of Truth (Admin Analytics) |
| `interviewExperiencesAPI` (`api.js`) | Interviews | InterviewPage, CompanyRolePage | ✅ Source of Truth (Placements) |
| `campusHubAPI` (`api.js`) | Campus | CampusHub | ✅ Source of Truth (Campus Hub) |
| `notificationAPI` (`api.js`) | Shared | TopBar, NotificationBell | ✅ Source of Truth (Notifications) |
| `lookupAPI` (`api.js`) | Shared | CompleteProfile, AdminPanel | ✅ Source of Truth (CMS Lookups) |
| `subscriptionAPI` (`api.js`) | Plus | PricingPage | ✅ Source of Truth (Subscription Plans) |
| `socket` (`socket.js`) | Shared Real-Time | App, ChatWindow, SupportWidget | ✅ Source of Truth (Socket.IO Singleton) |

## Service Rules
1. Every service must use the primary `apiClient` instance.
2. Services are feature-focused and do not duplicate endpoints across domain boundaries.
