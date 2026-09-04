import axios from 'axios';
import { getBaseApiUrl } from './api/apiClient';

const API_BASE_URL = getBaseApiUrl('/auth');
const EXPERIENCES_BASE_URL = getBaseApiUrl('/experiences');

export const experiencesClient = axios.create({
    baseURL: EXPERIENCES_BASE_URL,
    withCredentials: true
});

export const apiV2Client = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // Crucial for receiving and sending refresh token cookies!
});

// Request Interceptor: Attach access token
apiV2Client.interceptors.request.use((config) => {
    config.headers['x-client-portal'] = 'frontend_3000';
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.timeout = 30000; // 30s timeout
    return config;
});

// Response Interceptor: Handle 401 token refreshing
apiV2Client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('session')) {
            originalRequest._retry = true;
            try {
                // Attempt to silently rotate session/refresh token
                const res = await axios.post(`${API_BASE_URL}/refresh-token`, {}, { withCredentials: true });
                const { accessToken } = res.data.data;
                localStorage.setItem('authToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiV2Client(originalRequest);
            } catch (refreshErr) {
                // Clear session if refresh fails
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login?message=Session%20expired.%20Please%20log%20in%20again.';
                }
            }
        }
        return Promise.reject(error);
    }
);

export const authClient = apiV2Client;

export const authService = {
    loginGoogle: (token) => apiV2Client.post('/login/google', { token }),
    loginEmail: (email) => apiV2Client.post('/login/email', { email }),
    verifyOtp: (email, otp) => apiV2Client.post('/verify-otp', { email, otp }),
    register: (data) => apiV2Client.post('/register', data),
    checkUsn: (usn) => apiV2Client.post('/check-usn', { usn }),
    recoverAccount: (usn) => apiV2Client.post('/recover-account', { usn }),
    verifyRecoveryOtp: (recoveryToken, otp) => apiV2Client.post('/verify-recovery-otp', { recoveryToken, otp }),
    logout: () => apiV2Client.post('/logout'),
    getSession: () => apiV2Client.get('/session'),
    getMe: () => apiV2Client.get('/me'),
    getStudentProfile: () => apiV2Client.get('/me'),
    getProfile: () => apiV2Client.get('/me'),
    getCompanies: () => experiencesClient.get('/companies'),
    updateProfile: (data) => apiV2Client.put('/profile', data),
    uploadProfilePicture: (formData) => apiV2Client.post('/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    removeProfilePicture: () => apiV2Client.delete('/profile/picture'),
    getSemesters: () => apiV2Client.get('/profile/semesters'),
    updateSemesters: (data) => apiV2Client.put('/profile/semesters', data),
    getTimetableConfig: (semester) => apiV2Client.get('/profile/timetable/config', { params: semester ? { semester } : {} }),
    saveTimetableConfig: (data) => apiV2Client.put('/profile/timetable/config', data),
    updateTimetableConfig: (data) => apiV2Client.put('/profile/timetable/config', data),
    generateTimetablePreview: (data) => apiV2Client.post('/profile/timetable/generate-preview', data),
    getTimetableSlots: (semester) => apiV2Client.get('/profile/timetable/slots', { params: semester ? { semester } : {} }),
    updateTimetableSlots: (data) => apiV2Client.put('/profile/timetable/slots', data),
    getAcademicSubjects: (semester) => apiV2Client.get('/profile/timetable/subjects', { params: semester ? { semester } : {} }),
    getRegisteredSubjects: (semester) => apiV2Client.get('/profile/timetable/registered-subjects', { params: semester ? { semester } : {} }),
    saveRegisteredSubjects: (data) => apiV2Client.put('/profile/timetable/registered-subjects', data),
    updateWeeklyPlan: (data) => apiV2Client.put('/profile/timetable/weekly-plan', data),
    getSubjectProgress: () => apiV2Client.get('/profile/attendance/subjects'),
    getAttendanceHistory: (subjectId) => apiV2Client.get(`/profile/attendance/history/${subjectId}`),
    updateAttendanceHistory: (attendanceId, data) => apiV2Client.put(`/profile/attendance/history/${attendanceId}`, data),
    addExtraClass: (data) => apiV2Client.post('/profile/attendance/history/extra', data),
    deleteExtraClass: (attendanceId) => apiV2Client.delete(`/profile/attendance/history/extra/${attendanceId}`),

    // Attendance APIs
    getAttendanceDashboard: (semester) => apiV2Client.get('/profile/attendance', { params: { semester } }),
    getAttendanceToday: (date, semester) => apiV2Client.get('/profile/attendance/today', { params: { date, semester } }),
    getAttendanceDay: (date, semester) => apiV2Client.get('/profile/attendance/today', { params: { date, semester } }),
    saveBaselineAttendance: (data) => apiV2Client.put('/profile/attendance/baseline', data),
    getAttendanceAnalytics: (semester) => apiV2Client.get('/profile/attendance/analytics', { params: { semester } }),
    getSubjectAttendanceDetail: (subjectId, semester, category) => apiV2Client.get(`/profile/attendance/subject/${subjectId}`, { params: { semester, category } }),
    updateAttendanceHistoryV2: (data) => apiV2Client.put('/profile/attendance/entry', data),
    updateAttendanceTarget: (data) => apiV2Client.put('/profile/attendance/target', data),
    addExtraClassV2: (data) => apiV2Client.post('/profile/attendance/extra-class', data),
    deleteExtraClassV2: (historyId) => apiV2Client.delete(`/profile/attendance/extra-class/${historyId}`),
    resetTimetable: () => apiV2Client.post('/profile/timetable/reset'),
    undoResetTimetable: () => apiV2Client.post('/profile/timetable/undo-reset'),
    promoteSemester: () => apiV2Client.post('/profile/attendance/promote'),
    recalculateAttendance: () => apiV2Client.post('/profile/attendance/recalculate'),
    getReportExportUrl: (semester, format) => {
        const token = localStorage.getItem('authToken');
        return `${API_BASE_URL}/profile/attendance/export?semester=${semester}&format=${format}&token=${token || ''}`;
    },

    // Academic Events APIs
    getAcademicEvents: () => apiV2Client.get('/profile/events'),
    createAcademicEvent: (data) => apiV2Client.post('/profile/events', data),
    updateAcademicEvent: (id, data) => apiV2Client.put(`/profile/events/${id}`, data),
    deleteAcademicEvent: (id) => apiV2Client.delete(`/profile/events/${id}`),

    // CIE Analyzer APIs
    getCieDashboard: (semester) => apiV2Client.get('/profile/cie', { params: { semester } }),
    saveCieRecord: (data) => apiV2Client.put('/profile/cie', data),

    // SGPA Calculator APIs
    getSgpaDashboard: (semester) => apiV2Client.get('/profile/sgpa', { params: { semester } }),
    saveSgpaRecord: (data) => apiV2Client.put('/profile/sgpa', data),

    // Academic Summary API
    getAcademicSummary: (semester) => apiV2Client.get('/profile/academic-summary', { params: { semester } })
};

export const apiV2 = authService;
export default authService;
