import axios from 'axios';

// Use VITE_API_URL in production (e.g., https://backend.onrender.com)
// In development, directly use localhost:5000 to avoid proxy issues
const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api` 
    : 'http://localhost:5000/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses - clear invalid tokens
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear invalid/expired token
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    adminLogin: (data) => apiClient.post('/auth/admin-login', data),
    getProfile: () => apiClient.get('/auth/profile'),
    switchBranch: (data) => apiClient.post('/auth/switch-branch', data)
};

// Subject API
export const subjectAPI = {
    getSubjectsByBranch: (branch, cycle) =>
        apiClient.get(`/subjects/branch/${branch}`, {
            params: cycle ? { cycle } : {}
        }),
    getSubjectById: (subjectId) => apiClient.get(`/subjects/${subjectId}`),
    markQuestionCompleted: (data) => apiClient.post('/subjects/question/complete', data),
    getModuleNotes: (subjectId, moduleNumber) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/notes`),
    // New content APIs
    getSubjectContent: (subjectId) =>
        apiClient.get(`/subjects/${subjectId}/content`),
    getContentUrl: (subjectId, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/content/${contentType}/${contentId}`),
    getModuleContentUrl: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.get(`/subjects/${subjectId}/module/${moduleNumber}/content/${contentType}/${contentId}`)
};

// Upload API (Admin)
export const uploadAPI = {
    // Legacy notes upload
    uploadNotes: (subjectId, moduleNumber, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/upload/notes/${subjectId}/${moduleNumber}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // Subject-level content upload (syllabus, resources)
    uploadSubjectContent: (subjectId, contentType, file, title, description = '') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        return apiClient.post(`/upload/content/${subjectId}/${contentType}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // Module-level content upload (notes, pyqs, questionBanks)
    uploadModuleContent: (subjectId, moduleNumber, contentType, file, title, description = '') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        return apiClient.post(`/upload/module-content/${subjectId}/${moduleNumber}/${contentType}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // Delete subject-level content
    deleteSubjectContent: (subjectId, contentType, contentId) =>
        apiClient.delete(`/upload/content/${subjectId}/${contentType}/${contentId}`),
    // Delete module-level content
    deleteModuleContent: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.delete(`/upload/module-content/${subjectId}/${moduleNumber}/${contentType}/${contentId}`),
    
    // BULK UPLOAD - Upload to ALL subjects with same code across all branches/cycles
    
    // Bulk upload subject-level content (syllabus, resources) to all subjects with this code
    bulkUploadSubjectContent: (subjectCode, contentType, file, title, description = '') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        return apiClient.post(`/upload/bulk/content/${subjectCode}/${contentType}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // Bulk upload module-level content (notes, pyqs, questionBanks) to all subjects with this code
    bulkUploadModuleContent: (subjectCode, moduleNumber, contentType, file, title, description = '') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        return apiClient.post(`/upload/bulk/module-content/${subjectCode}/${moduleNumber}/${contentType}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    // Bulk delete subject-level content from all subjects with this code
    bulkDeleteSubjectContent: (subjectCode, contentType, title) =>
        apiClient.delete(`/upload/bulk/content/${subjectCode}/${contentType}/${encodeURIComponent(title)}`),
    // Bulk delete module-level content from all subjects with this code
    bulkDeleteModuleContent: (subjectCode, moduleNumber, contentType, title) =>
        apiClient.delete(`/upload/bulk/module-content/${subjectCode}/${moduleNumber}/${contentType}/${encodeURIComponent(title)}`)
};

// Notification API
export const notificationAPI = {
    // Get notifications for current user (optionally filtered by branch/cycle)
    getNotifications: (branch, cycle, limit = 20) =>
        apiClient.get('/notifications', {
            params: { branch, cycle, limit }
        }),
    // Mark specific notifications as read
    markAsRead: (notificationIds) =>
        apiClient.post('/notifications/read', { notificationIds }),
    // Mark all notifications as read
    markAllAsRead: (branch, cycle) =>
        apiClient.post('/notifications/read-all', null, {
            params: { branch, cycle }
        }),
    // Create notification (admin only)
    createNotification: (data) =>
        apiClient.post('/notifications', data),
    // Delete notification (admin only)
    deleteNotification: (notificationId) =>
        apiClient.delete(`/notifications/${notificationId}`)
};
