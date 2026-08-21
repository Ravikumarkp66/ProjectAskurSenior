# Master API Ownership Matrix

## Overview
Every backend endpoint has exactly **one owner feature domain**.

---

| Feature Domain | Backend Endpoint Base | Primary Controller | Primary Service | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth/*` | `AuthController` | `authService` | ✅ Single Source of Truth |
| **Home** | `/api/academic/*` | `AcademicController` | `academicService` | ✅ Single Source of Truth |
| **Plus** | `/api/v2/auth/profile/*` | `AttendanceV2Controller` | `attendanceService` | ✅ Single Source of Truth |
| **Materials** | `/api/subjects/*`, `/api/documents/*` | `SubjectController` | `subjectService` | ✅ Single Source of Truth |
| **Ask+** | `/api/user-uploads/*`, `/api/cms/*` | `UserUploadController` | `userUploadService` | ✅ Single Source of Truth |
| **Profile** | `/api/auth/profile`, `/api/v2/profile/*` | `ProfileController` | `profileService` | ✅ Single Source of Truth |
| **Interviews** | `/api/experiences/*` | `ExperienceController` | `experienceService` | ✅ Single Source of Truth |
| **Campus** | `/api/campus-hub/*` | `CampusHubController` | `campusHubService` | ✅ Single Source of Truth |
| **Blog** | `/api/articles/*` | `ArticleController` | `articleService` | ✅ Single Source of Truth |
| `Admin` | `/api/admin/*` | `AdminController` | `analyticsService` | ✅ Single Source of Truth |
