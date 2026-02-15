import axios from 'axios';

// Use localhost in development, VITE_API_URL in production
const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api');

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Add timeout for all requests - longer for uploads
    if (config.url.includes('/upload') || config.url.includes('/user-uploads')) {
        config.timeout = 300000; // 5 minute timeout for uploads (50MB files)
    } else {
        config.timeout = 120000; // 2 minute timeout for other requests
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

            // Redirect to login if not already there, with an optional message
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                const isSessionExpired = error.response.data?.sessionExpired;
                const message = isSessionExpired ? '?message=Session expired. Logged in from another device.' : '';
                window.location.href = `/login${message}`;
            }
        }

        // Log error details for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                data: error.response?.data
            });
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    adminLogin: (data) => apiClient.post('/auth/admin-login', data),
    googleLogin: (token) => apiClient.post('/auth/google', { token }),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/update-profile', data),
    uploadProfilePicture: (formData) => apiClient.post('/auth/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    changePassword: (data) => apiClient.put('/auth/change-password', data),
    switchBranch: (data) => apiClient.post('/auth/switch-branch', data)
};

// Subject API
export const subjectAPI = {
    getSubjectsByBranch: (branch, cycle) =>
        apiClient.get(`/subjects/branch/${branch}`, {
            params: cycle ? { cycle } : {}
        }),
    getSubjectById: (subjectId) => apiClient.get(`/subjects/${subjectId}`),
    getSubjectsByCode: (subjectCode) => apiClient.get(`/subjects/code/${subjectCode}`),
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
    uploadSubjectFiles: (subjectId, contentType, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return apiClient.post(`/upload/${subjectId}/${contentType}`, formData, {
            timeout: 300000 // 5 minute timeout for large files
        });
    },
    // Delete subject-level content
    deleteSubjectContent: (subjectId, contentType, contentId) =>
        apiClient.delete(`/upload/content/${subjectId}/${contentType}/${contentId}`),
    // Delete module-level content (legacy)
    deleteModuleContent: (subjectId, moduleNumber, contentType, contentId) =>
        apiClient.delete(`/upload/module-content/${subjectId}/${moduleNumber}/${contentType}/${contentId}`),

    // BULK UPLOAD - Upload to ALL subjects with same code across all branches/cycles

    bulkUploadSubjectContent: (subjectCode, contentType, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return apiClient.post(`/upload/bulk/content/${subjectCode}/${contentType}`, formData, {
            timeout: 300000 // 5 minute timeout for large files
        });
    },
    // Bulk delete subject-level content from all subjects with this code
    bulkDeleteSubjectContent: (subjectCode, contentType, title) =>
        apiClient.delete(`/upload/bulk/content/${subjectCode}/${contentType}/${encodeURIComponent(title)}`),
    // Bulk delete module-level content from all subjects with this code (legacy)
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

// User upload API (user submits, admin approves)
export const userUploadAPI = {
    createUpload: (formData) => apiClient.post('/user-uploads', formData, {
        timeout: 300000 // 5 minute timeout for large files
    }),
    getUploads: (status = 'pending') =>
        apiClient.get('/user-uploads', { params: { status } }),
    getUploadUrl: (uploadId) =>
        apiClient.get(`/user-uploads/${uploadId}/url`),
    approveUpload: (uploadId) =>
        apiClient.post(`/user-uploads/${uploadId}/approve`),
    deleteUpload: (uploadId) =>
        apiClient.delete(`/user-uploads/${uploadId}`)
};
