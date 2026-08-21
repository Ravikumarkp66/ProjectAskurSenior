/**
 * Profile Settings Workspace Navigation Configuration
 */
export const SETTINGS_TABS = [
    { id: 'basic', label: 'Basic Information', path: '/profile/edit/basic', icon: 'User' },
    { id: 'cgpa', label: 'CGPA & Grades', path: '/profile/edit/cgpa', icon: 'Award' },
    { id: 'attendance', label: 'Attendance Engine', path: '/profile/edit/attendance', icon: 'CheckCircle' },
    { id: 'timetable', label: 'Timetable Matrix', path: '/profile/edit/timetable', icon: 'Calendar' },
    { id: 'events', label: 'Academic Events', path: '/profile/edit/events', icon: 'Bell' }
];

export const PROFILE_DASHBOARD_SECTIONS = [
    { id: 'header', component: 'ProfileHeaderSection', label: 'Student Identity' },
    { id: 'cgpa', component: 'CGPAProgressSection', label: 'CGPA Progress' },
    { id: 'attendance', component: 'AttendanceOverviewSection', label: 'Attendance Overview' },
    { id: 'classes', component: 'ClassesSection', label: "Today's Classes" },
    { id: 'journey', component: 'AcademicJourneySection', label: 'Semester Journey' }
];
