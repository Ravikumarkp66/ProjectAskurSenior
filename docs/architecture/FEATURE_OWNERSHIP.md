# Feature Ownership Matrix

| Feature Domain | Primary Routes | Primary Pages | Primary Services | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/login`, `/signup`, `/complete-profile` | `LoginPage`, `CompleteProfilePage` | `authAPI` | ✅ Active Source of Truth |
| **Home** | `/home`, `/home/*` | `UserHomePage` | `academicAPI` | ✅ Active Source of Truth |
| **Plus** | `/plus`, `/plus/*`, `/pricing` | `DashboardPage`, `PricingPage` | `apiV2`, `subscriptionAPI` | ✅ Active Source of Truth |
| **Ask+ & Materials** | `/ask-finder`, `/plus/materials`, `/subject/*` | `AskFinderPage`, `SubjectContentPage` | `subjectAPI`, `userUploadAPI` | ✅ Active Source of Truth |
| **Profile & Settings** | `/profile`, `/profile/edit/*` | `ProfilePage`, `ProfileSettingsLayout` | `apiV2` | ✅ Active Source of Truth |
| **Interviews** | `/interview`, `/interview/:id` | `InterviewPage`, `CompanyRolePage` | `interviewExperiencesAPI` | ✅ Active Source of Truth |
| **Campus** | `/campus-hub`, `/campus-map` | `CampusHub`, `CampusMap` | `campusHubAPI` | ✅ Active Source of Truth |
| **Blog** | `/blog`, `/blog/:slug` | `GuidesPage`, `ArticlePage` | `articleAPI` | ✅ Active Source of Truth |
| **Admin** | `/admin`, `/admin/*` | `AdminPanel`, `AdminCreateArticle` | `analyticsAPI`, `uploadAPI` | ✅ Active Source of Truth |
