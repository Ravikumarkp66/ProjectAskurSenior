# Student Dashboard Feature Domain (/home & /plus)

## Purpose
The **Dashboard** domain orchestrates the core student learning environment, dividing capabilities into two sibling routes:
- `/home`: Free tier student discovery (Academics, Campus Hub, Quick Tools, Community).
- `/plus`: Premium academic intelligence (Attendance Engine, CIE Analyzer, Timetable Planner, Career Roadmaps).

## Feature Owner
- **Dashboard Feature Team**

## Routes Supported
- `/home` ➔ `UserHomePage.jsx`
- `/plus` ➔ `DashboardPage.jsx`
- `/plus/academic-calendar` ➔ `AcademicCalendarPage.jsx`
- `/plus/subjects` ➔ `SubjectsPage.jsx`

## Layout Dependencies
- `layouts/DashboardLayout.jsx` (Master Shell Wrapper)
- `layouts/Sidebar.jsx` (Left Navigation)
- `layouts/TopBar.jsx` (Top Header)
- `components/dashboard/RightPanel.jsx` (Right Widget Container)

## Single Source of Truth Services
- `academicService.js` (Setup, Timetable, Daily Tasks)
- `apiV2.js` (Attendance Engine, Extra Classes, Academic Events)

## Feature Boundaries
- This feature consumes `core/` infrastructure and `components/common/` primitives.
- It does NOT directly depend on unrouted experimental modules.
