/**
 * Profile Dashboard Section Configuration
 */
export const PROFILE_DASHBOARD_SECTIONS = [
    { id: 'header', component: 'ProfileHeaderSection', label: 'Student Identity' },
    { id: 'cgpa', component: 'CGPAProgressSection', label: 'CGPA Progress' },
    { id: 'attendance', component: 'AttendanceOverviewSection', label: 'Attendance Overview' },
    { id: 'classes', component: 'ClassesSection', label: "Today's Classes" },
    { id: 'journey', component: 'AcademicJourneySection', label: 'Semester Journey' }
];

export default PROFILE_DASHBOARD_SECTIONS;
