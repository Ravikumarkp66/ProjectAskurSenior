# AskUrSenior Master Routing Map

| Route Path | Page Component | Access Level | Layout Used | Feature Owner |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | None | Landing |
| `/login` | `LoginPage` | Public | None | Authentication |
| `/signup` | `LoginPage` (`mode=register`) | Public | None | Authentication |
| `/admin/login` | `AdminLoginPage` | Public | None | Authentication |
| `/calculator` | `CGPACalculatorPage` | Public | None | Plus / Tools |
| `/blog` | `GuidesPage` | Public | None | Blog |
| `/blog/:slug` | `ArticlePage` | Public | None | Blog |
| `/terms` | `TermsPage` | Public | None | Shared / Legal |
| `/privacy` | `PrivacyPage` | Public | None | Shared / Legal |
| `/ask-finder` | `AskFinderPage` | Public | None | Ask+ |
| `/pricing` | `PricingPage` | Public | None | Plus |
| `/complete-profile` | `CompleteProfilePage` | Protected (`allowIncomplete`) | None | Authentication |
| `/home` | `UserHomePage` | Protected | `DashboardLayout` | Home |
| `/plus` | `DashboardPage` | Protected | `DashboardLayout` | Plus |
| `/profile` | `ProfilePage` | Protected | `DashboardLayout` | Profile |
| `/profile/edit/*` | `ProfileSettingsLayout` | Protected | `ProfileSettingsLayout` | Settings |
| `/campus-hub` | `CampusHub` | Protected | None | Campus |
| `/admin` | `AdminPanel` | Admin | None | Admin |
| `/interview` | `InterviewExperiencesPage` | Public | `InterviewLayout` | Interviews |
| `/interview/:id` | `CompanyRolePage` | Public | `InterviewLayout` | Interviews |
| `/interview/add` | `ShareExperience` | Public | `InterviewLayout` | Interviews |
