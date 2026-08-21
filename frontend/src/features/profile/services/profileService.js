import { apiV2 } from '../../../services/authService';
import { authAPI } from '../../../services/api';

/**
 * Profile Feature Single Source of Truth Service
 * Centralizes all user profile, attendance engine, timetable configuration,
 * and academic event API interactions.
 */
export const profileService = {
    // User Profile
    getProfile: () => authAPI.getProfile(),
    updateProfile: (data) => apiV2.updateProfile(data),
    uploadProfilePicture: (formData) => apiV2.uploadProfilePicture(formData),
    removeProfilePicture: () => apiV2.removeProfilePicture(),
    
    // Semesters & Timetable
    getSemesters: () => apiV2.getSemesters(),
    updateSemesters: (data) => apiV2.updateSemesters(data),
    getTimetableConfig: () => apiV2.getTimetableConfig(),
    saveTimetableConfig: (data) => apiV2.saveTimetableConfig(data),
    getTimetableSlots: () => apiV2.getTimetableSlots(),
    updateTimetableSlots: (data) => apiV2.updateTimetableSlots(data),

    // Attendance Engine
    getAttendanceDashboard: (semester) => apiV2.getAttendanceDashboard(semester),
    getAttendanceToday: (date) => apiV2.getAttendanceToday(date),
    getAttendanceAnalytics: (semester) => apiV2.getAttendanceAnalytics(semester),
    getSubjectAttendanceDetail: (subjectId, semester, category) => apiV2.getSubjectAttendanceDetail(subjectId, semester, category),
    updateAttendanceHistory: (data) => apiV2.updateAttendanceHistoryV2(data),
    addExtraClass: (data) => apiV2.addExtraClassV2(data),
    deleteExtraClass: (historyId) => apiV2.deleteExtraClassV2(historyId),

    // Academic Events
    getAcademicEvents: () => apiV2.getAcademicEvents(),
    createAcademicEvent: (data) => apiV2.createAcademicEvent(data),
    updateAcademicEvent: (id, data) => apiV2.updateAcademicEvent(id, data),
    deleteAcademicEvent: (id) => apiV2.deleteAcademicEvent(id)
};

export default profileService;
